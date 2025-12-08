import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function GET() {
  const imagePath = path.join(process.cwd(), 'resource', 'QuantDirect.png');

  try {
    const file = await fs.readFile(imagePath);
    const sliced = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
    const body = (sliced instanceof ArrayBuffer ? sliced : sliced.slice(0)) as ArrayBuffer;

    return new NextResponse(body, {
      headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Failed to serve QuantDirect icon:', error);
    return new NextResponse(null, { status: 404 });
  }
}
