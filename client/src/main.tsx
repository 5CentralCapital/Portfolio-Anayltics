import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress HTML5 backend error from Replit environment
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const errorMessage = args.join(' ');
  if (errorMessage.includes('Cannot have two HTML5 backends at the same time')) {
    return; // Silently ignore this Replit environment error
  }
  originalConsoleError.apply(console, args);
};

// Handle unhandled promise rejections for the same error
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && 
      event.reason.message.includes('Cannot have two HTML5 backends at the same time')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <App />
);
