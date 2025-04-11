document.addEventListener('DOMContentLoaded', () => {
    const recipeFormatToggle = document.querySelector('.recipe-format-toggle');
    const recipeFormat = document.querySelector('#recipeFormat');
    const icon = recipeFormatToggle.querySelector('i');
    const collapse = new bootstrap.Collapse(recipeFormat, { toggle: false });
    let isTransitioning = false;

    // Toggle al hacer clic en el enlace
    recipeFormatToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isTransitioning) {
            isTransitioning = true;
            if (recipeFormat.classList.contains('show')) {
                collapse.hide();
            } else {
                collapse.show();
            }
        }
    });

    // Manejar eventos de transición
    recipeFormat.addEventListener('shown.bs.collapse', () => {
        icon.style.transform = 'rotate(180deg)';
        isTransitioning = false;
    });

    recipeFormat.addEventListener('hidden.bs.collapse', () => {
        icon.style.transform = 'rotate(0deg)';
        isTransitioning = false;
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!recipeFormat.contains(e.target) && 
            !recipeFormatToggle.contains(e.target) && 
            recipeFormat.classList.contains('show')) {
            collapse.hide();
        }
    });
});