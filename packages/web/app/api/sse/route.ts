import { listFiles } from '@online-editor/parser/server/listFiles';
import { NextRequest } from 'next/server';
import path from 'path';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const project = params.get('project');
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();
  const fsData = await listFiles(
    path.resolve(process.env.APPS_DIR, project),
    path.resolve(process.env.PLAYGROUND_DIR, 'node_modules/.pnpm')
  );

  writer
    .write(encoder.encode('data: ' + JSON.stringify(fsData) + '\n\n'))
    .then(() => {
      console.log('写成功');
    })
    .catch((err) => {
      console.error('写错误', err);
    });

  return new Response(responseStream.readable, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/event-stream; charset=utf-8',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none'
    }
  });
}
