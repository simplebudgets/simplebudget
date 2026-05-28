import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { registerSW } from 'virtual:pwa-register';
import { usePwaStore } from './store/pwaStore';

// Core route components loaded eagerly so they work offline without needing
// the service worker to have cached their chunks individually.
import BudgetPage from "./components/BudgetPage";
import TransactionsPage from "./components/TransactionsPage";
import AnalyticsPage from "./components/AnalyticsPage";
import SettingsPage from "./components/SettingsPage";

// Auth pages can stay lazy — they require network anyway
const LoginPage = lazy(() => import("./components/LoginPage"));
const SignUpPage = lazy(() => import("./components/SignUpPage"));
const SupabaseConfigPage = lazy(() => import("./components/SupabaseConfigPage"));
const ForgotPasswordPage = lazy(() => import("./components/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./components/ResetPasswordPage"));
const ErrorPage = lazy(() => import("./components/ErrorPage"));

// Register service worker with update prompt
const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
        usePwaStore.getState().setNeedRefresh(true);
    },
    onOfflineReady() {
        console.log('App ready to work offline');
    },
});

// Store the updateSW function so React components can trigger it
usePwaStore.getState().setUpdateSW(updateSW);

// Force update check when the app regains focus (critical for iOS PWA)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        updateSW();
    }
});

window.addEventListener('focus', () => {
    updateSW();
});

const PageLoader = () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
    </Box>
);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path='/' errorElement={<ErrorPage />} element={<App />}>
                        <Route path='budget' element={<BudgetPage />} />
                        <Route path='transactions' element={<TransactionsPage />} />
                        <Route path='analytics' element={<AnalyticsPage />} />
                        <Route path='settings' element={<SettingsPage />} />
                    </Route>
                    <Route path='login' element={<LoginPage />} />
                    <Route path='signup' element={<SignUpPage />} />
                    <Route path='forgot-password' element={<ForgotPasswordPage />} />
                    <Route path='reset-password' element={<ResetPasswordPage />} />
                    <Route path='backend-config' element={<SupabaseConfigPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    </React.StrictMode>
);

reportWebVitals();
