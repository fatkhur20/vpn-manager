// =================================================================================
// Dashboard Page Logic
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initial load of stats
    updateStats();

    // Set an interval to refresh the stats periodically
    setInterval(updateStats, 30000); // Refresh every 30 seconds
});

/**
 * Fetches the latest proxy data from the API and updates the dashboard statistic cards.
 */
async function updateStats() {
    try {
        const response = await fetch('/api/proxies');
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        const proxies = await response.json();

        // Use the same 10-minute cache duration as defined in config.js
        // A more advanced setup might share this constant, but for now this is fine.
        const CACHE_DURATION_MS = 10 * 60 * 1000;
        const now = Date.now();

        const onlineProxiesCount = proxies.filter(p =>
            p.status === 'online' &&
            p.lastChecked &&
            (now - new Date(p.lastChecked).getTime()) < CACHE_DURATION_MS
        ).length;

        // Tunnel and account data are still managed in localStorage for simplicity
        const tunnels = JSON.parse(localStorage.getItem('tunnelServices') || '[]');
        const activeTunnelsCount = tunnels.filter(t => t.status === 'online').length;

        const accounts = JSON.parse(localStorage.getItem('vpnAccounts') || '[]');
        const totalAccountsCount = accounts.length;

        // Update the UI with smooth animations
        animateValue('totalProxies', proxies.length);
        animateValue('onlineProxies', onlineProxiesCount);
        animateValue('activeTunnels', activeTunnelsCount);
        animateValue('totalAccounts', totalAccountsCount);

    } catch (error) {
        console.error('Failed to update dashboard stats:', error);
        // You could add a UI indicator here to show that stats are stale
    }
}

/**
 * Animates a numerical value change in an HTML element.
 * @param {string} elementId - The ID of the element whose text content will be animated.
 * @param {number} endValue - The final numerical value.
 */
function animateValue(elementId, endValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000; // Animation duration in milliseconds
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(startValue + (endValue - startValue) * progress);

        element.textContent = currentValue;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}
