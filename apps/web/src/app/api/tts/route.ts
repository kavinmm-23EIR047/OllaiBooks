import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function splitTextIntoChunks(text: string, maxLen = 180): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.?!,\n।])/g);
  let current = '';

  for (const s of sentences) {
    if ((current + s).length <= maxLen) {
      current += s;
    } else {
      if (current.trim()) chunks.push(current.trim());
      if (s.length > maxLen) {
        // Break long sentence by spaces
        const words = s.split(' ');
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).length <= maxLen) {
            wordChunk += (wordChunk ? ' ' : '') + w;
          } else {
            if (wordChunk.trim()) chunks.push(wordChunk.trim());
            wordChunk = w;
          }
        }
        current = wordChunk;
      } else {
        current = s;
      }
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

function sanitizeTtsText(text: string, lang: string): string {
  let cleaned = text;

  // Convert Indian Rupee symbols and percentages to natural spoken native words
  if (lang === 'ta') {
    cleaned = cleaned
      .replace(/₹\s*([0-9,]+)/g, '$1 ரூபாய்')
      .replace(/%/g, ' சதவிகிதம்')
      .replace(/\+/g, ' மற்றும் ')
      .replace(/\(/g, ', ')
      .replace(/\)/g, ', ');
  } else if (lang === 'hi') {
    cleaned = cleaned
      .replace(/₹\s*([0-9,]+)/g, '$1 रुपये')
      .replace(/%/g, ' प्रतिशत')
      .replace(/\+/g, ' और ')
      .replace(/\(/g, ', ')
      .replace(/\)/g, ', ');
  } else if (lang === 'te') {
    cleaned = cleaned
      .replace(/₹\s*([0-9,]+)/g, '$1 రూపాయలు')
      .replace(/%/g, ' శాతం')
      .replace(/\+/g, ' మరియు ')
      .replace(/\(/g, ', ')
      .replace(/\)/g, ', ');
  } else if (lang === 'kn') {
    cleaned = cleaned
      .replace(/₹\s*([0-9,]+)/g, '$1 ರೂಪಾಯಿ')
      .replace(/%/g, ' ಪ್ರತಿಶತ')
      .replace(/\+/g, ' ಮತ್ತು ')
      .replace(/\(/g, ', ')
      .replace(/\)/g, ', ');
  } else if (lang === 'ml') {
    cleaned = cleaned
      .replace(/₹\s*([0-9,]+)/g, '$1 രൂപ')
      .replace(/%/g, ' ശതമാനം')
      .replace(/\+/g, ' ഒപ്പം ')
      .replace(/\(/g, ', ')
      .replace(/\)/g, ', ');
  } else {
    cleaned = cleaned
      .replace(/₹\s*([0-9,]+)/g, 'Rs $1')
      .replace(/%/g, ' percent')
      .replace(/\+/g, ' plus ')
      .replace(/\(/g, ', ')
      .replace(/\)/g, ', ');
  }

  // Remove quotes, brackets, colons that cause audio stutter or unnatural pauses
  cleaned = cleaned.replace(/["“”*:#[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawText = (searchParams.get('text') || '').trim();
  const lang = (searchParams.get('lang') || 'en').trim().toLowerCase();

  if (!rawText) {
    return new NextResponse('Text query parameter is required', { status: 400 });
  }

  const text = sanitizeTtsText(rawText, lang);

  // Supported languages mapping for High-Definition Indian voice synthesis
  const validLangs: Record<string, string> = {
    ta: 'ta',
    hi: 'hi',
    te: 'te',
    ml: 'ml',
    kn: 'kn',
    en: 'en-IN',
  };

  const targetLang = validLangs[lang] || 'en-IN';
  const chunks = splitTextIntoChunks(text, 180);

  try {
    const audioBuffers: Uint8Array[] = [];

    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
        targetLang
      )}&client=tw-ob&q=${encodeURIComponent(chunk)}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (!res.ok) {
        throw new Error(`TTS upstream returned status ${res.status}`);
      }

      const arrBuf = await res.arrayBuffer();
      audioBuffers.push(new Uint8Array(arrBuf));
    }

    // Concatenate all chunks into a single unified MP3 audio stream
    const totalLength = audioBuffers.reduce((acc, b) => acc + b.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of audioBuffers) {
      combined.set(buf, offset);
      offset += buf.length;
    }

    return new Response(combined, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(totalLength),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error: any) {
    return new NextResponse(`TTS Generation Error: ${error.message}`, { status: 500 });
  }
}

