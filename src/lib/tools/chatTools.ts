import type { Product, PromoApplicationResult, PromoEvaluation } from '@/types';

export interface AddToCartArgs {
  productId?: string;
  productName: string;
  price?: number;
  imageUrl?: string;
  weight?: string;
  ingredientNumber?: number;
  quantity?: number;
  isAlternative?: boolean;
  originalIngredientName?: string;
}

export interface ChatToolOutput {
  tool: 'addToCart' | 'checkout_cart' | 'setStoreLocation' | 'fetch_promos' | 'apply_promos';
  toolCallId: string;
  output: {
    success: boolean;
    message: string;
    data?: PromoEvaluation[] | PromoApplicationResult;
  };
}

export interface ClientChatToolCall {
  toolName: string;
  toolCallId: string;
  input: unknown;
}

export interface ChatToolDependencies {
  inventory: Product[];
  addToCart: (product: Product) => void;
  addToolOutput: (output: ChatToolOutput) => void;
  markStoreChangeAsToolTriggered: () => void;
  changeStore: (storeId: string) => void;
  fetchPromos: () => PromoEvaluation[];
  applyPromos: (ids: string[]) => PromoApplicationResult;
  navigateToCheckout: () => void;
}

export function handleChatToolCall(
  toolCall: ClientChatToolCall,
  dependencies: ChatToolDependencies
): void {
  if (toolCall.toolName === 'setStoreLocation') {
    const args = toolCall.input as { storeId: string; storeName: string };
    dependencies.markStoreChangeAsToolTriggered();
    dependencies.changeStore(args.storeId);
    dependencies.addToolOutput({
      tool: 'setStoreLocation',
      toolCallId: toolCall.toolCallId,
      output: {
        success: true,
        message: `Store set to ${args.storeName}.`,
      },
    });
    return;
  }

  if (toolCall.toolName === 'checkout_cart') {
    dependencies.navigateToCheckout();
    dependencies.addToolOutput({
      tool: 'checkout_cart',
      toolCallId: toolCall.toolCallId,
      output: {
        success: true,
        message: 'Redirecting to checkout.',
      },
    });
    return;
  }

  if (toolCall.toolName === 'fetch_promos') {
    dependencies.addToolOutput({
      tool: 'fetch_promos',
      toolCallId: toolCall.toolCallId,
      output: {
        success: true,
        message: 'Promotions fetched.',
        data: dependencies.fetchPromos(),
      },
    });
    return;
  }

  if (toolCall.toolName === 'apply_promos') {
    const promoIds = getPromoIds(toolCall.input);
    if (!promoIds) {
      dependencies.addToolOutput({
        tool: 'apply_promos',
        toolCallId: toolCall.toolCallId,
        output: { success: false, message: 'No promotion IDs were provided.' },
      });
      return;
    }

    const previouslyAppliedPromoIds = new Set(
      dependencies
        .fetchPromos()
        .filter((evaluation) => evaluation.applied)
        .map((evaluation) => evaluation.promo.id)
    );
    const result = dependencies.applyPromos(promoIds);
    const hasNewlyAppliedPromo = promoIds.some(
      (id) =>
        !previouslyAppliedPromoIds.has(id) &&
        result.appliedIds.includes(id) &&
        !result.rejected.some((rejection) => rejection.id === id)
    );
    dependencies.addToolOutput({
      tool: 'apply_promos',
      toolCallId: toolCall.toolCallId,
      output: {
        success: hasNewlyAppliedPromo,
        message: hasNewlyAppliedPromo ? 'Promotions applied.' : 'No promotions were applied.',
        data: result,
      },
    });
    return;
  }

  if (toolCall.toolName !== 'addToCart') return;

  const args = toolCall.input as AddToCartArgs;
  const qty = args.quantity ?? 1;
  let output: ChatToolOutput['output'];

  if (args.productId) {
    const matched = dependencies.inventory.find((product) => product.id === args.productId);
    if (matched) {
      for (let i = 0; i < qty; i++) dependencies.addToCart(matched);
      output = { success: true, message: `Added ${matched.name} × ${qty} to cart.` };
    } else {
      output = {
        success: false,
        message: `Product ID ${args.productId} not found in current store inventory.`,
      };
    }
  } else if (args.price !== undefined) {
    const syntheticProduct: Product = {
      id: `llm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: args.productName,
      imageUrl: args.imageUrl ?? '',
      weight: args.weight ?? '',
      price: args.price,
    };
    for (let i = 0; i < qty; i++) dependencies.addToCart(syntheticProduct);
    output = { success: true, message: `Added ${args.productName} × ${qty} to cart.` };
  } else {
    output = {
      success: false,
      message: `Could not add ${args.productName} to cart — no inventory match found. Please select it manually from the store page.`,
    };
  }

  dependencies.addToolOutput({
    tool: 'addToCart',
    toolCallId: toolCall.toolCallId,
    output,
  });
}

function getPromoIds(input: unknown): string[] | null {
  if (!input || typeof input !== 'object' || !('promoIds' in input)) return null;
  const { promoIds } = input as { promoIds?: unknown };
  return Array.isArray(promoIds) && promoIds.length > 0 && promoIds.every((id) => typeof id === 'string')
    ? promoIds
    : null;
}
