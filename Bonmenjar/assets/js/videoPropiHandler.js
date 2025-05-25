document.addEventListener('DOMContentLoaded', function() {
    const videoUrls = {
        carlos: 'assets/video/carlos.mp4',
        felip: 'assets/video/felip.mp4',
        rafa: 'assets/video/rafa.mp4'
    };

    const videoModal = document.getElementById('videoModal');
    const videoElement = document.getElementById('memberVideo');
    const videoButtons = document.querySelectorAll('.video-btn');
    const modal = new bootstrap.Modal(videoModal);

    videoButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const member = this.dataset.member;
            
            if (videoUrls[member]) {
                // Configurar la fuente del video usando source
                videoElement.innerHTML = `
                    <source src="${videoUrls[member]}" type="video/mp4">
                    Tu navegador no soporta el elemento video.
                `;
                
                // Cargar y mostrar el video
                videoElement.load();
                modal.show();
            }
        });
    });

    // Limpiar video al cerrar modal
    videoModal.addEventListener('hidden.bs.modal', () => {
        videoElement.pause();
        videoElement.innerHTML = '';
    });

    // Manejador de errores
    videoElement.addEventListener('error', (e) => {
        console.error('Error en la carga del video:', e);
        modal.hide();
        alert('Error al cargar el video. Por favor, inténtelo de nuevo.');
    });
});