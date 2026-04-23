/**
 * NOWCAST MODULE
 * Handles extreme weather ticker and map markers.
 */

import { CONFIG } from './config.js';

export class NowcastModule {
    constructor(map) {
        this.map = map;
        this.layer = map.layers.overlay.nowcast;
        this.alertLinks = [];
        this.hasLoadedMarkers = false;
    }

    async fetchTickerData() {
        try {
            const res = await fetch(CONFIG.API.NOWCAST);
            if (!res.ok) throw new Error('NOWCAST API unavailable');
            const str = await res.text();

            const parser = new DOMParser();
            const xml = parser.parseFromString(str, "application/xml");
            const items = xml.querySelectorAll('item');
            
            if (items.length > 0) {
                this.renderTicker(items);
            }
        } catch (error) {
            console.error('Failed to load Nowcast ticker', error);
        }
    }

    renderTicker(items) {
        const tickerContent = document.getElementById('ticker-content');
        const tickerContainer = document.getElementById('nowcast-ticker');
        if (!tickerContent || !tickerContainer) return;

        let html = '';
        const maxItems = Math.min(items.length, 15);
        for(let i = 0; i < maxItems; i++) {
            const item = items[i];
            const title = item.querySelector('title')?.textContent || '';
            const desc = item.querySelector('description')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            if (link) this.alertLinks.push(link);
            
            let shortDesc = desc.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            if (shortDesc.length > 180) shortDesc = shortDesc.substring(0, 180) + '...';
            
            html += `<div class="ticker-item"><strong>${title}</strong> &mdash; ${shortDesc}</div>`;
        }
        
        tickerContent.innerHTML = html + html;
        tickerContainer.style.display = 'flex';
        
        const speed = Math.max(40, html.length / 12);
        tickerContent.style.animationDuration = `${speed}s`;

        // Adjust Leaflet controls position
        setTimeout(() => {
            const bottoms = document.querySelectorAll('.leaflet-bottom');
            bottoms.forEach(el => el.style.bottom = '40px');
        }, 1000);

        // Map event for lazy loading markers
        this.map.instance.on('overlayadd', (e) => {
            if (e.name === 'Area Cuaca Ekstrem' && !this.hasLoadedMarkers) {
                this.hasLoadedMarkers = true;
                this.loadMarkers();
            }
        });
    }

    async loadMarkers() {
        for (let url of this.alertLinks) {
            try {
                const proxyUrl = url.replace(CONFIG.API.NOWCAST_BASE, '/nowcast');
                const res = await fetch(proxyUrl);
                if (!res.ok) continue;
                
                const str = await res.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(str, "application/xml");

                const eventText = xml.querySelector('event')?.textContent || '';
                const headline = xml.querySelector('headline')?.textContent || '';
                const polygonText = xml.querySelector('polygon')?.textContent || '';
                
                if (polygonText) {
                    const parts = polygonText.split(' ');
                    if (parts.length > 0) {
                        const coordsArr = parts[0].split(',');
                        if (coordsArr.length >= 2) {
                            const lat = parseFloat(coordsArr[0]);
                            const lng = parseFloat(coordsArr[1]);
                            this.renderEventMarker(lat, lng, eventText, headline);
                        }
                    }
                }
            } catch (error) {
                console.error("Error processing extreme weather XML", error);
            }
        }
    }

    renderEventMarker(lat, lng, eventText, headline) {
        let iconClass = 'bx-error-circle';
        let color = '#f59e0b';

        const t = eventText.toLowerCase();
        if (t.includes('petir')) { iconClass = 'bx-cloud-lightning'; color = '#ef4444'; }
        else if (t.includes('hujan')) { iconClass = 'bx-cloud-rain'; color = '#3b82f6'; }
        else if (t.includes('angin')) { iconClass = 'bx-wind'; color = '#64748b'; }

        const markerHtml = `
            <div style="background: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5);">
                <i class='bx ${iconClass}' style="color: white; font-size: 16px;"></i>
            </div>
        `;

        const icon = L.divIcon({
            html: markerHtml,
            className: 'leaflet-div-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker([lat, lng], { icon: icon }).addTo(this.layer);
        marker.bindPopup(`
            <div style="font-family:Inter; font-size:12px; min-width: 150px;">
                <strong>Peringatan Dini!</strong><br>
                <span style="color: ${color}; font-weight:600;">${eventText}</span>
                <hr style="margin:4px 0;">${headline}
            </div>
        `);
    }
}
