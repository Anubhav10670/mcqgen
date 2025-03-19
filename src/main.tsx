import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
const apikey = "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"; //api key entered , change in future if needed, also dont forgot to change the model name.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
