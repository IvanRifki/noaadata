/**
 * MAP MODULE
 * Handles Leaflet initialization and layer management.
 */

export class MapModule {
    constructor(elementId) {
        this.elementId = elementId;
        this.instance = null;
        this.layers = {
            base: {},
            overlay: {
                earthquake: L.layerGroup(),
                weather: L.layerGroup(),
                nowcast: L.layerGroup()
            }
        };
        this.control = null;
    }

    init() {
        if (!document.getElementById(this.elementId)) return;

        this.instance = L.map(this.elementId, { zoomControl: false }).setView([-2.5, 118.0], 5);
        L.control.zoom({ position: 'bottomright' }).addTo(this.instance);

        this.initBasemaps();
        this.initControls();
        
        setTimeout(() => this.instance.invalidateSize(), 500);
        return this.instance;
    }

    initBasemaps() {
        this.layers.base = {
            "Tema Terang": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 19
            }),
            "Tema Gelap": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 19
            }),
            "Satelit": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri'
            }),
            "Jalan": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
            })
        };

        // Set Default
        this.layers.base["Satelit"].addTo(this.instance);
        this.layers.overlay.earthquake.addTo(this.instance);
    }

    initControls() {
        const overlayMaps = {
            "Peringatan Dini Gempa": this.layers.overlay.earthquake,
            "Prakiraan Cuaca": this.layers.overlay.weather,
            "Area Cuaca Ekstrem": this.layers.overlay.nowcast
        };

        this.control = L.control.layers(this.layers.base, overlayMaps, { position: 'bottomright' }).addTo(this.instance);
    }

    onLayerAdd(layerName, callback) {
        this.instance.on('overlayadd', (e) => {
            if (e.name === layerName) callback(e);
        });
    }
}
