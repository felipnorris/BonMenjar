import { MapHandler } from './modules/MapHandler.js';
import { ReviewHandler } from './modules/ReviewHandler.js';
import { FeaturedRecipeHandler } from './modules/FeaturedRecipeHandler.js';
import { SpeechHandler } from './modules/SpeechHandler.js';
import { YouTubeHandler } from './modules/YouTubeHandler.js';

export class RecipeHandler {
    constructor() {
        this.modal = new bootstrap.Modal(document.getElementById('recipeModal'));
        this.mapHandler = new MapHandler();
        this.reviewHandler = new ReviewHandler();
        this.featuredHandler = new FeaturedRecipeHandler();
        this.speechHandler = new SpeechHandler('#recipeModal');
        this.currentRecipeId = null;
        this.recipes = {};
        this.searchDebounceTimer = null;
        this.youtubeHandler = new YouTubeHandler();
        this.player = null;

        this.init();
    }

    async init() {
        try {
            await Promise.all([
                this.loadRecipes(),
                this.reviewHandler.loadReviews()
            ]);
            this.initializeListeners();
            this.initializeSearch();
            this.renderRecipes();
            this.featuredHandler.updateFeaturedRecipe(this.recipes);
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    async loadRecipes() {
        try {
            const response = await fetch('assets/data/receptes.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.recipes = data['@graph'][0] || {};
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.recipes = {};
        }
    }
    
    renderRecipes() {
        document.querySelectorAll('.menu .row').forEach(container => {
            container.innerHTML = '';
        });
    
        Object.entries(this.recipes).forEach(([id, recipe]) => {       
            const category = recipe.recipeCategory;   
            const categoryContainer = document.querySelector(`#menu-${category} .row`);
            
            if (categoryContainer) {
                const totalTime = this.formatTime(recipe.totalTime);
                const recipeYield = recipe.recipeYield || 'Desconegut';
                
                // Calcular valoración media
                const reviews = this.reviewHandler.reviews[id] || [];
                const averageRating = reviews.length > 0 
                    ? (reviews.reduce((sum, review) => sum + review.reviewRating.ratingValue, 0) / reviews.length).toFixed(1)
                    : '"N/A"';
                
                categoryContainer.innerHTML += `
                    <div class="col-lg-4 menu-item">
                        <a href="#" class="recipe-link" data-recipe-id="${id}">
                            <img src="${recipe.image}" class="menu-img img-fluid" loadding="lazy" alt="${recipe.name}">
                        </a>
                        <h4>${recipe.name}</h4>
                        <p class="recipe-meta">
                            <strong>Temps:</strong> ${totalTime} | 
                            <strong>Per a:</strong> ${recipeYield}
                        </p>
                        <p class="recipe-rating">
                            <strong>Valoració:</strong> ${averageRating}/5 ⭐
                        </p>
                        <p class="ingredients d-none">${recipe.recipeIngredient.join(', ')}</p>
                    </div>
                `;
            }
        });
    }

    formatTime(isoTime) {
        if (!isoTime) return 'N/A';
        const match = isoTime.match(/PT(?:(\d+)D)?(?:(\d+)H)?(?:(\d+)M)?/);
        const days = match[1] ? `${match[1]}d` : '';
        const hours = match[2] ? `${match[2]}h` : '';
        const minutes = match[3] ? `${match[3]}min` : '';
        return `${days} ${hours} ${minutes}`.trim();
    }

    initializeListeners() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.recipe-link');
            if (target) {
                e.preventDefault();
                const recipeId = target.dataset.recipeId;
                if (recipeId) this.showRecipe(recipeId);
            }
        });

        document.querySelector('#hero .recipe-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            const recipeId = e.currentTarget.dataset.recipeId;
            if (recipeId) this.showRecipe(recipeId);
        });

        document.getElementById('review-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const rating = form.querySelector('input[name="rating"]').value;
            const comment = form.querySelector('textarea[name="comment"]').value;
            const author = form.querySelector('input[name="author"]').value;

            await this.reviewHandler.submitReview(
                this.currentRecipeId,
                author,
                parseInt(rating),
                comment
            );
            form.reset();
        });

        document.getElementById('recipeModal')?.addEventListener('hidden.bs.modal', () => {
            this.youtubeHandler.stopVideo();
        });

        document.querySelector('.btn-share')?.addEventListener('click', () => {
            this.shareRecipe();
        });
    }

    initializeSearch() {
        const searchInput = document.getElementById('recipe-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = setTimeout(() => {
                this.performSearch(e.target.value.toLowerCase());
            }, 300);
        });
    }

    performSearch(searchTerm) {
        document.querySelectorAll('.menu-item').forEach(item => {
            const title = item.querySelector('h4')?.textContent.toLowerCase() || '';
            const ingredients = item.querySelector('.ingredients')?.textContent.toLowerCase() || '';
            
            item.style.display = 
                title.includes(searchTerm) || 
                ingredients.includes(searchTerm) ? 
                '' : 'none';
        });
    }

    async showRecipe(recipeId) {
        const recipe = this.recipes[recipeId];
        if (!recipe) {
            console.error("Recipe not found");
            return;
        }
    
        const modal = document.getElementById('recipeModal');
        if (!modal) {
            console.error("Modal not found");
            return;
        }
    
        this.currentRecipeId = recipeId;
    
        modal.querySelector('.modal-title').textContent = recipe.name;
        modal.querySelector('.recipe-image').src = recipe.image;
        modal.querySelector('.recipe-description').textContent = recipe.description;
        
        this.renderIngredients(modal, recipe.recipeIngredient);
        this.renderInstructions(modal, recipe.recipeInstructions);
        
        this.reviewHandler.displayReviews(recipeId);
        
        const videoFrame = modal.querySelector('.recipe-video');
    
        // Asegurarse de destruir completamente el player anterior
        await this.youtubeHandler.cleanupPlayer();
        
        // Crear un nuevo contenedor para el video
        videoFrame.innerHTML = '<div id="youtube-player-container"></div>';
        const playerContainer = videoFrame.querySelector('#youtube-player-container');
        
        if (recipe.video?.contentUrl) {
            await this.youtubeHandler.loadAPI();
            this.youtubeHandler.loadVideo(recipe.video.contentUrl, playerContainer);
        } else {
            videoFrame.innerHTML = "<div class=\"alert alert-info\">El video d'aquesta recepta no està disponible en aquests moments.</div>";
        }

        // Maneja los restaurantes
        const restaurants = Array.isArray(recipe.subjectOf) ? recipe.subjectOf : [recipe.subjectOf];
        this.mapHandler.initMap(restaurants);
        
        this.speechHandler.initializeSpeechButtons(modal);
        
        this.modal.show();
    }

    renderIngredients(modal, ingredients) {
        const ingredientsList = modal.querySelector('.recipe-ingredients');
        ingredientsList.innerHTML = ingredients
            .map(ing => `<li>${ing}</li>`)
            .join('');
    }

    renderInstructions(modal, instructions) {
        const instructionsList = modal.querySelector('.recipe-instructions');
        instructionsList.innerHTML = instructions
            .map(step => `<li>${step.text}</li>`)
            .join('');
    }

    async shareRecipe() {
        if (!this.currentRecipeId || !this.recipes[this.currentRecipeId]) return;

        const recipe = this.recipes[this.currentRecipeId];
        if (navigator.share) {
            try {
                await navigator.share({
                    title: recipe.name,
                    text: recipe.description,
                    url: window.location.href
                });
            } catch (error) {
                console.error('Error sharing recipe:', error);
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RecipeHandler();
});