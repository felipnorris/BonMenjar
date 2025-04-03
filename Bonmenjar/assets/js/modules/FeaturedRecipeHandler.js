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

    formatTime(isoTime) {
        if (!isoTime) return 'N/A';
        
        const match = isoTime.match(/PT(?:(\d+)D)?(?:(\d+)H)?(?:(\d+)M)?/);
        if (!match) return 'N/A';

        const days = match[1] ? `${match[1]}d` : '';
        const hours = match[2] ? `${match[2]}h` : '';
        const minutes = match[3] ? `${match[3]}min` : '';
        
        return `${days} ${hours} ${minutes}`.trim() || 'N/A';
    }

    updateHeroSection(featuredRecipe) {
        if (!featuredRecipe) {
            console.log('No featured recipe for current month');
            return;
        }

        const heroSection = document.querySelector('#hero');
        if (!heroSection) return;

        const elements = {
            title: heroSection.querySelector('h2'),
            prepTime: heroSection.querySelector('.prep-time'),
            servings: heroSection.querySelector('.servings'),
            description: heroSection.querySelector('.recipe-description'),
            image: heroSection.querySelector('.hero-img img'),
            recipeLink: heroSection.querySelector('.recipe-link')
        };

        // Update title
        if (elements.title) {
            elements.title.textContent = featuredRecipe.name || 'N/A';
        }

        // Update prep time
        if (elements.prepTime) {
            elements.prepTime.textContent = this.formatTime(featuredRecipe.totalTime);
        }

        // Update servings
        if (elements.servings) {
            elements.servings.textContent = 
                featuredRecipe.recipeYield ? 
                `${featuredRecipe.recipeYield}` : 
                'N/A';
        }

        // Update description
        if (elements.description) {
            elements.description.innerHTML = 
                `${featuredRecipe.description || ''}`;
        }

        // Update image
        if (elements.image) {
            elements.image.src = featuredRecipe.image;
            elements.image.alt = featuredRecipe.name;
        }

        // Update recipe link
        if (elements.recipeLink) {
            elements.recipeLink.dataset.recipeId = featuredRecipe.id;
        }
    }
}