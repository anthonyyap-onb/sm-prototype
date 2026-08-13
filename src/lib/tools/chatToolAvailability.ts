export type ChatPageContext = 'shopping' | 'checkout';

export function getChatToolAvailability(pageContext: ChatPageContext) {
  return {
    checkoutCart: pageContext === 'shopping',
    promotions: pageContext === 'checkout',
  };
}
