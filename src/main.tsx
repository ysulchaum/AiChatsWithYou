import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.tsx';
import Login from './Login.tsx';
import Dashboard from './Dashboard.tsx';
import PaymentRecord from './PaymentRecord.tsx';
import Subscription from './Subscription.tsx';

const GOOGLE_CLIENT_ID = '440558537140-lp91diebegu9i93m98dpuiq5tb5fju6v.apps.googleusercontent.com'; // Replace with your Client ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/payment-record" element={<PaymentRecord />} />
          <Route path="/subscription" element={<Subscription />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
);