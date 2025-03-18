export class ReviewHandler {
    constructor() {
        this.reviews = {};
    }

    async loadReviews() {
        try {
            const response = await fetch('assets/data/reviews.json');
            const data = await response.json();
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

    displayReviews(recipeId) {
        if (!this.reviews) {
            console.error("Las reseñas no se han cargado correctamente.");
            return;
        }
    
        const reviewsContainer = document.querySelector('.reviews-container');
        reviewsContainer.innerHTML = '';
    
        const reviews = Array.isArray(this.reviews[recipeId]) ? this.reviews[recipeId] : [];
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p>No hi ha ressenyes encara.</p>';
            return;
        }
    
        reviewsContainer.innerHTML = this.renderReviews(reviews);
    }

    renderReviews(reviews) {
        return reviews.map(review => {
            const rating = review.reviewRating?.ratingValue ?? 0;
            return `
                <div class="review-item">
                    <strong>${review.author}</strong> - 
                    <span>${'⭐'.repeat(rating)}</span>
                    <p>${review.reviewBody}</p>
                </div>
            `;
        }).join('');
    }
}