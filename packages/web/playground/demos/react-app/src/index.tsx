import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18n } from './i18n';
import { Cat, Page, PageOne } from './page';

function App() {
  const [c, setC] = useState(0);
  return (
    <I18n>
      what
      <div>hello</div>
      <div>hello2</div>
      <Page>{/* <span>bar</span> */}</Page>
      <Cat />
      <button onClick={() => setC((c) => c + 1)}>out add {c}</button>
    </I18n>
  );
}

const rootDom = document.getElementById('app');
const root = createRoot(rootDom);
root.render(<App />);
