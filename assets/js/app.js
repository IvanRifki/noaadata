document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const apiTokenInput = document.getElementById('apiToken');
    const saveTokenBtn = document.getElementById('saveTokenBtn');
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const statusBox = document.getElementById('statusBox');
    const statusMessage = document.getElementById('statusMessage');
    const activeStationInput = document.getElementById('activeStationInput');
    const narrativeSummaryBox = document.getElementById('narrativeSummaryBox');
    const narrativeText = document.getElementById('narrativeText');
    
    // KPI Elements
    const kpiTemp = document.getElementById('kpiTemp');
    const kpiRain = document.getElementById('kpiRain');
    const kpiCount = document.getElementById('kpiCount');

    // Instances
    let tempChartInstance = null;
    let rainChartInstance = null;
    let mapInstance = null;

    // Default Station ID for Jakarta (Soekarno-Hatta proxy in NOAA)
    let STATION_ID = 'GHCND:IDM00096749'; 

    // Chart.js Default configuration for dark mode
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Outfit';
    
    // Initialize empty charts and map
    initCharts();
    initMap();

    // Check for saved token
    const savedToken = localStorage.getItem('noaa_token');
    if (savedToken) {
        apiTokenInput.value = savedToken;
        updateStatus('Token loaded from storage.', 'success');
    }

    // Save Token
    saveTokenBtn.addEventListener('click', () => {
        const token = apiTokenInput.value.trim();
        if (token) {
            localStorage.setItem('noaa_token', token);
            updateStatus('Token saved successfully.', 'success');
        } else {
            updateStatus('Please enter a valid token.', 'error');
        }
    });

    // Fetch Data
    fetchDataBtn.addEventListener('click', () => {
        const token = apiTokenInput.value.trim();
        const start = startDateInput.value;
        const end = endDateInput.value;

        if (!token) {
            updateStatus('API Token is required to fetch data.', 'error');
            return;
        }

        if (!start || !end) {
            updateStatus('Start and end dates are required.', 'error');
            return;
        }

        fetchNOAAData(token, start, end);
    });

    function updateStatus(message, type = '') {
        statusMessage.textContent = message;
        statusBox.className = `status-box ${type}`;
        
        let icon = 'bx-info-circle';
        if(type === 'error') icon = 'bx-error-circle';
        if(type === 'success') icon = 'bx-check-circle';
        
        statusBox.querySelector('i').className = `bx ${icon}`;
    }

    async function fetchNOAAData(token, startDate, endDate) {
        updateStatus('Fetching data from NOAA...', '');
        fetchDataBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Fetching...";
        fetchDataBtn.disabled = true;

        const limit = 1000;
        // Fetch parameters: TMAX, TMIN, TAVG, and PRCP
        // URL is proxied via Vite (see vite.config.js) to bypass CORS issues
        const url = `/api/cdo-web/api/v2/data?datasetid=GHCND&stationid=${STATION_ID}&startdate=${startDate}&enddate=${endDate}&limit=${limit}&datatypeid=TMAX,TMIN,TAVG,PRCP`;

        try {
            const response = await fetch(url, {
                headers: {
                    'token': token
                }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                updateStatus('No data found for the selected date range.', 'error');
                resetKPIs();
                updateCharts([], [], [], [], []);
            } else {
                updateStatus(`Successfully fetched ${data.results.length} data points.`, 'success');
                processAndRenderData(data.results);
            }
        } catch (error) {
            console.error(error);
            updateStatus(error.message, 'error');
            resetKPIs();
        } finally {
            fetchDataBtn.innerHTML = "Fetch Data";
            fetchDataBtn.disabled = false;
        }
    }

    function processAndRenderData(results) {
        // Prepare data structures
        const dateMap = new Map();

        results.forEach(item => {
            const dateStr = item.date.split('T')[0]; // Extract YYYY-MM-DD
            if (!dateMap.has(dateStr)) {
                dateMap.set(dateStr, { tmax: null, tmin: null, tavg: null, prcp: null });
            }
            
            // NOAA Temps are in tenths of a degree Celsius
            if (item.datatype === 'TMAX') dateMap.get(dateStr).tmax = item.value / 10;
            if (item.datatype === 'TMIN') dateMap.get(dateStr).tmin = item.value / 10;
            if (item.datatype === 'TAVG') dateMap.get(dateStr).tavg = item.value / 10;
            // NOAA PRCP is in tenths of a mm
            if (item.datatype === 'PRCP') dateMap.get(dateStr).prcp = item.value / 10;
        });

        // Sort dates chronologically
        const dates = Array.from(dateMap.keys()).sort();
        
        let tmaxData = [];
        let tminData = [];
        let tavgData = [];
        let prcpData = [];
        
        let totalRain = 0;
        let rainyDays = 0;
        let temps = [];
        let absMaxTemp = -999;
        let absMinTemp = 999;

        dates.forEach(date => {
            const entry = dateMap.get(date);
            tmaxData.push(entry.tmax);
            tminData.push(entry.tmin);
            tavgData.push(entry.tavg);
            prcpData.push(entry.prcp);
            
            if (entry.prcp !== null && entry.prcp > 0) {
                totalRain += entry.prcp;
                rainyDays++;
            }
            if (entry.tmax !== null) {
                temps.push(entry.tmax);
                if (entry.tmax > absMaxTemp) absMaxTemp = entry.tmax;
            }
            if (entry.tmin !== null) {
                if (entry.tmin < absMinTemp) absMinTemp = entry.tmin;
            }
        });

        // Update KPIs
        const avgTemp = temps.length > 0 ? (temps.reduce((a,b)=>a+b, 0) / temps.length).toFixed(1) : '--';
        kpiTemp.textContent = `${avgTemp} °C`;
        kpiRain.textContent = `${totalRain.toFixed(1)} mm`;
        kpiCount.textContent = results.length;

        // Public Narrative Summary
        if (narrativeSummaryBox && narrativeText) {
            narrativeSummaryBox.style.display = 'flex';
            let narrative = "";
            let maxStr = absMaxTemp !== -999 ? `mencapai maksimum <strong>${absMaxTemp}°C</strong> di siang hari` : "data suhu maksimum tidak tersedia";
            let minStr = absMinTemp !== 999 ? `dan dapat turun ke suhu <strong>${absMinTemp}°C</strong> di malam hari` : "";
            
            let rainStr = rainyDays > 0 ? `Berdasarkan data curah hujan, tercatat ada hujan pada <span class="highlight">${rainyDays} hari</span> berbeda.` : "Terpantau kering atau tidak ada curah hujan kuat yang tercatat harian.";
            
            narrativeText.innerHTML = `Berdasarkan periode yang dipilih, suhu tertinggi di wilayah tersebut ${maxStr} ${minStr}. ${rainStr} Informasi ini memberikan Anda gambaran cepat mengenai kecenderungan cuaca harian dan membantu persiapan rutinitas Anda.`;
        }

        // Update Charts
        updateCharts(dates, tmaxData, tavgData, tminData, prcpData);
    }

    function resetKPIs() {
        kpiTemp.textContent = '-- °C';
        kpiRain.textContent = '-- mm';
        kpiCount.textContent = '--';
        if (narrativeSummaryBox) narrativeSummaryBox.style.display = 'none';
    }

    function initCharts() {
        const ctxTemp = document.getElementById('tempChart').getContext('2d');
        const ctxRain = document.getElementById('rainChart').getContext('2d');

        // Gradient for Temp chart
        const tempGradient = ctxTemp.createLinearGradient(0, 0, 0, 400);
        tempGradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
        tempGradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

        tempChartInstance = new Chart(ctxTemp, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Suhu Max (°C)',
                        data: [],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#ef4444',
                        pointRadius: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Suhu Avg (°C)',
                        data: [],
                        borderColor: '#f59e0b',
                        backgroundColor: tempGradient,
                        borderWidth: 2,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#f59e0b',
                        pointRadius: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Suhu Min (°C)',
                        data: [],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#3b82f6',
                        pointRadius: 3,
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        labels: { color: '#94a3b8' }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1'
                    }
                },
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { 
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        beginAtZero: false 
                    }
                }
            }
        });

        rainChartInstance = new Chart(ctxRain, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Precipitation (mm)',
                    data: [],
                    backgroundColor: '#6366f1',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1'
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { 
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function updateCharts(labels, tmaxData, tavgData, tminData, prcpData) {
        tempChartInstance.data.labels = labels;
        tempChartInstance.data.datasets[0].data = tmaxData;
        tempChartInstance.data.datasets[1].data = tavgData;
        tempChartInstance.data.datasets[2].data = tminData;
        tempChartInstance.update();

        rainChartInstance.data.labels = labels;
        rainChartInstance.data.datasets[0].data = prcpData;
        rainChartInstance.update();
    }

    function initMap() {
        if (!document.getElementById('stationMap')) return;

        mapInstance = L.map('stationMap').setView([-2.5, 118.0], 5);

        // Dark theme tile layer (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(mapInstance);

        const stations = [
    {
        "id": "GHCND:ID000096145",
        "name": "TAREMPA",
        "lat": 3.2,
        "lng": 106.25
    },
    {
        "id": "GHCND:ID000096805",
        "name": "CILACAP",
        "lat": -7.733,
        "lng": 109.017
    },
    {
        "id": "GHCND:ID000097690",
        "name": "JAYAPURA SENTANI",
        "lat": -2.567,
        "lng": 140.483
    },
    {
        "id": "GHCND:IDM00096935",
        "name": "SURABAYA JUANDA",
        "lat": -7.38,
        "lng": 112.787
    },
    {
        "id": "GHCND:ID000097372",
        "name": "KUPANG ELTARI",
        "lat": -10.167,
        "lng": 123.667
    },
    {
        "id": "GHCND:IDM00096253",
        "name": "FATMAWATI SOEKARNO",
        "lat": -3.864,
        "lng": 102.339
    },
    {
        "id": "GHCND:IDM00097096",
        "name": "KASIGUNCU",
        "lat": -1.417,
        "lng": 120.658
    },
    {
        "id": "GHCND:IDM00097192",
        "name": "BAU BAU BETO AMBIRI",
        "lat": -5.467,
        "lng": 122.617
    },
    {
        "id": "GHCND:IDM00096685",
        "name": "SYAMSUDIN NOOR",
        "lat": -3.442,
        "lng": 114.763
    },
    {
        "id": "GHCND:ID000097340",
        "name": "WAINGAPU MAU HAU",
        "lat": -9.667,
        "lng": 120.333
    },
    {
        "id": "GHCND:ID000097724",
        "name": "AMBON PATTIMURA",
        "lat": -3.7,
        "lng": 128.083
    },
    {
        "id": "GHCND:IDM00096171",
        "name": "JAPURA",
        "lat": -0.353,
        "lng": 102.335
    },
    {
        "id": "GHCND:IDM00097230",
        "name": "DENPASAR NGURAH RAI",
        "lat": -8.749,
        "lng": 115.167
    },
    {
        "id": "GHCND:IDM00096655",
        "name": "TJILIK RIWUT",
        "lat": -2.225,
        "lng": 113.943
    },
    {
        "id": "GHCND:ID000097560",
        "name": "BIAK FRANS KAISIEPO",
        "lat": -1.183,
        "lng": 136.117
    },
    {
        "id": "GHCND:IDM00096009",
        "name": "MALIKUS SALEH",
        "lat": 5.227,
        "lng": 96.95
    },
    {
        "id": "GHCND:IDM00096109",
        "name": "SULTAN SYARIF KASIM II",
        "lat": 0.461,
        "lng": 101.445
    },
    {
        "id": "GHCND:IDM00096221",
        "name": "SULTAN MAHMUD BADARUDDIN II",
        "lat": -2.898,
        "lng": 104.701
    },
    {
        "id": "GHCND:IDM00097086",
        "name": "BUBUNG",
        "lat": -1.039,
        "lng": 122.772
    },
    {
        "id": "GHCND:IDM00097180",
        "name": "HASANUDDIN",
        "lat": -5.062,
        "lng": 119.554
    },
    {
        "id": "GHCND:IDM00096839",
        "name": "ACHMAD YANI",
        "lat": -6.973,
        "lng": 110.375
    },
    {
        "id": "GHCND:IDM00097072",
        "name": "MUTIARA",
        "lat": -0.919,
        "lng": 119.91
    },
    {
        "id": "GHCND:IDM00096581",
        "name": "SUPADIO",
        "lat": -0.151,
        "lng": 109.404
    },
    {
        "id": "GHCND:IDM00097530",
        "name": "RENDANI",
        "lat": -0.892,
        "lng": 134.049
    },
    {
        "id": "GHCND:IDM00096249",
        "name": "H AS HANANDJOEDDIN",
        "lat": -2.746,
        "lng": 107.755
    },
    {
        "id": "GHCND:IDM00096749",
        "name": "SOEKARNO HATTA INTERNATIONAL",
        "lat": -6.126,
        "lng": 106.656
    },
    {
        "id": "GHCND:IDM00096509",
        "name": "JUWATA",
        "lat": 3.327,
        "lng": 117.566
    },
    {
        "id": "GHCND:IDM00096195",
        "name": "SULTAN THAHA",
        "lat": -1.638,
        "lng": 103.644
    },
    {
        "id": "GHCND:IDM00096933",
        "name": "SURABAYA PERAK",
        "lat": -7.217,
        "lng": 112.717
    },
    {
        "id": "GHCND:IDM00097028",
        "name": "TOLI TOLI LALOS",
        "lat": 1.017,
        "lng": 120.8
    },
    {
        "id": "GHCND:IDM00096645",
        "name": "ISKANDAR",
        "lat": -2.705,
        "lng": 111.673
    },
    {
        "id": "GHCND:IDM00096633",
        "name": "SEPINGGAN",
        "lat": -1.268,
        "lng": 116.894
    },
    {
        "id": "GHCND:IDM00096179",
        "name": "DABO",
        "lat": -0.479,
        "lng": 104.579
    },
    {
        "id": "GHCND:ID000097014",
        "name": "MENADO SAM RATULAN",
        "lat": 1.533,
        "lng": 124.917
    },
    {
        "id": "GHCND:IDM00097430",
        "name": "BABULLAH",
        "lat": 0.831,
        "lng": 127.381
    },
    {
        "id": "GHCND:IDM00097260",
        "name": "SUMBAWA BESAR",
        "lat": -8.489,
        "lng": 117.412
    },
    {
        "id": "GHCND:ID000096073",
        "name": "SIBOLGA PINANGSORI",
        "lat": 1.55,
        "lng": 98.883
    },
    {
        "id": "GHCND:ID000097980",
        "name": "MERAUKE MOPAH",
        "lat": -8.467,
        "lng": 140.383
    },
    {
        "id": "GHCND:IDM00097300",
        "name": "WAI OTI",
        "lat": -8.641,
        "lng": 122.237
    },
    {
        "id": "GHCND:IDM00096035",
        "name": "POLONIA",
        "lat": 3.558,
        "lng": 98.672
    },
    {
        "id": "GHCND:IDM00097796",
        "name": "KOKONAO TIMUKA",
        "lat": -4.717,
        "lng": 136.433
    },
    {
        "id": "GHCND:IDM00097760",
        "name": "KAIMANA",
        "lat": -3.645,
        "lng": 133.696
    },
    {
        "id": "GHCND:IDM00096011",
        "name": "SULTAN ISKANDARMUDA",
        "lat": 5.524,
        "lng": 95.42
    },
    {
        "id": "GHCND:IDM00097048",
        "name": "JALALUDDIN",
        "lat": 0.637,
        "lng": 122.85
    },
    {
        "id": "GHCND:IDM00096237",
        "name": "PANGKALPINANG",
        "lat": -2.17,
        "lng": 106.13
    },
    {
        "id": "GHCND:IDM00097270",
        "name": "MUHAMMAD SALAHUDDIN",
        "lat": -8.54,
        "lng": 118.687
    },
    {
        "id": "GHCND:IDM00096295",
        "name": "RADIN INTEN II",
        "lat": -5.242,
        "lng": 105.179
    },
    {
        "id": "GHCND:ID000097900",
        "name": "SAUMLAKI OLILIT",
        "lat": -7.983,
        "lng": 131.3
    },
    {
        "id": "GHCND:IDM00096091",
        "name": "KIJANG",
        "lat": 0.923,
        "lng": 104.532
    },
    {
        "id": "GHCND:IDM00097876",
        "name": "TANAH MERAH",
        "lat": -6.1,
        "lng": 140.3
    }
];

        stations.forEach(station => {
            const marker = L.marker([station.lat, station.lng]).addTo(mapInstance);
            
            // Highlight the initial station
            if (station.id === STATION_ID) {
                marker.bindPopup(`<b>${station.name}</b><br>Currently Selected`).openPopup();
            } else {
                marker.bindPopup(`<b>${station.name}</b><br>Click to select`);
            }

            marker.on('click', () => {
                STATION_ID = station.id;
                if (activeStationInput) {
                    activeStationInput.value = `${station.id} (${station.name})`;
                }
                
                // Automatically fetch data if token exists
                if (apiTokenInput.value.trim()) {
                    marker.bindPopup(`<b>${station.name}</b><br>Fetching data <i class='bx bx-loader-alt bx-spin'></i>`).openPopup();
                    fetchDataBtn.click();
                    setTimeout(() => marker.setPopupContent(`<b>${station.name}</b><br>Data loaded!`), 1000);
                } else {
                    marker.bindPopup(`<b>${station.name}</b><br>Selected. Enter API Token to fetch.`).openPopup();
                }
            });
        });
        
        // Fix Leaflet map sizing within flexbox
        setTimeout(() => { mapInstance.invalidateSize(); }, 500);
    }
});
