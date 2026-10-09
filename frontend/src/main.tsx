import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { QuotePage } from './pages/quote-page.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuotePage />
  </StrictMode>,
);
