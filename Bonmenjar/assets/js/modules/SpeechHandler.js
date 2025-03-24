export class SpeechHandler {
    constructor(modalSelector) {
        this.synth = window.speechSynthesis;
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.modal = document.querySelector(modalSelector);
        this.speechBtns = [];
        this.controlBtn = null;

        this.initModalListener();
    }

    initModalListener() {
        // Detener al cerrar modal
        this.modal.addEventListener('hidden.bs.modal', () => this.stopSpeech());
    }

    initializeSpeechButtons(modal) {
        // Obtener los botones dentro del modal actual (puede haberse recargado el contenido)
        this.speechBtns = modal.querySelectorAll('.speech-btn');

        this.speechBtns.forEach(btn => {
            btn.removeEventListener('click', this.boundToggleSpeech); // limpiar duplicados
        });

        // Necesitamos "bindear" para poder remover el listener luego si es necesario
        this.boundToggleSpeech = (e) => this.toggleSpeech(e);
        this.speechBtns.forEach(btn => {
            btn.addEventListener('click', this.boundToggleSpeech);
        });
    }

    toggleSpeech(e) {
        const btn = e.currentTarget;
        const type = btn.getAttribute('data-type');
        const textElement = this.getTextElement(type);

        if (!textElement) return;

        if (this.isSpeaking) {
            this.stopSpeech();
        } else {
            const text = textElement.textContent.trim();
            if (text) {
                this.startSpeech(text, btn);
            }
        }
    }

    startSpeech(text, triggerBtn) {
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.lang = 'ca-ES';
        this.synth.speak(this.currentUtterance);
        this.isSpeaking = true;

        this.addControlButton(triggerBtn);

        this.currentUtterance.onend = () => {
            this.removeControlButton();
            this.isSpeaking = false;
        };
    }

    stopSpeech() {
        if (this.synth.speaking || this.synth.paused) {
            this.synth.cancel();
        }
        this.removeControlButton();
        this.isSpeaking = false;
    }

    getTextElement(type) {
        switch (type) {
            case 'description':
                return document.querySelector('.recipe-description');
            case 'ingredients':
                return document.querySelector('.recipe-ingredients');
            case 'instructions':
                return document.querySelector('.recipe-instructions');
            default:
                return null;
        }
    }

    addControlButton(triggerBtn) {
        if (this.controlBtn) return;

        this.controlBtn = document.createElement('button');
        this.controlBtn.className = 'btn btn-link ms-2 p-0 pause-resume-btn';
        this.controlBtn.innerHTML = '<i class="bi bi-pause-fill fs-5"></i>';
        triggerBtn.parentNode.insertBefore(this.controlBtn, triggerBtn.nextSibling);

        this.controlBtn.addEventListener('click', () => this.togglePauseResume());
    }

    togglePauseResume() {
        if (this.synth.paused) {
            this.synth.resume();
            this.controlBtn.innerHTML = '<i class="bi bi-pause-fill fs-5"></i>';
        } else if (this.synth.speaking) {
            this.synth.pause();
            this.controlBtn.innerHTML = '<i class="bi bi-play-fill fs-5"></i>';
        }
    }

    removeControlButton() {
        if (this.controlBtn) {
            this.controlBtn.remove();
            this.controlBtn = null;
        }
    }
}
