export class FeaturedRecipeHandler {
    constructor() {
      this.currentMonth = new Date().toLocaleString('ca-ES', { month: 'long' }).toLowerCase();
      this.recipeCache = JSON.parse(localStorage.getItem('recipeCache')) || {};
    }
  
    async updateFeaturedRecipe(recipes) {
      if (!this.recipeCache[this.currentMonth]) {
        this.recipeCache[this.currentMonth] = recipes;
        localStorage.setItem('recipeCache', JSON.stringify(this.recipeCache));
      }
      const featuredRecipe = this.findFeaturedRecipe(this.recipeCache[this.currentMonth] || recipes);
      
      // Preload image before updating the hero section
      if (featuredRecipe?.image) {
        await this.preloadImage(featuredRecipe.image);
        if (featuredRecipe.imageMobile) {
          await this.preloadImage(featuredRecipe.imageMobile);
        }
      }
      
      this.updateHeroSection(featuredRecipe);
    }
    
    async preloadImage(url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = resolve;
      });
    }
  
    findFeaturedRecipe(recipes) {
      const featured = Object.entries(recipes).find(([_, recipe]) => 
        recipe.temporal && recipe.temporal.toLowerCase() === this.currentMonth
        // recipe.temporal && recipe.temporal.toLowerCase() === "octubre"   // --> Per fer proves.
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
        title: heroSection.querySelector('h3'),
        prepTime: heroSection.querySelector('.prep-time'),
        servings: heroSection.querySelector('.servings'),
        description: heroSection.querySelector('.recipe-description'),
        image: heroSection.querySelector('.hero-img img'),
        recipeLink: heroSection.querySelector('.recipe-link')
      };
  
      if (elements.title) elements.title.textContent = featuredRecipe.name || 'N/A';
      if (elements.prepTime) elements.prepTime.textContent = this.formatTime(featuredRecipe.totalTime);
      if (elements.servings) elements.servings.textContent = featuredRecipe.recipeYield ? `${featuredRecipe.recipeYield}` : 'N/A';
      if (elements.description) elements.description.innerHTML = `${featuredRecipe.description || ''}`;
      if (elements.image) {
        const imageUrl = window.innerWidth <= 768 ? 
          (featuredRecipe.imageMobile || featuredRecipe.image) : 
          featuredRecipe.image;
        
        // Solo actualizar si la URL es diferente
        if (elements.image.src !== imageUrl) {
          elements.image.src = imageUrl;
          elements.image.alt = featuredRecipe.name || '';
          elements.image.loading = 'eager'; // Solo para la imagen hero principal
          // Añadir dimensiones intrínsecas si están disponibles
          if (featuredRecipe.imageWidth) elements.image.width = featuredRecipe.imageWidth;
          if (featuredRecipe.imageHeight) elements.image.height = featuredRecipe.imageHeight;
        }
      }
      if (elements.recipeLink) elements.recipeLink.dataset.recipeId = featuredRecipe.id;
    }
  }