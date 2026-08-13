import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const formData = await req.formData();
  const audioFile = formData.get('audio') as File | null;

  if (!audioFile) {
    return Response.json({ transcript: '' }, { status: 400 });
  }

  const arrayBuffer = await audioFile.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');
  const mediaType = (audioFile.type || 'audio/webm') as `audio/${string}`;

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
