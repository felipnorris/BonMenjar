class BestRecipes {
    constructor() {
        this.recipes = [];
        this.reviews = [];
        this.bestRecipes = [];
        this.swiper = null;

        this.init();
    }

    async init() {
        await this.loadData();
        this.renderTestimonials();
        this.initSwiper();
    }

    async loadData() {
        try {
            const recipesResponse = await fetch('assets/data/receptes.json');
            const recipesData = await recipesResponse.json();
            this.recipes = recipesData["@graph"][0];

            const reviewsResponse = await fetch('assets/data/reviews.json');
            const reviewsData = await reviewsResponse.json();
            this.reviews = reviewsData.reviews;

            this.calculateBestRecipes();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    calculateBestRecipes() {
        const recipeRatings = {};

        this.reviews.forEach(review => {
            const recipeId = review.itemReviewed;
            if (!recipeRatings[recipeId]) {
                recipeRatings[recipeId] = { total: 0, count: 0 };
            }
            recipeRatings[recipeId].total += review.reviewRating.ratingValue;
            recipeRatings[recipeId].count++;
        });

        this.bestRecipes = Object.keys(recipeRatings).map(recipeId => {
            const ratingData = recipeRatings[recipeId];
            const averageRating = ratingData.total / ratingData.count;
            const recipe = this.recipes[recipeId];
            const recipeReviews = this.reviews.filter(r => r.itemReviewed === recipeId);
            
            // Encontrar la mejor reseña para esta receta
            const bestReview = recipeReviews.reduce((prev, current) => 
                (prev.reviewRating.ratingValue > current.reviewRating.ratingValue) ? prev : current
            );
            
            return {
                id: recipeId,
                name: recipe.name,
                image: recipe.image,
                averageRating: averageRating,
                bestReview: bestReview,
                category: recipe.recipeCategory,
                description: recipe.description
            };
        });

        this.bestRecipes.sort((a, b) => b.averageRating - a.averageRating);
        this.bestRecipes = this.bestRecipes.slice(0, 5);
    }

    renderTestimonials() {
        const testimonialsContainer = document.querySelector('.testimonials .swiper-wrapper');
        if (!testimonialsContainer) return;

        testimonialsContainer.innerHTML = '';

        this.bestRecipes.forEach(recipe => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            
            slide.innerHTML = `
                <div class="testimonial-slide">
                    <div class="row align-items-center">
                        <div class="col-md-5">
                            <img src="${recipe.image}" class="img-fluid recipe-image" alt="${recipe.name}">
                        </div>
                        <div class="col-md-7">
                            <div class="recipe-info">
                                <h3>${recipe.name}</h3>
                                <div class="rating mb-3">
                                    ${this.renderStars(recipe.averageRating)}
                                    <span class="ms-2">${recipe.averageRating.toFixed(1)}/5</span>
                                </div>
                                <blockquote class="review-text">
                                    <i class="bi bi-quote quote-icon-left"></i>
                                    ${recipe.bestReview.reviewBody}
                                    <i class="bi bi-quote quote-icon-right"></i>
                                </blockquote>
                                <div class="review-author mt-3">
                                    — ${recipe.bestReview.author}
                                </div>
                                <button class="btn btn-primary mt-3 view-recipe-btn" 
                                        data-category="${recipe.category}"
                                        data-id="${recipe.id}">
                                    Veure recepta completa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            testimonialsContainer.appendChild(slide);
        });

        // Añadir eventos a los botones
        document.querySelectorAll('.view-recipe-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                const tabId = this.getTabIdForCategory(category);
                
                if (tabId) {
                    const tab = document.querySelector(`.nav-tabs a[data-bs-target="${tabId}"]`);
                    if (tab) {
                        new bootstrap.Tab(tab).show();
                    }
                }
                
                window.location.hash = 'receptes';
                
                // Opcional: desplazarse suavemente
                document.getElementById('receptes').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    initSwiper() {
        if (this.swiper) {
            this.swiper.destroy();
        }

        this.swiper = new Swiper('.testimonials .swiper', {
            loop: true,
            speed: 600,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false
            },
            slidesPerView: 1,
            spaceBetween: 30,
            pagination: {
                el: '.testimonials .swiper-pagination',
                type: 'bullets',
                clickable: true
            }
        });
    }

    getTabIdForCategory(category) {
        switch(category) {
            case 'entrants': return '#menu-entrants';
            case 'principals': return '#menu-principals';
            case 'postres': return '#menu-postres';
            case 'begudes': return '#menu-begudes';
            default: return '#menu-principals';
        }
    }

    renderStars(averageRating) {
        const fullStars = Math.floor(averageRating);
        const hasHalfStar = averageRating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) stars += '<i class="bi bi-star-fill"></i>';
        if (hasHalfStar) stars += '<i class="bi bi-star-half"></i>';
        
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) stars += '<i class="bi bi-star"></i>';
        
        return stars;
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    new BestRecipes();
});