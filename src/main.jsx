import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store.js';
import App from './App.jsx';
import './index.css';

const root = document.documentElement;
const hasSession = !!localStorage.getItem('token');
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const shouldUseDark = hasSession && (savedTheme ? savedTheme === 'dark' : prefersDark);

root.classList.toggle('dark', shouldUseDark);
root.style.colorScheme = shouldUseDark ? 'dark' : 'light';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
