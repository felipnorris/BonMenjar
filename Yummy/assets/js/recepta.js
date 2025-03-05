const recipes = {
    'recipe-1': {
        title: 'Frit Mallorquí',
        image: 'assets/img/menu/frit.jpg',
        ingredients: [
            '500g fetge de xai',
            '2 patates',
            '2 pebrots vermells',
            'Oli d\'oliva',
            'Sal i pebre'
        ],
        instructions: 'Tallar el fetge a daus...',
        category: 'starters'
    }
    // Add more recipes...
};

class RecipeHandler {
    constructor() {
        this.modal = new bootstrap.Modal(document.getElementById('recipeModal'));
        this.initializeListeners();
    }

    initializeListeners() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const recipeId = item.dataset.recipeId;
                this.showRecipe(recipeId);
            });
        });

        document.querySelector('.btn-speak').addEventListener('click', () => {
            this.speakRecipe();
        });
    }

    showRecipe(recipeId) {
        const recipe = recipes[recipeId];
        const modal = document.getElementById('recipeModal');
        
        modal.querySelector('.modal-title').textContent = recipe.title;
        modal.querySelector('.recipe-image').src = recipe.image;
        
        const ingredientsList = modal.querySelector('.recipe-ingredients');
        ingredientsList.innerHTML = recipe.ingredients
            .map(ing => `<li>${ing}</li>`)
            .join('');
            
        modal.querySelector('.recipe-instructions').textContent = recipe.instructions;
        
        this.modal.show();
    }

    speakRecipe() {
        const title = document.querySelector('.modal-title').textContent;
        const instructions = document.querySelector('.recipe-instructions').textContent;
        
        const utterance = new SpeechSynthesisUtterance(`${title}. ${instructions}`);
        utterance.lang = 'ca-ES';
        speechSynthesis.speak(utterance);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const recipeHandler = new RecipeHandler();
});