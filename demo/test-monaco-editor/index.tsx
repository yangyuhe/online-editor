import { createRoot } from 'react-dom/client';
import * as React from 'react';
import { App } from './app';
import './index.css';

let root;

export function render() {
    if (!root) {
        const rootDom = document.getElementById('app');
        root = createRoot(rootDom);
    }

    root.render(<App />);
}