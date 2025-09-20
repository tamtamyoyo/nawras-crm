import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSentry } from "./lib/sentry";

// Initialize Sentry monitoring
initSentry();

// Global error handlers to prevent console noise
window.addEventListener('error', (event) => {
  // Only log errors in development mode
  if (import.meta.env.DEV) {
    console.error('Global error caught:', event.error)
  }
  // Prevent the error from being logged to console in production
  if (!import.meta.env.DEV) {
    event.preventDefault()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  // Handle specific known errors silently
  const reason = event.reason
  
  // Suppress network errors that are handled by application retry logic
  if (reason instanceof Error) {
    const message = reason.message.toLowerCase()
    if (message.includes('failed to fetch') || 
        message.includes('network error') ||
        message.includes('connection closed')) {
      // These are handled by the application's retry mechanisms
      event.preventDefault()
      return
    }
  }
  
  // Only log unhandled rejections in development mode
  if (import.meta.env.DEV) {
    console.error('Unhandled promise rejection:', reason)
  }
  
  // Prevent the error from being logged to console in production
  if (!import.meta.env.DEV) {
    event.preventDefault()
  }
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
