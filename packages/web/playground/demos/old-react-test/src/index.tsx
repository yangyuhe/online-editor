import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <div>hello</div>;
}

const rootDom = document.getElementById('app');
const root = createRoot(rootDom);
root.render(<App />);
