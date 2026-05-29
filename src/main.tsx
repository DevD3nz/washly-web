import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import './styles/print.css';

const rootEl = document.getElementById('root');

if (!rootEl) {
  document.body.innerHTML =
    '<p style="padding:2rem;font-family:system-ui">WashLy: missing #root element.</p>';
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StrictMode>,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    rootEl.innerHTML = `<div style="padding:2rem;font-family:system-ui;max-width:32rem">
      <p style="font-weight:600;color:#b91c1c">WashLy failed to start</p>
      <pre style="margin-top:1rem;padding:1rem;background:#fef2f2;border-radius:8px;overflow:auto;font-size:12px">${msg}</pre>
      <p style="margin-top:1rem;font-size:14px;color:#64748b">Run <code>cd web</code> then <code>npm run dev</code> and open <strong>http://localhost:5173</strong></p>
    </div>`;
    console.error(err);
  }
}
