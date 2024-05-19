import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { app: string; segments: string[] } }
) {
  const { app, segments } = params;
  const staticFile = path.resolve(process.env.PLAYGROUND_DIR, app, segments.join('/'));
  try {
    const content = await fs.promises.readFile(staticFile);
    return new Response(content);
  } catch (err) {
    return new Response(err.message, {
      status: 404
    });
  }
}
