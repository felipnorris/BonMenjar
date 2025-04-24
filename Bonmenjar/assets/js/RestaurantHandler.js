export class RestaurantHandler {
    constructor() {
        this.restaurants = [];
        this.currentPage = 1;
        this.restaurantsPerPage = 3;
    }

    async init() {
        try {
            const response = await fetch('assets/data/restaurants.json');
            const data = await response.json();
            this.restaurants = data.itemListElement.map(item => item.item);
            this.displayRestaurants();
            this.setupPagination();
        } catch (error) {
            console.error('Error loading restaurants:', error);
        }
    }

    displayRestaurants() {
        const container = document.getElementById('restaurants-container');
        const startIndex = (this.currentPage - 1) * this.restaurantsPerPage;
        const endIndex = startIndex + this.restaurantsPerPage;
        const currentRestaurants = this.restaurants.slice(startIndex, endIndex);
      
        container.innerHTML = '';
      
        currentRestaurants.forEach(restaurant => {
          const restaurantElement = document.createElement('div');
          restaurantElement.className = 'col-md-4 restaurant-item';
          restaurantElement.innerHTML = `
            <a href="${restaurant.acceptsReservations}" target="_blank" rel="noopener noreferrer" class="text-decoration-none d-block h-100">
              <div class="restaurant-content">
                <h3 class="restaurant-name">${restaurant.name}</h3>
                <p class="restaurant-address mb-0">
                  <i class="bi bi-geo-alt me-2"></i>
                  ${restaurant.address.streetAddress},<br>
                  ${restaurant.address.postalCode} ${restaurant.address.addressLocality}
                </p>
              </div>
            </a>
          `;
          container.appendChild(restaurantElement);
        });
      
        // Rellenar el espacio restante si hay menos de 3 restaurantes
        const remaining = this.restaurantsPerPage - currentRestaurants.length;
        for (let i = 0; i < remaining; i++) {
          const emptyElement = document.createElement('div');
          emptyElement.className = 'col-md-4 restaurant-item';
          emptyElement.style.visibility = 'hidden';
          container.appendChild(emptyElement);
        }
      }

    setupPagination() {
        const paginationContainer = document.getElementById('restaurants-pagination');
        const totalPages = Math.ceil(this.restaurants.length / this.restaurantsPerPage);

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">Anterior</a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">Següent</a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHTML;

        // Add event listeners to pagination buttons
        paginationContainer.querySelectorAll('.page-link').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const newPage = parseInt(e.target.dataset.page);
                if (!isNaN(newPage) && newPage > 0 && newPage <= totalPages) {
                    this.currentPage = newPage;
                    this.displayRestaurants();
                    this.setupPagination();
                }
            });
        });
    }
}