const recipes = {
    'recipe-1': {
        title: 'Frit Mallorquí',
        image: 'assets/img/menu/frit-mallorqui.jpg',
        description: 'Plat tradicional mallorquí elaborat amb fetge i altres vísceres, típic dels matins de matances.',
        video: 'https://www.youtube.com/embed/example',
        ingredients: [
            '500g fetge de xai',
            '2 patates',
            '2 pebrots vermells',
            'Oli d\'oliva',
            'Sal i pebre'
        ],
        instructions: 'Tallar el fetge a daus petits. Pelar i tallar les patates. Fregir tot fins que estigui daurat...',
        category: 'starters',
        restaurants: [
            {
                name: 'Ca na Toneta',
                lat: 39.6953,
                lng: 3.0176,
                address: 'Carrer Major, 12, Palma'
            }
        ],
        reviews: []
    },
    'recipe-2': {
        title: 'Caragols',
        image: 'assets/img/menu/caragols.jpg',
        description: 'Plat típic del mes de Març...',
        video: 'https://www.youtube.com/embed/Y7f98aduVJ8',
        ingredients: [
            'Caragols',
            'All i julivert',
            'Sal'
        ],
        instructions: 'Preparació dels caragols...',
        category: 'principals',
        restaurants: [
            {
                name: 'Can Joan',
                lat: 39.7219,
                lng: 2.9106,
                address: 'Carrer Major, 15, Sóller'
            }
        ],
        reviews: []
    }
};

class RecipeHandler {
    constructor() {
        this.modal = new bootstrap.Modal(document.getElementById('recipeModal'));
        this.map = null;
        this.currentRecipeId = null;
        this.initializeListeners();
        this.initializeSearch();
    }

    initializeListeners() {
        document.querySelectorAll('.menu-item, .recipe-link').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const recipeId = item.dataset.recipeId;
                this.currentRecipeId = recipeId;
                this.showRecipe(recipeId);
            });
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
        const recipe = recipes[recipeId];
        const modal = document.getElementById('recipeModal');

        modal.querySelector('.modal-title').textContent = recipe.title;
        modal.querySelector('.recipe-image').src = recipe.image;
        modal.querySelector('.recipe-description').textContent = recipe.description;
        modal.querySelector('.recipe-video').src = recipe.video;
        
        const ingredientsList = modal.querySelector('.recipe-ingredients');
        ingredientsList.innerHTML = recipe.ingredients
            .map(ing => `<li>${ing}</li>`)
            .join('');
            
        modal.querySelector('.recipe-instructions').textContent = recipe.instructions;
        
        this.initMap(recipe.restaurants);
        this.displayReviews(recipe.reviews);
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
            L.marker([rest.lat, rest.lng])
                .bindPopup(`<b>${rest.name}</b><br>${rest.address}`)
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

document.addEventListener('DOMContentLoaded', () => {
    const recipeHandler = new RecipeHandler();
});