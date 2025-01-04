'use client';
import '@online-editor/parser/web/global.d.ts';
import Script from 'next/script';
export default function Project(props: { params: { app: string } }) {
  const {
    params: { app }
  } = props;

  return (
    <Script type='module' id='preview-entry'>
      {`
      window.__preview_app = "${app}";
      import('/web.js').then((res) => {
    res.onReady(() => {
      import('/${app}/$$SRC/src/index.tsx?'+Date.now());
    });
  });`}
    </Script>
  );
}
