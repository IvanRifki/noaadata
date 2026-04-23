document.addEventListener('DOMContentLoaded', () => {
    // Top Left Panel
    const latestMag = document.getElementById('latestMag');
    const latestTime = document.getElementById('latestTime');
    const latestRelativeTime = document.getElementById('latestRelativeTime');
    const latestCoords = document.getElementById('latestCoords');
    const latestDepth = document.getElementById('latestDepth');
    const latestRegion = document.getElementById('latestRegion');

    // Top Right Panel
    const alertMagBadge = document.getElementById('alertMagBadge');
    const alertSendTime = document.getElementById('alertSendTime');
    const alertTime = document.getElementById('alertTime');
    const alertCoords = document.getElementById('alertCoords');
    const alertDepth = document.getElementById('alertDepth');
    const alertNarrative = document.getElementById('alertNarrative');
    const alertPotensi = document.getElementById('alertPotensi');

    let mapInstance = null;
    let magPieChartInstance = null;
    let depthChartInstance = null;

    initCharts();
    initMap();
    fetchBMKGData();

    function initMap() {
        if (!document.getElementById('stationMap')) return;
        // Turn off default zoom to reposition it easily. Set view to center of Indonesia.
        mapInstance = L.map('stationMap', { zoomControl: false }).setView([-2.5, 118.0], 5);

        // Add zoom control manually below floating panels area
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

        // Deklarasi Pilihan Basemaps
        const lightMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 19
        });
        const darkMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 19
        });
        const satelliteMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        });
        const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
        });

        const baseMaps = {
            "Tema Terang (Light)": lightMap,
            "Tema Gelap (Dark)": darkMap,
            "Satelit": satelliteMap,
            "Jalan (Street)": streetMap
        };

        // Theme Set Default
        satelliteMap.addTo(mapInstance);

        // Tambah kontrol untuk mengubah tema peta
        L.control.layers(baseMaps, null, { position: 'bottomright' }).addTo(mapInstance);

        setTimeout(() => mapInstance.invalidateSize(), 500);
    }

    function initCharts() {
        Chart.defaults.font.family = 'Inter';
        Chart.defaults.color = '#475569';

        const ctxPie = document.getElementById('magPieChart');
        if (ctxPie) {
            magPieChartInstance = new Chart(ctxPie.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['M >= 6.0', 'M 5.0 - 5.9', 'M < 5.0'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#dc2626', '#f59e0b', '#10b981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { boxWidth: 10, font: { size: 10 } }
                        }
                    }
                }
            });
        }

        const ctxDepth = document.getElementById('depthChart');
        if (ctxDepth) {
            depthChartInstance = new Chart(ctxDepth.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Kedalaman (Km)',
                        data: [],
                        backgroundColor: '#3b82f6',
                        borderRadius: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { ticks: { font: { size: 9 }, stepSize: 50 } }
                    }
                }
            });
        }
    }

    async function fetchBMKGData() {
        try {
            // Using vite proxy setup to bypass CORS locally
            const res = await fetch('/bmkg/DataMKG/TEWS/gempaterkini.xml');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const str = await res.text();

            const parser = new DOMParser();
            const xml = parser.parseFromString(str, "application/xml");

            const gempaNodes = xml.querySelectorAll('gempa');
            const eqData = [];

            gempaNodes.forEach(node => {
                eqData.push({
                    tanggal: node.querySelector('Tanggal').textContent,
                    jam: node.querySelector('Jam').textContent,
                    dateTime: node.querySelector('DateTime').textContent,
                    coords: node.querySelector('point > coordinates') ? node.querySelector('point > coordinates').textContent : node.querySelector('Coordinates').textContent,
                    lintang: node.querySelector('Lintang').textContent,
                    bujur: node.querySelector('Bujur').textContent,
                    mag: parseFloat(node.querySelector('Magnitude').textContent),
                    kedalaman: node.querySelector('Kedalaman').textContent,
                    wilayah: node.querySelector('Wilayah').textContent,
                    potensi: node.querySelector('Potensi') ? node.querySelector('Potensi').textContent : "-"
                });
            });

            if (eqData.length > 0) {
                renderDashboard(eqData);
            } else {
                throw new Error("No data nodes found in XML.");
            }
        } catch (error) {
            console.error('Failed to load BMKG Data', error);
            latestRelativeTime.innerHTML = `<i class='bx bx-error'></i> Gagal memuat API BMKG. Hubungkan proxy server.`;
        }
    }

    function renderDashboard(data) {
        // BMKG sorts newest first
        const latest = data[0];

        // Panel Update Update
        if (latestMag) latestMag.textContent = latest.mag;
        if (latestTime) latestTime.textContent = `${latest.tanggal}, ${latest.jam}`;
        if (latestRelativeTime) latestRelativeTime.innerHTML = `<i class='bx bx-broadcast'></i> Sinkronisasi BMKG Sukses`;
        if (latestCoords) latestCoords.textContent = `${latest.lintang}, ${latest.bujur}`;
        if (latestDepth) latestDepth.textContent = latest.kedalaman;
        if (latestRegion) latestRegion.textContent = latest.wilayah;

        if (alertMagBadge) alertMagBadge.textContent = latest.mag;
        if (alertSendTime) alertSendTime.textContent = latest.dateTime.split('T')[0] + ' ' + latest.dateTime.substring(11, 19) + ' UTC';
        if (alertTime) alertTime.textContent = latest.jam;
        if (alertCoords) alertCoords.textContent = `${latest.lintang}, ${latest.bujur}`;
        if (alertDepth) alertDepth.textContent = latest.kedalaman;
        if (alertNarrative) alertNarrative.textContent = `Pusat gempa berada di darat/laut ${latest.wilayah}.`;
        if (alertPotensi) alertPotensi.innerHTML = `<strong>Status Potensi Gempa:</strong><br>${latest.potensi}`;

        // Panel efek highlight untuk menunjukkan data baru saja di sinkronisasi
        const topLeftPanel = document.querySelector('.panel-top-left');
        const topRightPanel = document.querySelector('.panel-top-right');

        if (topLeftPanel) {
            topLeftPanel.classList.remove('data-highlight');
            void topLeftPanel.offsetWidth; // trigger reflow
            topLeftPanel.classList.add('data-highlight');
        }

        // Terapkan efek pulse konstan jika magnitude cukup besar (>= 5.0) sebagai alert
        if (topRightPanel) {
            if (latest.mag >= 5.0) {
                topRightPanel.classList.add('alert-pulse');
            } else {
                topRightPanel.classList.remove('alert-pulse');
            }
        }

        let cat6 = 0, cat5 = 0, cat4 = 0;
        let depthLabels = [];
        let depthValues = [];

        data.forEach((eq, index) => {
            const [lat, lng] = eq.coords.split(',').map(Number); // BMKG Coordinates are generally Lat, Lng

            let color = '#10b981'; // Green
            if (eq.mag >= 6.0) { color = '#dc2626'; cat6++; } // Red
            else if (eq.mag >= 5.0) { color = '#f59e0b'; cat5++; } // Yellow
            else { cat4++; } // It's usually M>5.0 from gempaterkini but just in case.

            // Circle base size scaled logarithmically or linearly by magnitude
            // e.g. M 5 => 15px, M 7 => 21px
            const size = Math.max(12, eq.mag * 3.5);

            let circleHtml = `<div class="eq-marker" style="width: 100%; height: 100%; background: ${color}; position:relative; z-index:2;"></div>`;

            // Animasi radar ping (pulse) KHUSUS untuk gempa terkini/terbaru (array ke-0)
            if (index === 0) {
                circleHtml += `<div class="pulse-ring" style="border: 2.5px solid ${color};"></div>`;
            }

            const icon = L.divIcon({
                html: `<div style="position: relative; width: 100%; height: 100%;">${circleHtml}</div>`,
                className: 'leaflet-div-icon',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
            });

            // Note: Coordinate layout in Leaflet is Lat, Lng
            const marker = L.marker([lat, lng], { icon: icon }).addTo(mapInstance);

            const popupContent = `
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
            `;
            marker.bindPopup(popupContent);

            // Chart array push
            const depthNum = parseInt(eq.kedalaman.replace(/[^0-9]/g, ''));
            depthLabels.push(`M ${eq.mag}`);
            depthValues.push(depthNum);
        });

        // Update Charts
        if (magPieChartInstance) {
            magPieChartInstance.data.datasets[0].data = [cat6, cat5, cat4];
            magPieChartInstance.update();
        }
        if (depthChartInstance) {
            // Reversing the array to show oldest to newest (or vice versa depending on preference)
            depthChartInstance.data.labels = depthLabels.reverse();
            depthChartInstance.data.datasets[0].data = depthValues.reverse();
            depthChartInstance.update();
        }

        // Tetap pada posisi awal peta Indonesia yang di inisiasi di `initMap` ([-2.5, 118.0])
        // Tidak perlu flyTo ke posisi gempa terbaru jika ingin tetap menampilkan semua data wilayah Indonesia
        // Pilihan: Jika mau kembali men-center ke indonesia bisa dengan command ini: 
        // mapInstance.setView([-2.5, 118.0], 5, { animate: true });

        // Optionally open popup of latest automatically
        // ...
    }
});
