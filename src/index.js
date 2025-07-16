import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// You might have a separate CSS file for global styles or Tailwind directives here
// import './tailwind.css'; // If you're using a build process for Tailwind

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
