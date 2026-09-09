import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against Firestore SDK internal watch target assertion errors (ID: ca9 / b815)
window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  const msg = typeof reason === 'string' ? reason : reason?.message || '';
  if (msg.includes('FIRESTORE') && (msg.includes('INTERNAL ASSERTION') || msg.includes('ca9') || msg.includes('b815'))) {
    console.warn('[Firestore SDK Handled Internal Warning]:', msg);
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (msg.includes('FIRESTORE') && (msg.includes('INTERNAL ASSERTION') || msg.includes('ca9') || msg.includes('b815'))) {
    console.warn('[Firestore SDK Handled Internal Error]:', msg);
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
