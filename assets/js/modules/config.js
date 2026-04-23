/**
 * DASHBOARD CONFIGURATION MODULE
 * Configuration for API endpoints, Locations, and Style mappings.
 */

export const CONFIG = {
    API: {
        EARTHQUAKE: '/bmkg/DataMKG/TEWS/gempaterkini.xml',
        WEATHER: (adm4) => `/cuaca?adm4=${adm4}`,
        NOWCAST: '/nowcast/rss.xml',
        NOWCAST_BASE: 'https://www.bmkg.go.id/alerts/nowcast/id'
    },
    LOCATIONS: [
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
        { name: "Jakarta Pusat", lat: -6.1647, lng: 106.8453, adm4: "31.71.03.1001" },
        { name: "Bandung", lat: -6.8742, lng: 107.5853, adm4: "32.73.01.1001" },
        { name: "Semarang", lat: -6.9932, lng: 110.4203, adm4: "33.74.01.1001" },
        { name: "Yogyakarta", lat: -7.7956, lng: 110.3695, adm4: "34.71.01.1001" },
        { name: "Surabaya", lat: -7.3405, lng: 112.6899, adm4: "35.78.01.1001" },
        { name: "Serang", lat: -6.1200, lng: 106.1502, adm4: "36.71.01.1001" },
        { name: "Denpasar", lat: -8.7362, lng: 115.2321, adm4: "51.71.01.1001" },
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
    ],
    WEATHER_ICONS: {
        'Cerah': { icon: 'bx-sun', color: '#f59e0b' },
        'Cerah Berawan': { icon: 'bx-cloud-light-rain', color: '#f59e0b' }, // Custom handling
        'Berawan': { icon: 'bx-cloud', color: '#64748b' },
        'Berawan Tebal': { icon: 'bx-cloud', color: '#475569' },
        'Hujan Ringan': { icon: 'bx-cloud-light-rain', color: '#3b82f6' },
        'Hujan Sedang': { icon: 'bx-cloud-rain', color: '#2563eb' },
        'Hujan Lebat': { icon: 'bx-cloud-rain', color: '#1d4ed8' },
        'Hujan Petir': { icon: 'bx-cloud-lightning', color: '#dc2626' },
        'Default': { icon: 'bx-help-circle', color: '#94a3b8' }
    }
};
