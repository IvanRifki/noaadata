/**
 * WEATHER MODULE
 * Handles regional weather forecasts and dynamic icons.
 */

import { CONFIG } from './config.js';

export class WeatherModule {
    constructor(map) {
        this.map = map;
        this.layer = map.layers.overlay.weather;
        this.prefetchTriggers = [];
        this.hasTriggered = false;
    }

    init() {
        CONFIG.LOCATIONS.forEach(loc => {
            const marker = this.createMarker(loc);
            marker.addTo(this.layer);
        });

        this.map.instance.on('overlayadd', (e) => {
            if (e.name === 'Prakiraan Cuaca' && !this.hasTriggered) {
                this.hasTriggered = true;
                this.prefetchTriggers.forEach(fn => fn());
            }
        });
    }

    createMarker(loc) {
        const defaultStyle = CONFIG.WEATHER_ICONS['Default'];
        const markerHtml = `
            <div class="weather-marker-container" style="background: ${defaultStyle.color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 5px rgba(0,0,0,0.3); transition: all 0.3s ease;">
                <i class='bx ${defaultStyle.icon} weather-icon' style="color: white; font-size: 14px;"></i>
            </div>
        `;

        const icon = L.divIcon({
            html: markerHtml,
            className: 'leaflet-div-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker([loc.lat, loc.lng], { icon: icon });
        const popup = L.popup().setLatLng([loc.lat, loc.lng]);
        
        let state = { loaded: false, fetching: false, html: '', data: null };

        const fetchData = async () => {
            if (state.loaded || state.fetching) return;
            state.fetching = true;
            
            try {
                const res = await fetch(CONFIG.API.WEATHER(loc.adm4));
                if (!res.ok) throw new Error('API Error');
                const json = await res.json();
                
                if (json.data?.[0]?.cuaca?.[0]?.length > 0) {
                    const current = json.data[0].cuaca[0][0];
                    state.data = current;
                    this.updateMarkerIcon(marker, current.weather_desc);
                    state.html = this.generatePopupHtml(loc.name, current);
                } else {
                    state.html = `<div style="color: #ef4444; font-size: 12px; text-align: center;">Data tidak tersedia</div>`;
                }
            } catch (error) {
                state.html = `<div style="color: #ef4444; font-size: 11px;">Gagal memuat cuaca: ${loc.name}</div>`;
            } finally {
                state.loaded = true;
                state.fetching = false;
                if (popup.isOpen()) popup.setContent(state.html);
            }
        };

        this.prefetchTriggers.push(fetchData);

        marker.on('click', () => {
            if (!state.loaded) {
                popup.setContent(`<div style="min-width: 150px; text-align: center;"><i class='bx bx-loader-alt bx-spin'></i> Memuat ${loc.name}...</div>`);
                fetchData();
            } else {
                popup.setContent(state.html);
            }
            popup.openOn(this.map.instance);
        });

        return marker;
    }

    updateMarkerIcon(marker, desc) {
        const style = this.getStyleByDesc(desc);
        const el = marker.getElement();
        if (el) {
            const container = el.querySelector('.weather-marker-container');
            const icon = el.querySelector('.weather-icon');
            if (container) container.style.background = style.color;
            if (icon) {
                icon.className = `bx ${style.icon} weather-icon`;
            }
        }
    }

    getStyleByDesc(desc) {
        const d = desc.toLowerCase();
        for (const [key, val] of Object.entries(CONFIG.WEATHER_ICONS)) {
            if (d.includes(key.toLowerCase())) return val;
        }
        return CONFIG.WEATHER_ICONS['Default'];
    }

    generatePopupHtml(name, data) {
        return `
            <div style="font-family: Inter; min-width: 180px;">
                <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 4px;">Prakiraan Cuaca</div>
                <div style="font-size: 13px; color: #475569; font-weight: 600;">${name}</div>
                <hr style="margin: 6px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #334155;">
                    <span>Kondisi:</span> <strong>${data.weather_desc}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #334155; margin-top:2px;">
                    <span>Suhu:</span> <strong>${data.t}°C</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #334155; margin-top:2px;">
                    <span>Kelembapan:</span> <strong>${data.hu}%</strong>
                </div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 8px; text-align: right;">
                    Update: ${data.local_datetime}
                </div>
            </div>
        `;
    }
}
