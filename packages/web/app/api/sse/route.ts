import { listFiles } from '@online-editor/parser/server/listFiles';
import { NextRequest } from 'next/server';
import path from 'path';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const project = params.get('project');
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const fsWatcher = listFiles(
    path.resolve(process.env.APPS_DIR, project),
    path.resolve(process.env.PLAYGROUND_DIR, 'node_modules/.pnpm'),
    (fsData) => {
      writer
        .write('data: ' + JSON.stringify(fsData) + '\n\n')
        .then(() => {
          console.log('写成功');
        })
        .catch((err) => {
          console.error('写错误', err);
          console.log('关闭fswatcher111');
          fsWatcher.close();
          if (!writer.closed) writer.close();
        });
    }
  );

  const response = new Response(responseStream.readable, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/event-stream; charset=utf-8',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none'
    }
  });
  return response;
}
