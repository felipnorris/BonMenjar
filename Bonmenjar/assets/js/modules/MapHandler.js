export class MapHandler {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentRoute = null;
        this.userMarker = null;
        this.selectedRestaurantPosition = null;
        this.routeInfo = null;
        this.stopRouteControl = null;
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

        const modal = document.getElementById('recipeModal');
        modal.addEventListener('shown.bs.modal', () => {
            if (!this.map) {
                this.createMap();
            }
            this.map.invalidateSize();
            this.clearMarkers();
            
            // Convertir a array si es un solo restaurante
            const restaurants = Array.isArray(restaurantData) ? restaurantData : [restaurantData];
            restaurants.forEach(restaurant => this.addRestaurantMarker(restaurant));
            
            // Ajustar vista para mostrar todos los marcadores
            if (this.markers.length > 0) {
                const group = new L.featureGroup(this.markers);
                this.map.fitBounds(group.getBounds().pad(0.1));
            }
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
                    <div class="route-controls">
                        <button class="btn btn-sm btn-primary show-route-btn w-100 mb-2">
                            <i class="bi bi-map"></i> Mostrar ruta
                        </button>
                        <div class="transport-options" style="display:none">
                            <select class="form-select form-select-sm mb-2">
                                <option value="DRIVING">En cotxe</option>
                                <option value="WALKING">A peu</option>
                                <option value="BICYCLING">En bicicleta</option>
                                <option value="TRANSIT">Transport públic</option>
                            </select>
                            <button class="btn btn-sm btn-success calculate-route-btn w-100">
                                <i class="bi bi-check-lg"></i> Calcular ruta
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const popup = L.popup({
                maxWidth: 300,
                className: 'custom-popup'
            }).setContent(popupContent);

            marker.bindPopup(popup).addTo(this.map);
            this.setupPopupListeners(marker, {lat, lng});
        } catch (error) {
            console.error('Error adding restaurant marker:', error);
        }
    }

    setupPopupListeners(marker, position) {
        marker.on('popupopen', () => {
            const popup = marker.getPopup();
            const container = popup.getElement();

            const showRouteBtn = container.querySelector('.show-route-btn');
            const transportOptions = container.querySelector('.transport-options');
            const calculateRouteBtn = container.querySelector('.calculate-route-btn');

            showRouteBtn?.addEventListener('click', () => {
                this.selectedRestaurantPosition = position;
                this.getUserLocation().then(() => {
                    showRouteBtn.style.display = 'none';
                    transportOptions.style.display = 'block';
                }).catch(error => {
                    alert('Error obtenint la ubicació: ' + error.message);
                });
            });

            calculateRouteBtn?.addEventListener('click', () => {
                const transportMode = container.querySelector('select').value;
                marker.closePopup();
                this.calculateAndDisplayRoute(transportMode);
                this.addStopRouteControl();
            });
        });
    }

    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;
                        
                        if (this.userMarker) {
                            this.map.removeLayer(this.userMarker);
                        }

                        this.userMarker = L.marker([userLat, userLng], {
                            icon: L.divIcon({
                                html: '<i class="bi bi-person-fill" style="font-size: 24px; color: #0d6efd;"></i>',
                                className: 'user-marker'
                            })
                        }).addTo(this.map);

                        resolve(position);
                    },
                    (error) => {
                        reject(error);
                    }
                );
            } else {
                reject(new Error('Geolocalització no suportada'));
            }
        });
    }

    addStopRouteControl() {
        if (this.stopRouteControl) {
            this.map.removeControl(this.stopRouteControl);
        }

        this.stopRouteControl = L.control({ position: 'topright' });
        this.stopRouteControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'stop-route-control');
            div.innerHTML = `
                <button class="btn btn-danger btn-sm">
                    <i class="bi bi-x-lg"></i> Detenir ruta
                </button>
            `;
            
            div.querySelector('button').addEventListener('click', () => {
                this.clearRoute();
                this.map.removeControl(this.stopRouteControl);
                this.stopRouteControl = null;
                
                if (this.routeInfo) {
                    this.map.removeControl(this.routeInfo);
                    this.routeInfo = null;
                }
                
                // Ajustar vista para mostrar todos los marcadores
                if (this.markers.length > 0) {
                    const group = new L.featureGroup(this.markers);
                    this.map.fitBounds(group.getBounds().pad(0.1));
                }
            });
            
            return div;
        };
        
        this.stopRouteControl.addTo(this.map);
    }

    async calculateAndDisplayRoute(transportMode) {
        if (!this.userMarker || !this.selectedRestaurantPosition) return;
    
        try {
            const directionsService = new google.maps.DirectionsService();
            const request = {
                origin: new google.maps.LatLng(
                    this.userMarker.getLatLng().lat,
                    this.userMarker.getLatLng().lng
                ),
                destination: new google.maps.LatLng(
                    this.selectedRestaurantPosition.lat,
                    this.selectedRestaurantPosition.lng
                ),
                travelMode: google.maps.TravelMode[transportMode]
            };
    
            const result = await directionsService.route(request);
            
            const path = result.routes[0].overview_path.map(point => [
                point.lat(),
                point.lng()
            ]);
    
            this.displayRoute(path);
    
            const route = result.routes[0].legs[0];
            const routeInfo = L.control({ position: 'bottomleft' });
            routeInfo.onAdd = () => {
                const div = L.DomUtil.create('div', 'route-info');
                div.innerHTML = `
                    <div class="leaflet-control leaflet-bar p-2 bg-white">
                        <strong>Distància:</strong> ${route.distance.text}<br>
                        <strong>Temps estimat:</strong> ${route.duration.text}
                    </div>
                `;
                return div;
            };
    
            if (this.routeInfo) {
                this.map.removeControl(this.routeInfo);
            }
            this.routeInfo = routeInfo;
            this.routeInfo.addTo(this.map);
    
        } catch (error) {
            console.error('Error calculating route:', error);
            alert('Error calculant la ruta. Comprova que el mode de transport seleccionat estigui disponible per aquesta ruta.');
        }
    }
    
    displayRoute(path) {
        this.clearRoute();
    
        this.currentRoute = L.polyline(path, {
            color: '#0d6efd',
            weight: 5,
            opacity: 0.7,
            lineJoin: 'round'
        }).addTo(this.map);
    
        this.map.fitBounds(this.currentRoute.getBounds(), {
            padding: [50, 50]
        });
    }

    clearRoute() {
        if (this.currentRoute) {
            this.map.removeLayer(this.currentRoute);
            this.currentRoute = null;
        }
    }

    clearMarkers() {
        if (!this.map) return;
        
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
        
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
            this.userMarker = null;
        }
        
        this.clearRoute();
    }
}