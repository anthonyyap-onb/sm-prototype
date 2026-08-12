import type { Product } from '@/types';

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
  tool: 'addToCart' | 'checkout_cart' | 'setStoreLocation';
  toolCallId: string;
  output: {
    success: boolean;
    message: string;
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
  navigateToCart: () => void;
  markStoreChangeAsToolTriggered: () => void;
  changeStore: (storeId: string) => void;
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
    dependencies.navigateToCart();
    dependencies.addToolOutput({
      tool: 'checkout_cart',
      toolCallId: toolCall.toolCallId,
      output: {
        success: true,
        message: 'Redirecting to your cart for checkout.',
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
