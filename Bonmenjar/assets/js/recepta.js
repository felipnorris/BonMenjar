class RecipeHandler {
    constructor() {
        this.modal = new bootstrap.Modal(document.getElementById('recipeModal'));
        this.map = null;
        this.currentRecipeId = null;
        this.recipes = {};
        this.reviews = {};

        Promise.all([this.loadRecipes(), this.loadReviews()]).then(() => {
            this.initializeListeners();
            this.initializeSearch();
            this.renderRecipes();
            this.updateFeaturedRecipe();
        });
    }

    async loadRecipes() {
        try {
            const response = await fetch('assets/data/receptes.json');
            const data = await response.json();
            // Store only the recipes object, not the whole graph
            this.recipes = data['@graph'][0] || {};
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.recipes = {};
        }
    }

    async loadReviews() {
        try {
            const response = await fetch('assets/data/reviews.json');
            const data = await response.json();
            // Reorganizamos las reviews por receta
            this.reviews = data.reviews.reduce((acc, review) => {
                if (!acc[review.itemReviewed]) {
                    acc[review.itemReviewed] = [];
                }
                acc[review.itemReviewed].push(review);
                return acc;
            }, {});
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.reviews = {};
        }
    }
    
    renderRecipes() {
        // Netejar els continguts dels contenidors de categories
        document.querySelectorAll('.menu .row').forEach(container => {
            container.innerHTML = '';
        });
    
        function formatTime(isoTime) {
            if (!isoTime) return 'N/A';
            const match = isoTime.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
            const hours = match[1] ? `${match[1]}h` : '';
            const minutes = match[2] ? `${match[2]}min` : '';
            return `${hours} ${minutes}`.trim();
        }
    
        // Render recipes by category
        Object.entries(this.recipes).forEach(([id, recipe]) => {       
            const category = recipe.recipeCategory;   
            const categoryContainer = document.querySelector(`#menu-${category} .row`);
            
            if (categoryContainer) {
                const totalTime = formatTime(recipe.totalTime);
                const recipeYield = recipe.recipeYield || 'Desconegut';

                categoryContainer.innerHTML += `
                    <div class="col-lg-4 menu-item">
                        <a href="#" class="recipe-link" data-recipe-id="${id}">
                            <img src="${recipe.image}" class="menu-img img-fluid" alt="${recipe.name}">
                        </a>
                        <h4>${recipe.name}</h4>
                         <p class="recipe-meta"><strong>Temps:</strong> ${totalTime} | <strong>Per a:</strong> ${recipeYield}</p>
                    </div>
                `;
            } else {
                console.warn(`Container not found for category: ${category}`);
            }
        });
    }

    updateFeaturedRecipe() {
        const currentMonth = new Date().toLocaleString('ca-ES', { month: 'long' });
        const featuredRecipe = Object.entries(this.recipes).find(([_, recipe]) => 
            recipe.temporal && recipe.temporal.toLowerCase() === currentMonth
        );

        if (featuredRecipe) {
            const [recipeId, recipe] = featuredRecipe;
            const heroSection = document.querySelector('#hero');
            
            if (heroSection) {
                const title = heroSection.querySelector('h1');
                const description = heroSection.querySelector('p');
                const image = heroSection.querySelector('.hero-img img');
                const recipeLink = heroSection.querySelector('.recipe-link');
    
                if (title) title.textContent = 'Plat del mes';
                if (description) description.innerHTML = 
                    `${recipe.name}<br>Plat típic del mes de ${recipe.featuredMonth}`;
                if (image) image.src = recipe.image;
                if (recipeLink) recipeLink.dataset.recipeId = recipeId;
            }
        } else {
            console.log('No featured recipe for current month');
        }
    }

    initializeListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.recipe-link');
            if (target) {
                e.preventDefault();
                const recipeId = target.dataset.recipeId;
                if (recipeId) recipeHandler.showRecipe(recipeId);
            }
        });

        document.querySelector('#hero .recipe-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            const recipeId = e.currentTarget.dataset.recipeId;
            if (recipeId) {
                this.showRecipe(recipeId);
            }
        });

        document.getElementById('review-form').addEventListener('submit', (e) => {
            e.preventDefault();
            recipeHandler.submitReview();
        });

        document.querySelector('.btn-share')?.addEventListener('click', () => {
            this.shareRecipe();
        });
    }

    initializeSearch() {
        document.getElementById('recipe-search')?.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const menuItems = document.querySelectorAll('.menu-item');
            
            menuItems.forEach(item => {
                const title = item.querySelector('h4').textContent.toLowerCase();
                const ingredients = item.querySelector('.ingredients').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || ingredients.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    showRecipe(recipeId) {
        const recipe = this.recipes[recipeId];
        if (!recipe) {
            console.error("Receta no encontrada");
            return;
        }
    
        const modal = document.getElementById('recipeModal');
        if (!modal) {
            console.error("Modal no encontrado");
            return;
        }

        modal.querySelector('.modal-title').textContent = recipe.name;
        modal.querySelector('.recipe-image').src = recipe.image;
        modal.querySelector('.recipe-description').textContent = recipe.description;
        
        const ingredientsList = modal.querySelector('.recipe-ingredients');
        ingredientsList.innerHTML = recipe.recipeIngredient
            .map(ing => `<li>${ing}</li>`)
            .join('');
            
        const instructionsList = modal.querySelector('.recipe-instructions');
        instructionsList.innerHTML = recipe.recipeInstructions
            .map(step => `<li>${step.text}</li>`)
            .join('');

        this.displayReviews(recipeId);
        modal.querySelector('.recipe-video').src = recipe.video.contentUrl;
        
        this.initMap(recipe.subjectOf);
        this.modal.show();
    }

    initMap(restaurantData) {
        if (!restaurantData) {
            console.warn("No restaurant data available");
            return;
        }
    
        // Initialize map if not already done
        if (!this.map) {
            this.map = L.map('recipe-map').setView([39.6953, 3.0176], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        }
    
        // Clear existing markers
        this.map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                this.map.removeLayer(layer);
            }
        });
    
        // Handle single restaurant data from subjectOf
        if (restaurantData['@type'] === 'Restaurant' && restaurantData.geo) {
            try {
                const marker = L.marker([
                    parseFloat(restaurantData.geo.latitude),
                    parseFloat(restaurantData.geo.longitude)
                ]);
    
                const popupContent = `
                    <div class="restaurant-popup">
                        <h5>${restaurantData.name}</h5>
                        ${restaurantData.address?.streetAddress ? 
                            `<p>${restaurantData.address.streetAddress}, ${restaurantData.address.addressLocality}</p>` 
                            : ''}
                    </div>
                `;
    
                marker.bindPopup(popupContent).addTo(this.map);
            } catch (error) {
                console.error('Error adding restaurant marker:', error);
            }
        }
    }

    displayReviews(recipeId) {
        if (!this.reviews) {
            console.error("Las reseñas no se han cargado correctamente.");
            this.reviews = {}; // Evita futuros errores
        }
    
        const reviewsContainer = document.querySelector('.reviews-container');
        reviewsContainer.innerHTML = '';
    
        const reviews = Array.isArray(this.reviews[recipeId]) ? this.reviews[recipeId] : [];
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p>No hi ha ressenyes encara.</p>';
            return;
        }
    
        reviewsContainer.innerHTML = reviews.map(review => {
            const rating = review.reviewRating?.ratingValue ?? 0;
            return `
                <div class="review-item">
                    <strong>${review.author}</strong> - 
                    <span>${'⭐'.repeat(rating)}</span>
                    <p>${review.reviewBody}</p>
                </div>
            `;
        }).join('');
        
    }

    shareRecipe() {
        const recipe = recipes[this.currentRecipeId];
        if (navigator.share) {
            navigator.share({
                title: recipe.title,
                text: recipe.description,
                url: window.location.href
            });
        }
    }
}

let recipeHandler;

document.addEventListener('DOMContentLoaded', () => {0
    recipeHandler = new RecipeHandler();
});