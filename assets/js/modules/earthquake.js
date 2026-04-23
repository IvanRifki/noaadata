/**
 * EARTHQUAKE MODULE
 * Fetches and renders earthquake data.
 */

import { CONFIG } from './config.js';

export class EarthquakeModule {
    constructor(map, charts) {
        this.map = map;
        this.charts = charts;
        this.layer = map.layers.overlay.earthquake;
    }

    async fetch() {
        try {
            const res = await fetch(CONFIG.API.EARTHQUAKE);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const str = await res.text();

            const parser = new DOMParser();
            const xml = parser.parseFromString(str, "application/xml");
            const gempaNodes = xml.querySelectorAll('gempa');
            
            const data = Array.from(gempaNodes).map(node => ({
                tanggal: node.querySelector('Tanggal').textContent,
                jam: node.querySelector('Jam').textContent,
                dateTime: node.querySelector('DateTime').textContent,
                coords: node.querySelector('point > coordinates')?.textContent || node.querySelector('Coordinates')?.textContent,
                lintang: node.querySelector('Lintang').textContent,
                bujur: node.querySelector('Bujur').textContent,
                mag: parseFloat(node.querySelector('Magnitude').textContent),
                kedalaman: node.querySelector('Kedalaman').textContent,
                wilayah: node.querySelector('Wilayah').textContent,
                potensi: node.querySelector('Potensi')?.textContent || "-"
            }));

            if (data.length > 0) {
                this.render(data);
            }
        } catch (error) {
            console.error('Failed to load BMKG Earthquake Data', error);
            document.getElementById('latestRelativeTime').innerHTML = `<i class='bx bx-error'></i> Gagal memuat API BMKG.`;
        }
    }

    render(data) {
        const latest = data[0];
        this.updateDashboard(latest);

        let cat6 = 0, cat5 = 0, cat4 = 0;
        let depthData = { labels: [], values: [] };

        data.forEach((eq, index) => {
            const [lat, lng] = eq.coords.split(',').map(Number);
            let color = '#10b981';
            if (eq.mag >= 6.0) { color = '#dc2626'; cat6++; }
            else if (eq.mag >= 5.0) { color = '#f59e0b'; cat5++; }
            else { cat4++; }

            const size = Math.max(12, eq.mag * 3.5);
            const markerHtml = `
                <div style="position: relative; width: 100%; height: 100%;">
                    <div class="eq-marker" style="width: 100%; height: 100%; background: ${color}; position:relative; z-index:2;"></div>
                    ${index === 0 ? `<div class="pulse-ring" style="border: 2.5px solid ${color};"></div>` : ''}
                </div>
            `;

            const icon = L.divIcon({
                html: markerHtml,
                className: 'leaflet-div-icon',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
            });

            const marker = L.marker([lat, lng], { icon: icon }).addTo(this.layer);
            marker.bindPopup(`
                <div style="font-family:Inter; font-size:12px; min-width: 180px;">
                    <div style="background: ${color}; color:#fff; padding:4px 8px; font-weight:bold; font-size:14px; border-radius:2px; margin-bottom:4px;">
                        Magnitudo ${eq.mag}
                    </div>
                    <div style="color: #475569;">
                        <b>Waktu:</b> ${eq.tanggal} ${eq.jam}<br>
                        <b>Lokasi:</b> ${eq.lintang}, ${eq.bujur}<br>
                        <b>Kedalaman:</b> ${eq.kedalaman}<br>
                    </div>
                    <div style="background: #f1f5f9; padding: 4px; font-size: 11px; margin-top: 6px;">
                        ${eq.wilayah}
                    </div>
                </div>
            `);

            const depthNum = parseInt(eq.kedalaman.replace(/[^0-9]/g, ''));
            depthData.labels.push(`M ${eq.mag}`);
            depthData.values.push(depthNum);
        });

        this.charts.update([cat6, cat5, cat4], {
            labels: depthData.labels.reverse(),
            values: depthData.values.reverse()
        });

        // Trigger pulse on top right panel
        const panel = document.querySelector('.panel-top-right');
        if (panel) {
            if (latest.mag >= 5.0) panel.classList.add('alert-pulse');
            else panel.classList.remove('alert-pulse');
        }
    }

    updateDashboard(latest) {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        set('latestMag', latest.mag);
        set('latestTime', `${latest.tanggal}, ${latest.jam}`);
        document.getElementById('latestRelativeTime').innerHTML = `<i class='bx bx-broadcast'></i> Sinkronisasi BMKG Sukses`;
        set('latestCoords', `${latest.lintang}, ${latest.bujur}`);
        set('latestDepth', latest.kedalaman);
        set('latestRegion', latest.wilayah);

        set('alertMagBadge', latest.mag);
        set('alertSendTime', latest.dateTime.split('T')[0] + ' ' + latest.dateTime.substring(11, 19) + ' UTC');
        set('alertTime', latest.jam);
        set('alertCoords', `${latest.lintang}, ${latest.bujur}`);
        set('alertDepth', latest.kedalaman);
        set('alertNarrative', `Pusat gempa berada di darat/laut ${latest.wilayah}.`);
        const pEl = document.getElementById('alertPotensi');
        if (pEl) pEl.innerHTML = `<strong>Status Potensi Gempa:</strong><br>${latest.potensi}`;
    }
}
