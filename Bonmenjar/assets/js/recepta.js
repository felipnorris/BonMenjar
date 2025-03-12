class RecipeHandler {
    constructor() {
        this.modal = new bootstrap.Modal(document.getElementById('recipeModal'));
        this.map = null;
        this.currentRecipeId = null;
        this.recipes = {};
        this.reviews = {}; // Asegurar que siempre existe

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
            this.recipes = await response.json();
        } catch (error) {
            console.error('Error loading recipes:', error);
        }
    }

    async loadReviews() {
        try {
            const response = await fetch('assets/data/reviews.json');
            this.reviews = await response.json();
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.reviews = {}; // En caso de error, inicializamos vacío
        }
    }
    

    renderRecipes() {
        // Clear existing recipes
        document.querySelectorAll('.menu .row').forEach(container => {
            container.innerHTML = '';
        });
    
        // Category mapping
        const categoryMapping = {
            'entrants': 'menu-entrants',
            'principals': 'menu-principals',
            'postres': 'menu-postres',
            'begudes': 'menu-begudes'
        };
    
        function formatTime(isoTime) {
            if (!isoTime) return 'N/A';
            const match = isoTime.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
            const hours = match[1] ? `${match[1]}h` : '';
            const minutes = match[2] ? `${match[2]}min` : '';
            return `${hours} ${minutes}`.trim();
        }
    
        // Render recipes by category
        Object.entries(this.recipes).forEach(([id, recipe]) => {
            const tabId = categoryMapping[recipe.recipeCategory];            
            const categoryContainer = document.querySelector(`#${tabId} .row`);
            
            if (categoryContainer) {

                const totalTime = formatTime(recipe.totalTime);
                const recipeYield = recipe.recipeYield || 'Desconegut';

                categoryContainer.innerHTML += `
                    <div class="col-lg-4 menu-item">
                        <a href="#" class="recipe-link" data-recipe-id="${id}">
                            <img src="${recipe.image}" class="menu-img img-fluid" alt="${recipe.name}">
                        </a>
                        <h4>${recipe.name}</h4>
                         <p class="recipe-meta"><strong>Temps:</strong> ${totalTime} | <strong>Per a:</strong> ${recipe.recipeYield}</p>
                    </div>
                `;
            } else {
                console.warn(`Container not found for category: ${recipe.recipeCategory}`);
            }
        });
    }

    updateFeaturedRecipe() {
        const currentMonth = new Date().toLocaleString('es', { month: 'long' });
        console.log('Current month:', currentMonth);
        const featuredRecipe = Object.entries(this.recipes).find(([_, recipe]) => 
            recipe.featuredMonth && recipe.featuredMonth.toLowerCase() === currentMonth
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
                console.log("Recipe clicked, ID:", recipeId); // Depuración
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

        document.querySelector('.btn-speak')?.addEventListener('click', () => {
            this.speakRecipe();
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
        console.log(`Intentando mostrar receta con ID: ${recipeId}`); // Debugging
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
        
        this.initMap(recipe.restaurants);
        this.modal.show();
    }

    initMap(restaurants) {
        if (!this.map) {
            this.map = L.map('recipe-map').setView([39.6953, 3.0176], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        }

        this.map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                this.map.removeLayer(layer);
            }
        });

        restaurants.forEach(rest => {
            L.marker([rest.geo.latitude, rest.geo.longitude])
                .bindPopup(`<b>${rest.name}</b><br>${rest.address.streetAddress}`)
                .addTo(this.map);
        });
    }

    submitReview(form) {
        const review = {
            rating: parseInt(form.rating.value),
            comment: form.comment.value,
            date: new Date().toISOString()
        };

        recipes[this.currentRecipeId].reviews.push(review);
        this.displayReviews(recipes[this.currentRecipeId].reviews);
        form.reset();
    }

    displayReviews(recipeId) {
        if (!this.reviews) {
            console.error("Las reseñas no se han cargado correctamente.");
            this.reviews = {}; // Evita futuros errores
        }
    
        const reviewsContainer = document.querySelector('.reviews-container');
        reviewsContainer.innerHTML = '';
    
        const reviews = this.reviews[recipeId] || [];
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p>No hi ha ressenyes encara.</p>';
            return;
        }
    
        reviews.forEach(review => {
            reviewsContainer.innerHTML += `
                <div class="review-item">
                    <strong>${review.author}</strong> - 
                    <span>${'⭐'.repeat(review.reviewRating.ratingValue)}</span>
                    <p>${review.reviewBody}</p>
                </div>
            `;
        });
    }

    submitReview() {
        const author = document.getElementById('review-author').value;
        const rating = parseInt(document.getElementById('review-rating').value);
        const comment = document.getElementById('review-comment').value;
    
        if (!author || !comment) return;
    
        const newReview = {
            "@type": "Review",
            "author": author,
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": rating
            },
            "reviewBody": comment
        };
    
        if (!this.reviews[this.currentRecipeId]) {
            this.reviews[this.currentRecipeId] = [];
        }
    
        this.reviews[this.currentRecipeId].push(newReview);
        this.displayReviews(this.currentRecipeId);
    
        document.getElementById('review-form').reset();
    }

    speakRecipe() {
        const recipe = recipes[this.currentRecipeId];
        const text = `${recipe.title}. ${recipe.instructions}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ca-ES';
        speechSynthesis.speak(utterance);
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