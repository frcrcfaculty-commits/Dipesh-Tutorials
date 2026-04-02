import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { initPullToRefresh } from './utils';

// Initialize native plugins when running as a native app
if (Capacitor.isNativePlatform()) {
    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#0A2351' });
    }).catch(() => { });
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        SplashScreen.hide();
    }).catch(() => { });
    import('@capacitor/keyboard').then(({ Keyboard }) => {
        Keyboard.setAccessoryBarVisible({ isVisible: true });
    }).catch(() => { });

    // Enable pull-to-refresh gesture for mobile
    initPullToRefresh();
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
