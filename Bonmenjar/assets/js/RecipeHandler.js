import { MapHandler } from './modules/MapHandler.js';
import { ReviewHandler } from './modules/ReviewHandler.js';
import { FeaturedRecipeHandler } from './modules/FeaturedRecipeHandler.js';

class RecipeHandler {
    constructor() {
        this.modal = new bootstrap.Modal(document.getElementById('recipeModal'));
        this.mapHandler = new MapHandler();
        this.reviewHandler = new ReviewHandler();
        this.featuredHandler = new FeaturedRecipeHandler();
        this.currentRecipeId = null;
        this.recipes = {};

        Promise.all([
            this.loadRecipes(), 
            this.reviewHandler.loadReviews()
        ]).then(() => {
            this.initializeListeners();
            this.initializeSearch();
            this.renderRecipes();
            this.featuredHandler.updateFeaturedRecipe(this.recipes);
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

        this.reviewHandler.displayReviews(recipeId);
        modal.querySelector('.recipe-video').src = recipe.video.contentUrl;
        
        this.mapHandler.initMap(recipe.subjectOf);
        this.modal.show();
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