export class SpeechHandler {
    constructor() {
        this.synth = window.speechSynthesis;
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.pauseResumeButton = null;

        // Inicializa los botones de voz
        this.initializeSpeechButtons();

        // Evento para cerrar el modal
        const recipeModal = document.getElementById('recipeModal');
        recipeModal.addEventListener('hidden.bs.modal', () => this.stopSpeech());
    }

    initializeSpeechButtons() {
        // Seleccionamos todos los botones de voz
        this.speechButtons = document.querySelectorAll('.speech-btn');

        // Añadimos los eventos a los botones
        this.speechButtons.forEach(button => {
            button.addEventListener('click', () => this.toggleSpeech(button));
        });
    }

    toggleSpeech(button) {
        const type = button.getAttribute('data-type');
        const text = this.getTextToSpeak(type);

        if (this.isSpeaking) {
            this.stopSpeech();
        } else {
            this.startSpeech(text);
            this.createPauseResumeButton(button);
        }
    }

    getTextToSpeak(type) {
        switch (type) {
            case 'description':
                return document.querySelector('.recipe-description').innerText;
            case 'ingredients':
                return Array.from(document.querySelectorAll('.recipe-ingredients li'))
                    .map(li => li.innerText)
                    .join(', ');
            case 'instructions':
                return document.querySelector('.recipe-instructions').innerText;
            default:
                return '';
        }
    }

    startSpeech(text) {
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.onend = () => {
            this.isSpeaking = false;
            this.removePauseResumeButton();
        };
        this.synth.speak(this.currentUtterance);
        this.isSpeaking = true;
    }

    stopSpeech() {
        if (this.isSpeaking) {
            this.synth.cancel();
            this.isSpeaking = false;
            this.removePauseResumeButton();
        }
    }

    createPauseResumeButton(volumeButton) {
        if (!this.pauseResumeButton) {
            this.pauseResumeButton = document.createElement('button');
            this.pauseResumeButton.className = 'btn btn-link ms-2 p-0';
            this.pauseResumeButton.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Icono de pausa
            this.pauseResumeButton.addEventListener('click', () => this.pauseResumeSpeech());

            // Insertar el botón justo después del botón de volumen
            volumeButton.parentNode.insertBefore(this.pauseResumeButton, volumeButton.nextSibling);
        }
    }

    removePauseResumeButton() {
        if (this.pauseResumeButton) {
            this.pauseResumeButton.remove();
            this.pauseResumeButton = null;
        }
    }

    pauseResumeSpeech() {
        if (this.isSpeaking) {
            if (this.synth.speaking  && !this.synth.paused) {
                this.synth.pause();
                this.pauseResumeButton.innerHTML = '<i class="bi bi-play-fill"></i>'; // Cambiar a icono de reanudar
            } else {
                this.synth.resume();
                this.pauseResumeButton.innerHTML = '<i class="bi bi-pause-fill"></i>'; // Cambiar a icono de pausa
            }
        }
    }
}