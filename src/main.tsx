// Ensure window.fetch is writable so browser extensions or interceptors do not throw "Cannot set property fetch which has only a getter"
try {
  const origFetch = window.fetch;
  if (origFetch) {
    let currentFetch = typeof origFetch === 'function' ? origFetch.bind(window) : origFetch;
    Object.defineProperty(window, 'fetch', {
      get: () => currentFetch,
      set: (fn) => {
        currentFetch = fn;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch {
  // Ignore descriptor errors
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
