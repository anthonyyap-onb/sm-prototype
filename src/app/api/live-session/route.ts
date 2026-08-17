import { GoogleGenAI, Modality } from '@google/genai';
import { NextResponse } from 'next/server';
import {
  buildLiveSystemPrompt,
  type LiveSystemPromptContext,
} from '@/lib/live/buildLiveSystemPrompt';
import { getLiveToolDeclarations } from '@/lib/live/liveToolDeclarations';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GENERATIVE_AI_API_KEY missing' },
        { status: 500 }
      );
    }

    const context = (await req.json()) as LiveSystemPromptContext;
    const systemPrompt = buildLiveSystemPrompt(context);
    const toolDeclarations = getLiveToolDeclarations(context.pageContext);

    const ai = new GoogleGenAI({ apiKey });

    const expireTime = new Date(Date.now() + 30 * 60 * 1_000).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: 'models/gemini-3.1-flash-live-preview',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            tools: [{ functionDeclarations: toolDeclarations }],
          },
        },
      },
    });

    return NextResponse.json({ accessToken: token.name });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
