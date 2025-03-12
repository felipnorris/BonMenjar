class RecipeHandler {
    constructor() {
        this.modal = new bootstrap.Modal(document.getElementById('recipeModal'));
        this.map = null;
        this.currentRecipeId = null;
        this.recipes = {};
        this.loadRecipes().then(() => {
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
    
        // Debug log
        console.log('Available recipes:', this.recipes);
    
        // Render recipes by category
        Object.entries(this.recipes).forEach(([id, recipe]) => {
            console.log(`Processing recipe: ${recipe.name}, Category: ${recipe.recipeCategory}`);
            const tabId = categoryMapping[recipe.recipeCategory];
            console.log(`Looking for container with ID: ${tabId}`);
            
            const categoryContainer = document.querySelector(`#${tabId} .row`);
            
            if (categoryContainer) {
                categoryContainer.innerHTML += `
                    <div class="col-lg-4 menu-item">
                        <a href="#" class="recipe-link" data-recipe-id="${id}">
                            <img src="${recipe.image}" class="menu-img img-fluid" alt="${recipe.name}">
                        </a>
                        <h4>${recipe.name}</h4>
                        <p class="ingredients">
                            ${recipe.recipeIngredient.slice(0,3).join(', ')}
                        </p>
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

        document.querySelector('.review-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview(e.target);
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
        if (!recipe) return;

        const modal = document.getElementById('recipeModal');
        modal.querySelector('.modal-title').textContent = recipe.name;
        modal.querySelector('.recipe-image').src = recipe.image;
        modal.querySelector('.recipe-description').textContent = recipe.description;
        
        const ingredientsList = modal.querySelector('.recipe-ingredients');
        ingredientsList.innerHTML = recipe.recipeIngredient
            .map(ing => `<li>${ing}</li>`)
            .join('');
            
        modal.querySelector('.recipe-instructions').textContent = recipe.recipeInstructions[0].text;
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

    displayReviews(reviews) {
        const container = document.querySelector('.reviews-container');
        container.innerHTML = reviews.map(review => `
            <div class="review-item mb-3">
                <div class="stars">${'⭐'.repeat(review.rating)}</div>
                <p>${review.comment}</p>
                <small class="text-muted">${new Date(review.date).toLocaleDateString()}</small>
            </div>
        `).join('');
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