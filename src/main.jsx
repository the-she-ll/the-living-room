import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ?admin opens the guestbook admin page (loaded only when asked for).
const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'));
const isAdmin = new URLSearchParams(window.location.search).has('admin');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={<div className="wood-panel min-h-dvh" />}>
        <AdminPanel />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
);
