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
    let layerControl = null;
    let eqLayerGroup = null;
    let weatherLayerGroup = null;
    let nowcastLayerGroup = null;
    let nowcastAlertLinks = [];
    let hasLoadedNowcastMarkers = false;

    // Lokasi stasiun cuaca utama (Perwakilan Provinsi & Kota Besar Indonesia)
    const weatherLocations = [
        { name: "Banda Aceh", lat: 5.5483, lng: 95.3238, adm4: "11.71.01.2001" },
        { name: "Medan", lat: 3.5952, lng: 98.6722, adm4: "12.71.01.1001" },
        { name: "Padang", lat: -0.9471, lng: 100.3658, adm4: "13.71.01.1001" },
        { name: "Pekanbaru", lat: 0.5071, lng: 101.4451, adm4: "14.71.01.1001" },
        { name: "Jambi", lat: -1.6101, lng: 103.6131, adm4: "15.71.01.1001" },
        { name: "Palembang", lat: -2.9909, lng: 104.7566, adm4: "16.71.01.1001" },
        { name: "Bengkulu", lat: -3.7928, lng: 102.2608, adm4: "17.71.01.1001" },
        { name: "Bandar Lampung", lat: -5.4500, lng: 105.2667, adm4: "18.71.01.1001" },
        { name: "Pangkal Pinang", lat: -2.1167, lng: 106.1000, adm4: "19.71.01.1001" },
        { name: "Tanjung Pinang", lat: 0.9167, lng: 104.4600, adm4: "21.72.01.1001" },
        { name: "Jakarta Pusat", lat: -6.1647, lng: 106.8453, adm4: "31.71.03.1001" }, // Verified
        { name: "Bandung", lat: -6.8742, lng: 107.5853, adm4: "32.73.01.1001" }, // Verified
        { name: "Semarang", lat: -6.9932, lng: 110.4203, adm4: "33.74.01.1001" },
        { name: "Yogyakarta", lat: -7.7956, lng: 110.3695, adm4: "34.71.01.1001" },
        { name: "Surabaya", lat: -7.3405, lng: 112.6899, adm4: "35.78.01.1001" }, // Verified
        { name: "Serang", lat: -6.1200, lng: 106.1502, adm4: "36.71.01.1001" },
        { name: "Denpasar", lat: -8.7362, lng: 115.2321, adm4: "51.71.01.1001" }, // Verified
        { name: "Mataram", lat: -8.5833, lng: 116.1167, adm4: "52.71.01.1001" },
        { name: "Kupang", lat: -10.1583, lng: 123.5833, adm4: "53.71.01.1001" },
        { name: "Pontianak", lat: -0.0227, lng: 109.3333, adm4: "61.71.01.1001" },
        { name: "Palangka Raya", lat: -0.5022, lng: 116.3218, adm4: "64.71.01.1001" },
        { name: "Banjarmasin", lat: -3.3167, lng: 114.5900, adm4: "63.71.01.1001" },
        { name: "Samarinda", lat: -0.5022, lng: 117.1536, adm4: "64.72.01.1001" },
        { name: "Manado", lat: 1.4931, lng: 124.8413, adm4: "71.71.01.1001" },
        { name: "Palu", lat: -0.9000, lng: 119.8667, adm4: "72.71.01.1001" },
        { name: "Makassar", lat: -5.1477, lng: 119.4328, adm4: "73.71.01.1001" },
        { name: "Kendari", lat: -3.9744, lng: 122.5150, adm4: "74.71.01.1001" },
        { name: "Gorontalo", lat: -0.5414, lng: 123.0588, adm4: "75.71.01.1001" },
        { name: "Mamuju", lat: -0.9000, lng: 119.8667, adm4: "76.71.01.1001" },
        { name: "Ambon", lat: -3.6958, lng: 128.1814, adm4: "81.71.01.1001" },
        { name: "Ternate", lat: 0.8000, lng: 127.4000, adm4: "82.71.01.1001" },
        { name: "Manokwari", lat: -2.8667, lng: 134.0500, adm4: "92.02.01.1001" },
        { name: "Jayapura", lat: -2.5333, lng: 140.7167, adm4: "91.71.01.1001" }
    ];

    initCharts();
    initMap();
    initWeatherMarkers();
    fetchBMKGData();
    fetchNowcastData();

    async function fetchNowcastData() {
        try {
            // Using vite proxy /nowcast to bypass CORS locally
            const res = await fetch('/nowcast/rss.xml');
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const str = await res.text();

            const parser = new DOMParser();
            const xml = parser.parseFromString(str, "application/xml");

            const items = xml.querySelectorAll('item');
            const tickerContent = document.getElementById('ticker-content');
            const tickerContainer = document.getElementById('nowcast-ticker');
            
            if (!tickerContent || !tickerContainer) return;

            if (items.length > 0) {
                let html = '';
                // Limit to max 15 items to avoid excessive DOM weight
                const maxItems = Math.min(items.length, 15);
                for(let i = 0; i < maxItems; i++) {
                    const item = items[i];
                    const title = item.querySelector('title')?.textContent || '';
                    const desc = item.querySelector('description')?.textContent || '';
                    const link = item.querySelector('link')?.textContent || '';
                    if (link) nowcastAlertLinks.push(link);
                    
                    // Bersihkan deskripsi & potong text berlebih
                    let shortDesc = desc.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                    if (shortDesc.length > 180) {
                        shortDesc = shortDesc.substring(0, 180) + '...';
                    }
                    
                    html += `<div class="ticker-item"><strong>${title}</strong> &mdash; ${shortDesc}</div>`;
                }
                
                // Duplicate content for smooth infinite scrolling loop
                tickerContent.innerHTML = html + html;
                tickerContainer.style.display = 'flex';
                
                // Adjust animation speed depending on content length
                const totalLength = html.length;
                const speed = Math.max(40, totalLength / 12); // calculate seconds
                tickerContent.style.animationDuration = `${speed}s`;

                // Atur agar Leaflet Controls tidak tertutup Ticker
                setTimeout(() => {
                    const leafletBottoms = document.querySelectorAll('.leaflet-bottom');
                    leafletBottoms.forEach(el => el.style.bottom = '40px');
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to load Nowcast Data', error);
        }
    }

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

        eqLayerGroup = L.layerGroup();
        weatherLayerGroup = L.layerGroup();
        nowcastLayerGroup = L.layerGroup();

        const overlayMaps = {
            "Peringatan Dini Gempa": eqLayerGroup,
            "Prakiraan Cuaca": weatherLayerGroup,
            "Area Cuaca Ekstrem": nowcastLayerGroup
        };

        // Theme Set Default
        satelliteMap.addTo(mapInstance);
        eqLayerGroup.addTo(mapInstance);

        // Tambah kontrol untuk mengubah tema peta
        layerControl = L.control.layers(baseMaps, overlayMaps, { position: 'bottomright' }).addTo(mapInstance);

        mapInstance.on('overlayadd', function(e) {
            if (e.name === 'Area Cuaca Ekstrem' && !hasLoadedNowcastMarkers) {
                hasLoadedNowcastMarkers = true;
                loadNowcastMarkers();
            }
        });

        setTimeout(() => mapInstance.invalidateSize(), 500);
    }

    async function loadNowcastMarkers() {
        if (!mapInstance || !nowcastLayerGroup) return;

        for (let url of nowcastAlertLinks) {
            try {
                // Konversi absolut url dari XML menjadi relatif ke vite proxy `/nowcast`
                const proxyUrl = url.replace('https://www.bmkg.go.id/alerts/nowcast/id', '/nowcast');
                const res = await fetch(proxyUrl);
                if (!res.ok) continue;
                
                const str = await res.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(str, "application/xml");

                const eventText = xml.querySelector('event')?.textContent || '';
                const headline = xml.querySelector('headline')?.textContent || '';
                const polygonText = xml.querySelector('polygon')?.textContent || '';
                
                if (polygonText) {
                    // Ambil koordinat awal dari poligon untuk penempatan icon
                    const parts = polygonText.split(' ');
                    if (parts.length > 0) {
                        const coordsArr = parts[0].split(',');
                        if (coordsArr.length >= 2) {
                            const lat = parseFloat(coordsArr[0]);
                            const lng = parseFloat(coordsArr[1]);

                            let eventIconClass = 'bx-error-circle';
                            let eventColor = '#f59e0b'; // Yellow Default

                            const tLower = eventText.toLowerCase();
                            if (tLower.includes('petir')) {
                                eventIconClass = 'bx-cloud-lightning';
                                eventColor = '#ef4444'; // Red
                            } else if (tLower.includes('hujan')) {
                                eventIconClass = 'bx-cloud-rain';
                                eventColor = '#3b82f6'; // Blue
                            } else if (tLower.includes('angin')) {
                                eventIconClass = 'bx-wind';
                                eventColor = '#64748b'; // Gray
                            }

                            const markerHtml = `
                                <div style="background: ${eventColor}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 6px rgba(0,0,0,0.5);">
                                    <i class='bx ${eventIconClass}' style="color: white; font-size: 16px;"></i>
                                </div>
                            `;

                            const icon = L.divIcon({
                                html: markerHtml,
                                className: 'leaflet-div-icon',
                                iconSize: [28, 28],
                                iconAnchor: [14, 14]
                            });

                            const marker = L.marker([lat, lng], { icon: icon }).addTo(nowcastLayerGroup);
                            marker.bindPopup(`<div style="font-family:Inter; font-size:12px; min-width: 150px;"><strong>Peringatan Dini!</strong><br><span style="color: ${eventColor}; font-weight:600;">${eventText}</span><hr style="margin:4px 0;">${headline}</div>`);
                        }
                    }
                }
            } catch (error) {
                console.error("Gagal memproses item alert cuaca ekstrem", error);
            }
        }
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

    function initWeatherMarkers() {
        if (!mapInstance) return;

        const prefetchTriggers = [];
        let hasTriggeredPrefetch = false;

        weatherLocations.forEach(loc => {
            // Ikon cuaca (Cloud)
            const weatherIconHtml = `
                <div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 5px rgba(0,0,0,0.3);">
                    <i class='bx bx-cloud' style="color: white; font-size: 14px;"></i>
                </div>
            `;

            const icon = L.divIcon({
                html: weatherIconHtml,
                className: 'leaflet-div-icon',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker([loc.lat, loc.lng], { icon: icon }).addTo(weatherLayerGroup);
            
            const popup = L.popup().setLatLng([loc.lat, loc.lng]);
            let isLoaded = false;
            let isFetching = false;
            let cachedHtml = '';

            const doFetch = async () => {
                if (isLoaded || isFetching) return;
                isFetching = true;
                
                try {
                    const response = await fetch(`/cuaca?adm4=${loc.adm4}`);
                    if (!response.ok) throw new Error('Data tidak ditemukan/Error API');
                    const json = await response.json();
                    
                    if (json.data && json.data[0] && json.data[0].cuaca && json.data[0].cuaca[0].length > 0) {
                        const currentWeather = json.data[0].cuaca[0][0]; 
                        cachedHtml = `
                            <div style="font-family: Inter; min-width: 180px;">
                                <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 4px;">Prakiraan Cuaca</div>
                                <div style="font-size: 13px; color: #475569; font-weight: 600;">${loc.name}</div>
                                <hr style="margin: 6px 0;">
                                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #334155;">
                                    <span>Kondisi:</span> <strong>${currentWeather.weather_desc}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #334155; margin-top:2px;">
                                    <span>Suhu:</span> <strong>${currentWeather.t}°C</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #334155; margin-top:2px;">
                                    <span>Kelembapan:</span> <strong>${currentWeather.hu}%</strong>
                                </div>
                                <div style="font-size: 10px; color: #94a3b8; margin-top: 8px; text-align: right;">
                                    Update: ${currentWeather.local_datetime}
                                </div>
                            </div>
                        `;
                    } else {
                        cachedHtml = `<div style="color: #ef4444; font-size: 12px; text-align: center;">Data cuaca kosong</div>`;
                    }
                } catch (error) {
                    console.error('Weather fetch error:', error);
                    cachedHtml = `<div style="color: #ef4444; font-size: 12px; text-align: center;">Gagal memuat cuaca: ${error.message} <br>(Pastikan API BMKG dapat diakses)</div>`;
                }
                
                isLoaded = true;
                isFetching = false;
                if (popup.isOpen()) popup.setContent(cachedHtml);
            };

            prefetchTriggers.push(doFetch);
            
            marker.on('click', () => {
                if (!isLoaded) {
                    popup.setContent(`<div style="min-width: 150px; text-align: center;"><i class='bx bx-loader-alt bx-spin'></i> Memuat data cuaca ${loc.name}...</div>`);
                    doFetch();
                } else {
                    popup.setContent(cachedHtml);
                }
                popup.openOn(mapInstance);
            });
        });

        // Fetch data ONLY when the user activates the weather layer
        mapInstance.on('overlayadd', function(e) {
            if (e.name === 'Prakiraan Cuaca' && !hasTriggeredPrefetch) {
                hasTriggeredPrefetch = true;
                prefetchTriggers.forEach(fn => fn());
            }
        });
    }

    async function fetchBMKGData() {
        let loadingPercent = 0;
        const progressEl = document.getElementById('loading-percent');
        let loadingInterval = setInterval(() => {
            if (!progressEl) return;
            if (loadingPercent < 95) {
                loadingPercent += Math.max(1, Math.floor(Math.random() * 5));
                if (loadingPercent > 95) loadingPercent = 95;
                progressEl.textContent = loadingPercent + '%';
            }
        }, 50);

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
        } finally {
            clearInterval(loadingInterval);
            if (progressEl) {
                progressEl.textContent = '100%';
            }
            
            // Beri jeda sejenak agar user melihat 100% sebelum memudar
            setTimeout(() => {
                const globalLoader = document.getElementById('global-loader');
                if (globalLoader) {
                    globalLoader.classList.add('fade-out');
                    // Hapus elemen dari DOM setelah durasi transisi selesai (0.6s)
                    setTimeout(() => globalLoader.remove(), 600);
                }
            }, 300);
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
        const topRightPanel = document.querySelector('.panel-top-right');

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
            const marker = L.marker([lat, lng], { icon: icon }).addTo(eqLayerGroup);

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
