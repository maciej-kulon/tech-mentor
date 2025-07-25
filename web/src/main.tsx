// ═══════════════════════════════════════════════════════════════
// REACT APPLICATION ENTRY POINT
// This is where your React app starts - think of it as main() in other languages
// ═══════════════════════════════════════════════════════════════

// React imports
import React from "react"; // Core React library
import ReactDOM from "react-dom/client"; // React DOM library for web browsers

// Import our main App component (the one we just commented)
import App from "./App.tsx";
// Import i18n configuration (must be imported before App)
import "./i18n";
// Import global CSS styles that apply to the entire application
import "./index.css";

// ═══════════════════════════════════════════════════════════════
// CONNECTING REACT TO THE HTML PAGE
// ═══════════════════════════════════════════════════════════════

// Find the HTML element with id="root" in index.html
// This is where React will insert our entire application
// document.getElementById('root') returns the DOM element
// ReactDOM.createRoot() creates a React "root" that can render components
ReactDOM.createRoot(document.getElementById("root")!).render(
  // React.StrictMode is a development tool that helps catch problems
  // It doesn't affect production builds, only helps during development
  <React.StrictMode>
    {/* This is where our App component gets rendered */}
    {/* Everything in our app starts from here */}
    <App />
  </React.StrictMode>
);

// ═══════════════════════════════════════════════════════════════
// HOW THIS WORKS:
// ═══════════════════════════════════════════════════════════════
// 1. Browser loads index.html
// 2. index.html contains <div id="root"></div>
// 3. This main.tsx file runs
// 4. React finds the #root element
// 5. React renders our <App /> component inside #root
// 6. App component renders <LoginForm />
// 7. User sees the login form in their browser
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// IMPORTANT NOTES FOR JAVASCRIPT DEVELOPERS NEW TO REACT:
// ═══════════════════════════════════════════════════════════════
// - This file only runs ONCE when the app starts
// - After this, React takes over and manages the page
// - No more manual DOM manipulation (document.getElementById, etc.)
// - React updates the page automatically when state changes
// - Think "declarative" not "imperative" programming
// ═══════════════════════════════════════════════════════════════
