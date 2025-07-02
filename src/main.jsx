// src/main.jsx
// This file is the entry point for your React application.
// It imports the main App component and renders it into the DOM.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import your main App component
import './index.css'; // Import your global CSS (including Tailwind)

// Create a React root and render the App component into the div with id 'root'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
