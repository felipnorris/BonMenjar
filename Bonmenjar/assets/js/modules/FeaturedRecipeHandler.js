export class FeaturedRecipeHandler {
    constructor() {
        this.currentMonth = new Date().toLocaleString('ca-ES', { month: 'long' });
    }

    updateFeaturedRecipe(recipes) {
        const featuredRecipe = this.findFeaturedRecipe(recipes);
        this.updateHeroSection(featuredRecipe);
    }

    findFeaturedRecipe(recipes) {
        const featured = Object.entries(recipes).find(([_, recipe]) => 
            recipe.temporal && 
            recipe.temporal.toLowerCase() === this.currentMonth.toLowerCase()
        );

        return featured ? { id: featured[0], ...featured[1] } : null;
    }

    updateHeroSection(featuredRecipe) {
        if (!featuredRecipe) {
            console.log('No featured recipe for current month');
            return;
        }

        const heroSection = document.querySelector('#hero');
        if (!heroSection) return;

        const elements = {
            title: heroSection.querySelector('h1'),
            description: heroSection.querySelector('p'),
            image: heroSection.querySelector('.hero-img img'),
            recipeLink: heroSection.querySelector('.recipe-link')
        };

        if (elements.title) elements.title.textContent = 'Plat del mes';
        if (elements.description) {
            elements.description.innerHTML = 
                `${featuredRecipe.name}<br>Plat típic del mes de ${featuredRecipe.temporal}`;
        }
        if (elements.image) elements.image.src = featuredRecipe.image;
        if (elements.recipeLink) elements.recipeLink.dataset.recipeId = featuredRecipe.id;
    }
}