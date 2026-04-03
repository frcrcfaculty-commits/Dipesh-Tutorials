import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.dipeshtutorials.app',
    appName: 'Dipesh Tutorials',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
    },
    plugins: {
        SplashScreen: {
            launchAutoHide: true,
            launchShowDuration: 2000,
            backgroundColor: '#0A2351',
            showSpinner: true,
            spinnerColor: '#B6922E',
            androidScaleType: 'CENTER_CROP',
            splashFullScreen: true,
            splashImmersive: true,
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#0A2351',
        },
        Keyboard: {
            resize: 'Native' as any,
            resizeOnFullScreen: true,
        },
    },
};

export default config;
