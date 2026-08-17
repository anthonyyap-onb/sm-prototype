import { GoogleGenAI, Modality } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_GENERATIVE_AI_API_KEY missing' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const expireTime = new Date(Date.now() + 30 * 60 * 1_000).toISOString();

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: 'models/gemini-2.0-flash-live-001',
          config: {
            responseModalities: [Modality.AUDIO],
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
