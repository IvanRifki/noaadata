/**
 * MAIN APPLICATION ENTRY POINT
 * Coordinates all modular components of the BMKG Dashboard.
 */

import { MapModule } from './modules/map.js';
import { ChartsModule } from './modules/charts.js';
import { EarthquakeModule } from './modules/earthquake.js';
import { WeatherModule } from './modules/weather.js';
import { NowcastModule } from './modules/nowcast.js';

class BMKGApp {
    constructor() {
        this.map = new MapModule('stationMap');
        this.charts = new ChartsModule();
        this.earthquake = new EarthquakeModule(this.map, this.charts);
        this.weather = new WeatherModule(this.map);
        this.nowcast = new NowcastModule(this.map);
        
        this.init();
    }

    async init() {
        // Initialize Base Components
        this.charts.init();
        this.map.init();
        
        // Initialize Logic Modules
        this.weather.init();
        
        // Start Data Fetchers
        this.initLoader();
        
        // Concurrent fetching for better performance
        await Promise.all([
            this.earthquake.fetch(),
            this.nowcast.fetchTickerData()
        ]);
        
        this.hideLoader();
    }

    initLoader() {
        this.loadingPercent = 0;
        this.progressEl = document.getElementById('loading-percent');
        this.loadingInterval = setInterval(() => {
            if (!this.progressEl) return;
            if (this.loadingPercent < 95) {
                this.loadingPercent += Math.max(1, Math.floor(Math.random() * 5));
                if (this.loadingPercent > 95) this.loadingPercent = 95;
                this.progressEl.textContent = this.loadingPercent + '%';
            }
        }, 50);
    }

    hideLoader() {
        console.log("Dashboard fully initialized.");
        if (this.loadingInterval) clearInterval(this.loadingInterval);
        if (this.progressEl) this.progressEl.textContent = '100%';

        setTimeout(() => {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.classList.add('fade-out');
                setTimeout(() => loader.remove(), 600);
            }
        }, 300);
    }
}

// Spark the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BMKGApp();
});
