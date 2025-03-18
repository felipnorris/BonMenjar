export class MapHandler {
    constructor() {
        this.map = null;
        this.markers = [];
    }

    initMap(restaurantData) {
        if (!restaurantData) {
            console.warn("No restaurant data available");
            return;
        }

        const mapContainer = document.getElementById('recipe-map');
        if (!mapContainer) {
            console.error("Map container not found");
            return;
        }

        // Invalidate size after modal is shown
        const modal = document.getElementById('recipeModal');
        modal.addEventListener('shown.bs.modal', () => {
            if (!this.map) {
                this.createMap();
            }
            this.map.invalidateSize();
            this.clearMarkers();
            this.addRestaurantMarker(restaurantData);
        });
    }

    createMap() {
        try {
            this.map = L.map('recipe-map').setView([39.6953, 3.0176], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        } catch (error) {
            console.error('Error creating map:', error);
        }
    }

    clearMarkers() {
        if (!this.map) return;
        
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }

    addRestaurantMarker(restaurantData) {
        if (!this.map || !restaurantData || !restaurantData.geo) return;

        try {
            const lat = parseFloat(restaurantData.geo.latitude);
            const lng = parseFloat(restaurantData.geo.longitude);

            if (isNaN(lat) || isNaN(lng)) {
                console.error('Invalid coordinates');
                return;
            }

            const marker = L.marker([lat, lng]);
            this.markers.push(marker);

            const popupContent = `
                <div class="restaurant-popup">
                    <h5>${restaurantData.name || 'Restaurant'}</h5>
                    ${restaurantData.address?.streetAddress ? 
                        `<p>${restaurantData.address.streetAddress}, ${restaurantData.address.addressLocality || ''}</p>` 
                        : ''}
                </div>
            `;

            marker.bindPopup(popupContent).addTo(this.map);
            this.map.setView([lat, lng], 15);
        } catch (error) {
            console.error('Error adding restaurant marker:', error);
        }
    }
}