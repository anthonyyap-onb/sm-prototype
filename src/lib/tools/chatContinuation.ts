import {
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from 'ai';

export function shouldContinueAfterClientTools({ messages }: { messages: UIMessage[] }): boolean {
  return lastAssistantMessageIsCompleteWithToolCalls({ messages });
}
