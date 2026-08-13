import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { audioBase64, audioMimeType } = await req.json();

  if (!audioBase64) {
    return Response.json({ transcript: '' }, { status: 400 });
  }

  // Strip the data URL prefix (data:audio/webm;base64,XXX → XXX)
  const base64Data = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;
  const mediaType = audioMimeType || 'audio/webm';

  const { text } = await generateText({
    model: google('gemini-3.1-flash-lite'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Transcribe this audio exactly as spoken. Output only the transcribed words — no labels, punctuation markup, or extra commentary.',
          },
          {
            type: 'file',
            data: base64Data,
            mediaType,
          },
        ],
      },
    ],
  });

  return Response.json({ transcript: text.trim() });
}
