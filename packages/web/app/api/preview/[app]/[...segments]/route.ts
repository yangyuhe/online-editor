import { NextRequest } from 'next/server';
import path from 'path';
import mime from 'mime';
import fs from 'fs';
console.log('进程id:', process.pid);
export async function GET(
  request: NextRequest,
  { params }: { params: { app: string; segments: string[] } }
) {
  const { app, segments } = params;
  const staticFile = path.resolve(process.env.APPS_DIR, app, segments.join('/'));
  try {
    const content = await fs.promises.readFile(staticFile);
    const isjsx = staticFile.endsWith('.tsx') || staticFile.endsWith('.jsx');
    return new Response(content, {
      headers: {
        'Content-Type': mime.getType(isjsx ? '.js' : staticFile)
      }
    });
  } catch (err) {
    return new Response(err.message, {
      status: 404
    });
  }
}
