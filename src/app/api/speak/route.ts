import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

function numberToEnglish(n: number): string {
  if (n === 0) return 'zero';
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1_000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numberToEnglish(n % 100) : '');
  if (n < 1_000_000) return numberToEnglish(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numberToEnglish(n % 1000) : '');
  return numberToEnglish(Math.floor(n / 1_000_000)) + ' million' + (n % 1_000_000 ? ' ' + numberToEnglish(n % 1_000_000) : '');
}

function sanitizeForTTS(text: string): string {
  return text
    // Remove emojis (and optional variation selector / combining enclosing keycap)
    .replace(/\p{Extended_Pictographic}[️⃣]?/gu, '')
    // Strip markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove table separator rows then remaining pipes
    .replace(/^\|[-|\s:]+\|$/gm, '')
    .replace(/\|/g, ' ')
    // Phonetic fixes for Philippine proper nouns
    .replace(/\bEDSA\b/g, 'Edsah')
    .replace(/\bTaguig\b/gi, 'Tagig')
    .replace(/\bPasay\b/gi, 'Paahsigh')
    .replace(/\bBaguio\b/gi, 'Bagyo')
    .replace(/\bMandaluyong\b/gi, 'Maandaluyong')
    .replace(/\bQuezon\b/gi, 'Kezon')
    // ₱ prices — expand to spoken form (use explicit ₱ to avoid code-point ambiguity)
    .replace(/₱\s*([\d,]+)(?:\.(\d+))?/g, (_, pesos, cents) => {
      const p = pesos.replace(/,/g, '');
      const c = cents ? parseInt(cents, 10) : 0;
      return c > 0 ? `${p} Pesos and ${c} centavos` : `${p} Pesos`;
    })
    // Strip trailing .00 from any bare number not already handled above
    .replace(/(\d[\d,]*)\.00(?=\D|$)/g, '$1')
    // Unit ranges: 200g-300g → 200 to 300 grams (must run before individual expansions)
    .replace(/(\d+)\s*kcal\s*[-–—]\s*(\d+)\s*kcal\b/gi, '$1 to $2 kilocalories')
    .replace(/(\d+)\s*kg\s*[-–—]\s*(\d+)\s*kg\b/gi, '$1 to $2 kilograms')
    .replace(/(\d+)\s*mg\s*[-–—]\s*(\d+)\s*mg\b/gi, '$1 to $2 milligrams')
    .replace(/(\d+)\s*ml\s*[-–—]\s*(\d+)\s*ml\b/gi, '$1 to $2 milliliters')
    .replace(/(\d+)\s*lbs?\s*[-–—]\s*(\d+)\s*lbs?\b/gi, '$1 to $2 pounds')
    .replace(/(\d+)\s*oz\s*[-–—]\s*(\d+)\s*oz\b/gi, '$1 to $2 ounces')
    .replace(/(\d+)\s*tbsp\s*[-–—]\s*(\d+)\s*tbsp\b/gi, '$1 to $2 tablespoons')
    .replace(/(\d+)\s*tsp\s*[-–—]\s*(\d+)\s*tsp\b/gi, '$1 to $2 teaspoons')
    .replace(/(\d+)\s*pcs?\s*[-–—]\s*(\d+)\s*pcs?\b/gi, '$1 to $2 pieces')
    .replace(/(\d+)\s*g\s*[-–—]\s*(\d+)\s*g\b/gi, '$1 to $2 grams')
    .replace(/(\d+)\s*[Ll]\s*[-–—]\s*(\d+)\s*[Ll]\b/g, '$1 to $2 liters')
    // Expand unit abbreviations — longer/more specific first to avoid partial matches
    .replace(/(\d+)\s*kcal\b/gi, '$1 kilocalories')
    .replace(/(\d+)\s*kg\b/gi, '$1 kilograms')
    .replace(/(\d+)\s*mg\b/gi, '$1 milligrams')
    .replace(/(\d+)\s*ml\b/gi, '$1 milliliters')
    .replace(/(\d+)\s*lbs?\b/gi, '$1 pounds')
    .replace(/(\d+)\s*oz\b/gi, '$1 ounces')
    .replace(/(\d+)\s*tbsp\b/gi, '$1 tablespoons')
    .replace(/(\d+)\s*tsp\b/gi, '$1 teaspoons')
    .replace(/(\d+)\s*pcs?\b/gi, '$1 pieces')
    .replace(/(\d+)\s*g\b/gi, '$1 grams')
    .replace(/(\d+)\s*[Ll]\b/g, '$1 liters')
    // Spell out all remaining bare numerals in English so the TTS model never switches language
    .replace(/\b(\d+)\b/g, (_, n) => numberToEnglish(parseInt(n, 10)))
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const sanitized = sanitizeForTTS(text);
    if (!sanitized) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const response = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FISH_API_KEY}`,
        'Content-Type': 'application/json',
        model: 's2.1-pro-free',
      },
      body: JSON.stringify({
        text: sanitized,
        reference_id: process.env.FISH_REFERENCE_ID_EN,
        format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Fish Audio error:', error);
      return NextResponse.json(
        { error: 'Fish Audio request failed', details: error },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
