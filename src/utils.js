// Utility functions for the Dipesh Tutorials app

/**
 * Export data as a CSV file download
 */
export function exportCSV(filename, headers, rows) {
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Show a toast notification (non-blocking)
 */
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        padding: 12px 24px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
        color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeSlideUp 0.3s ease;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#0A2351'};
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/**
 * Wrap a promise with a timeout. Rejects if not resolved within `ms` milliseconds.
 */
export function withTimeout(promise, ms = 10000) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), ms)
    );
    return Promise.race([promise, timeout]);
}

// Web Audio API notification tone (no external dependency)
export function playNotificationTone() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
        oscillator.frequency.setValueAtTime(1108, ctx.currentTime + 0.1); // C#6
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        // Silently fail if Web Audio not available
    }
}

/**
 * Initialize pull-to-refresh for Capacitor native apps.
 * Shows a gold progress bar at top when pulling down from scroll position 0.
 * Triggers page reload when pulled past 95% threshold.
 */
export function initPullToRefresh() {
    if (typeof window === 'undefined') return;

    let startY = 0;
    let indicator = null;

    function getOrCreateIndicator() {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pull-refresh';
            indicator.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; height: 3px;
                background: var(--gold, #B6922E); transform: scaleX(0);
                transform-origin: left; transition: transform 0.2s; z-index: 9999;
            `;
            document.body.prepend(indicator);
        }
        return indicator;
    }

    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (startY === 0 || window.scrollY > 0) return;
        const dist = e.touches[0].clientY - startY;
        if (dist > 0 && dist < 150) {
            getOrCreateIndicator().style.transform = `scaleX(${dist / 150})`;
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        const ind = document.getElementById('pull-refresh');
        if (ind) {
            const scale = parseFloat(ind.style.transform.replace('scaleX(', '').replace(')', ''));
            if (scale >= 0.95) {
                ind.style.background = 'var(--success, #0c8b51)';
                ind.style.transform = 'scaleX(1)';
                setTimeout(() => window.location.reload(), 300);
            } else {
                ind.style.transform = 'scaleX(0)';
            }
        }
        startY = 0;
    }, { passive: true });
}
