if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.warn('SW registration failed:', err);
        });
    });
}
