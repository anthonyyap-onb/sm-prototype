import type { FunctionCall } from '@google/genai';
import {
  formatRecentHistory,
  readChatSession,
  selectChatSessionForRetrieval,
} from '@/lib/chat/chatHistory';
import type { ChatToolDependencies } from '@/lib/tools/chatTools';

export interface LiveToolResponse {
  id: string;
  name: string;
  response: Record<string, unknown>;
}

export async function handleLiveToolCall(
  call: FunctionCall,
  dependencies: ChatToolDependencies
): Promise<LiveToolResponse> {
  const args = (call.args ?? {}) as Record<string, unknown>;
  const id = call.id ?? '';
  const name = call.name ?? '';

  const success = (output: Record<string, unknown>): LiveToolResponse => ({
    id,
    name,
    response: { output },
  });

  switch (name) {
    case 'getRecentChatHistory': {
      const session = readChatSession();
      const message = formatRecentHistory(
        selectChatSessionForRetrieval(session, readChatSession),
        args.limit as number | undefined
      );
      return success({ success: true, message });
    }

    case 'setStoreLocation': {
      const storeId = args.storeId as string;
      const storeName = args.storeName as string;
      dependencies.markStoreChangeAsToolTriggered();
      dependencies.clearCart();
      dependencies.changeStore(storeId);
      return success({ success: true, message: `Store set to ${storeName}.` });
    }

    case 'addToCart': {
      const product = {
        id: (args.productId as string | undefined) ?? `live-${Date.now()}`,
        name: args.productName as string,
        price: (args.price as number | undefined) ?? 0,
        imageUrl: (args.imageUrl as string | undefined) ?? '',
        weight: (args.weight as string | undefined) ?? '',
      };
      dependencies.addToCart(product);
      return success({
        success: true,
        message: `${args.productName} added to cart.`,
      });
    }

    case 'removeFromCart': {
      dependencies.removeItem(args.productId as string);
      return success({
        success: true,
        message: `${args.productName} removed from cart.`,
      });
    }

    case 'updateCartQuantity': {
      const qty = args.quantity as number;
      if (qty === 0) {
        dependencies.removeItem(args.productId as string);
      } else {
        dependencies.setItemQuantity(args.productId as string, qty);
      }
      return success({
        success: true,
        message: `${args.productName} quantity updated to ${qty}.`,
      });
    }

    case 'checkout_cart': {
      dependencies.navigateToCheckout();
      return success({ success: true, message: 'Redirecting to checkout.' });
    }

    case 'fetch_promos': {
      const promos = dependencies.fetchPromos();
      return success({
        success: true,
        message: 'Promotions fetched.',
        data: promos,
      });
    }

    case 'apply_promos': {
      const result = dependencies.applyPromos(args.promoIds as string[]);
      return success({
        success: true,
        message: 'Promotions applied.',
        data: result,
      });
    }

    default:
      return success({ success: false, message: `Unknown tool: ${name}` });
  }
}
