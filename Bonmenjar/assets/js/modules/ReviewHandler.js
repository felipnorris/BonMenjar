export class ReviewHandler {
    constructor() {
        this.reviews = {};
        this.reviewForm = document.getElementById('review-form');
        this.initializeForm();
    }

    async loadReviews() {
        try {
            const response = await fetch('assets/data/reviews.json');
            if (!response.ok) throw new Error('Error loading reviews');
            const data = await response.json();
            
            // Organizar reseñas por receta
            this.reviews = {};
            data.reviews.forEach(review => {
                if (!this.reviews[review.itemReviewed]) {
                    this.reviews[review.itemReviewed] = [];
                }
                this.reviews[review.itemReviewed].push(review);
            });
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.reviews = {};
        }
    }

    initializeForm() {
        if (!this.reviewForm) return;

        this.reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                author: document.getElementById('review-author').value,
                itemReviewed: this.currentRecipeId,
                reviewRating: parseInt(document.getElementById('review-rating').value),
                reviewBody: document.getElementById('review-comment').value
            };

            try {
                const response = await fetch('forms/submitReview.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
                
                if (result.status === 'success') {
                    // Actualizar las reseñas localmente
                    if (!this.reviews[this.currentRecipeId]) {
                        this.reviews[this.currentRecipeId] = [];
                    }
                    this.reviews[this.currentRecipeId].push(result.review);
                    
                    // Actualizar la visualización
                    this.displayReviews(this.currentRecipeId);
                    
                    // Limpiar el formulario
                    this.reviewForm.reset();
                    
                    // Mostrar mensaje de éxito
                    alert('Ressenya enviada correctament!');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al enviar la ressenya. Si us plau, intenta-ho de nou.');
            }
        });
    }

    displayReviews(recipeId) {
        this.currentRecipeId = recipeId;
        const reviewsList = document.querySelector('.reviews-list');
        if (!reviewsList) return;

        const recipeReviews = this.reviews[recipeId] || [];
        
        if (recipeReviews.length === 0) {
            reviewsList.innerHTML = '<p>Encara no hi ha ressenyes per aquesta recepta.</p>';
            return;
        }

        reviewsList.innerHTML = recipeReviews.map(review => `
            <div class="review-item mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="mb-0">${review.author}</h5>
                    <div class="rating">
                        ${'⭐'.repeat(review.reviewRating.ratingValue)}
                    </div>
                </div>
                <p class="mb-0">${review.reviewBody}</p>
            </div>
        `).join('');
    }
}