// src/app/api/chat/route.ts
import { google } from '@ai-sdk/google';
import { 
  convertToModelMessages, 
  createUIMessageStreamResponse, 
  streamText, 
  toUIMessageStream, 
  UIMessage
} from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-3.1-flash-lite'),
    system: `You are a helpful assistant for SM Markets, a grocery store chain in the Philippines.
      You will be given a series of messages from a user. You should respond in a helpful and concise manner, providing information about SM Markets' products, services, promotions, and store locations.
      If the user asks for information that you do not know, respond with "I'm sorry, I don't have that information." Do not make up answers.
      Keep your responses brief and to the point.`,
    messages: await convertToModelMessages(messages),
    onError: (error) => {
        // THIS WILL SHOW UP IN YOUR SERVER / TERMINAL CONSOLE
        console.error('AI Stream Error:', error);
      },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages, // <-- This allows the client UI to match incoming chunks to messages
    }),
  });
}