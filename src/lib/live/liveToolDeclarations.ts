import { Type, type FunctionDeclaration } from '@google/genai';

const GET_RECENT_CHAT_HISTORY: FunctionDeclaration = {
  name: 'getRecentChatHistory',
  description:
    'Retrieve recent chat and tool-call records from this session for context. Use only when you need additional session context.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: {
        type: Type.NUMBER,
        description: 'Number of records to retrieve (1–50). Defaults to 10.',
      },
    },
  },
};

const SET_STORE_LOCATION: FunctionDeclaration = {
  name: 'setStoreLocation',
  description:
    "Set the user's active SM store branch. Call when the user names a store they want to shop at. Confirm the store name before calling.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      storeId: {
        type: Type.STRING,
        description: 'The exact store ID from the available store list in the system prompt.',
      },
      storeName: {
        type: Type.STRING,
        description: 'Human-readable store name, e.g. "SM Aura Premier".',
      },
    },
    required: ['storeId', 'storeName'],
  },
};

const ADD_TO_CART: FunctionDeclaration = {
  name: 'addToCart',
  description:
    "Add a product to the user's cart. Only call after explicit user confirmation. Use product details from CURRENT INVENTORY DATA — never fabricate product IDs.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: {
        type: Type.STRING,
        description: 'Product ID from CURRENT INVENTORY DATA. Omit if no exact match.',
      },
      productName: {
        type: Type.STRING,
        description: 'Display name of the product.',
      },
      price: {
        type: Type.NUMBER,
        description: 'Price in Philippine Pesos from inventory.',
      },
      imageUrl: {
        type: Type.STRING,
        description: 'Image URL from inventory, if available.',
      },
      weight: {
        type: Type.STRING,
        description: 'Weight or size descriptor from inventory.',
      },
      quantity: {
        type: Type.NUMBER,
        description: 'Number of units to add. Defaults to 1.',
      },
      isAlternative: {
        type: Type.BOOLEAN,
        description: 'True if this is a substitute for an out-of-stock item.',
      },
      originalIngredientName: {
        type: Type.STRING,
        description: 'Name of the original ingredient being replaced, if isAlternative is true.',
      },
    },
    required: ['productName'],
  },
};

const REMOVE_FROM_CART: FunctionDeclaration = {
  name: 'removeFromCart',
  description: "Remove a specific item from the user's cart. Confirm before calling.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: {
        type: Type.STRING,
        description: 'Product ID used when the item was added to the cart.',
      },
      productName: {
        type: Type.STRING,
        description: 'Display name of the product being removed.',
      },
    },
    required: ['productId', 'productName'],
  },
};

const UPDATE_CART_QUANTITY: FunctionDeclaration = {
  name: 'updateCartQuantity',
  description:
    "Update the quantity of an item already in the cart. Setting quantity to 0 removes it. Confirm before calling.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      productId: {
        type: Type.STRING,
        description: 'Product ID used when the item was added to the cart.',
      },
      productName: {
        type: Type.STRING,
        description: 'Display name of the product.',
      },
      quantity: {
        type: Type.NUMBER,
        description: 'New quantity. Use 0 to remove the item.',
      },
    },
    required: ['productId', 'productName', 'quantity'],
  },
};

const CHECKOUT_CART: FunctionDeclaration = {
  name: 'checkout_cart',
  description:
    'Redirect the user to checkout. Only call after items are in the cart and the user explicitly asks to checkout.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const FETCH_PROMOS: FunctionDeclaration = {
  name: 'fetch_promos',
  description:
    'Fetch current checkout promotions and evaluate them against the live cart. Use before recommending any promo.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const APPLY_PROMOS: FunctionDeclaration = {
  name: 'apply_promos',
  description:
    'Apply specific promotion IDs to checkout. Only call after fetch_promos and explicit user confirmation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      promoIds: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Exact promotion IDs confirmed by the user.',
      },
    },
    required: ['promoIds'],
  },
};

const SHOPPING_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  GET_RECENT_CHAT_HISTORY,
  SET_STORE_LOCATION,
  ADD_TO_CART,
  REMOVE_FROM_CART,
  UPDATE_CART_QUANTITY,
  CHECKOUT_CART,
];

const CHECKOUT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  GET_RECENT_CHAT_HISTORY,
  SET_STORE_LOCATION,
  ADD_TO_CART,
  REMOVE_FROM_CART,
  UPDATE_CART_QUANTITY,
  FETCH_PROMOS,
  APPLY_PROMOS,
];

export function getLiveToolDeclarations(
  pageContext: 'shopping' | 'checkout'
): FunctionDeclaration[] {
  return pageContext === 'checkout'
    ? CHECKOUT_TOOL_DECLARATIONS
    : SHOPPING_TOOL_DECLARATIONS;
}
