type ChatPageContext = 'shopping' | 'checkout';

type ScrollTarget = {
  scrollIntoView(options: ScrollIntoViewOptions): void;
};

export function shouldShowMessageSuggestionChips(
  pageContext: ChatPageContext,
  messageIndex: number,
  role: string
) {
  return pageContext === 'shopping' && messageIndex === 0 && role === 'assistant';
}

export function shouldShowCheckoutSuggestionChips(
  pageContext: ChatPageContext,
  dismissed: boolean
) {
  return pageContext === 'checkout' && !dismissed;
}

export function scrollChatToLatest(
  isOpen: boolean,
  target: ScrollTarget | null,
  behavior: ScrollBehavior = 'smooth'
) {
  if (!isOpen || !target) return;
  target.scrollIntoView({ behavior });
}
