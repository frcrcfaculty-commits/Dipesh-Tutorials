import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';

// Initialize native plugins when running as a native app
if (Capacitor.isNativePlatform()) {
    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#E8600A' });
    }).catch(() => { });
    import('@capacitor/splash-screen').then(({ SplashScreen }) => {
        SplashScreen.hide();
    }).catch(() => { });
    import('@capacitor/keyboard').then(({ Keyboard }) => {
        Keyboard.setAccessoryBarVisible({ isVisible: true });
    }).catch(() => { });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
