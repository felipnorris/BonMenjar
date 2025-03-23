export class SpeechHandler {
    constructor() {
        if (!window.speechSynthesis) {
            console.error('[SpeechHandler] Speech synthesis not supported');
            return;
        }

        this.synth = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.isPaused = false;
        this.controlBtn = null;
        this.lastBtn = null;

        // Load voices
        this.loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }

        // Prevent Chrome bug (optional)
        setInterval(() => {
            if (this.synth.speaking) {
                this.synth.pause();
                this.synth.resume();
            }
        }, 14000);

        window.addEventListener('beforeunload', () => {
            if (this.synth.speaking) {
                this.synth.cancel();
            }
        });
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        console.log('[SpeechHandler] Voces disponibles:', this.voices);
    }

    getVoice(lang) {
        return this.voices.find(v => v.lang.toLowerCase().includes(lang.toLowerCase())) || 
               this.voices.find(v => v.lang.toLowerCase().startsWith(lang.split('-')[0].toLowerCase())) ||
               null;
    }

    speak(text, lang = 'ca-ES', modalElement, mainBtn) {
        if (!this.synth || !text || text.trim() === '') return;

        // Si ya está hablando y pulsas el mismo botón => detener
        if (this.synth.speaking && this.lastBtn === mainBtn) {
            console.log('[SpeechHandler] Mismo botón pulsado, deteniendo...');
            this.stopAndReset(mainBtn);
            return;
        }

        // Si otra reproducción en curso, detener
        if (this.synth.speaking) {
            console.log('[SpeechHandler] Otra reproducción en curso. Cancelando...');
            this.stopAndReset(this.lastBtn);
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const selectedVoice = this.getVoice(lang);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('[SpeechHandler] Usando voz:', selectedVoice.name);
        }

        utterance.onstart = () => {
            console.log('[SpeechHandler] Iniciando reproducción');
            this.lastBtn = mainBtn;
            mainBtn.classList.add('speaking');
            mainBtn.innerHTML = '<i class="bi bi-stop-fill fs-5"></i>';
            this.showControlButton(modalElement, mainBtn);
        };

        utterance.onend = () => {
            console.log('[SpeechHandler] Reproducción finalizada');
            this.resetAll(mainBtn);
        };

        utterance.onerror = (event) => {
            if (event.error !== 'interrupted') {
                console.error('[SpeechHandler] Error:', event);
            }
            this.resetAll(mainBtn);
        };

        this.currentUtterance = utterance;
        this.isPaused = false;
        this.synth.speak(utterance);
    }

    stopAndReset(mainBtn) {
        console.log('[SpeechHandler] Deteniendo y reseteando...');
        this.synth.cancel();
        this.resetAll(mainBtn);
    }

    resetAll(mainBtn) {
        // Reset botón principal
        if (mainBtn) {
            mainBtn.innerHTML = '<i class="bi bi-volume-up fs-5"></i>';
            mainBtn.classList.remove('speaking', 'active');
        }

        // Reset todos los botones speech-btn
        document.querySelectorAll('.speech-btn').forEach(btn => {
            btn.innerHTML = '<i class="bi bi-volume-up fs-5"></i>';
            btn.classList.remove('speaking', 'active');
        });

        // Quitar botón pausa/reanudar
        if (this.controlBtn) {
            this.controlBtn.remove();
            this.controlBtn = null;
        }

        // Reset estados internos
        this.currentUtterance = null;
        this.isPaused = false;
        this.lastBtn = null;
        console.log('[SpeechHandler] Estado reiniciado');
    }

    pause() {
        if (this.synth.speaking && !this.isPaused) {
            this.synth.pause();
            this.isPaused = true;
            this.updateControlButton();
            console.log('[SpeechHandler] Reproducción pausada');
        }
    }

    resume() {
        if (this.synth.paused && this.isPaused) {
            this.synth.resume();
            this.isPaused = false;
            this.updateControlButton();
            console.log('[SpeechHandler] Reproducción reanudada');
        }
    }

    showControlButton(modalElement, mainBtn) {
        if (!this.controlBtn) {
            this.controlBtn = document.createElement('button');
            this.controlBtn.className = 'btn btn-outline-primary ms-2';
            this.controlBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
            mainBtn.parentElement.appendChild(this.controlBtn);

            this.controlBtn.addEventListener('click', () => {
                if (!this.isPaused) {
                    this.pause();
                } else {
                    this.resume();
                }
            });
        }
    }

    updateControlButton() {
        if (this.controlBtn) {
            this.controlBtn.innerHTML = this.isPaused ? 
                '<i class="bi bi-play-fill"></i>' : 
                '<i class="bi bi-pause-fill"></i>';
        }
    }

    initializeSpeechButtons(modalElement) {
        if (!modalElement) return;

        modalElement.querySelectorAll('.speech-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                let text = '';

                switch(type) {
                    case 'description':
                        text = modalElement.querySelector('.recipe-description')?.innerText || '';
                        break;
                    case 'ingredients':
                        text = [...modalElement.querySelectorAll('.recipe-ingredients li')]
                            .map(li => li.innerText)
                            .join(', ');
                        break;
                    case 'instructions':
                        text = [...modalElement.querySelectorAll('.recipe-instructions li')]
                            .map(li => li.innerText)
                            .join('. ');
                        break;
                }

                if (text) {
                    this.speak(text, 'ca-ES', modalElement, btn);
                }
            });
        });
    }
}
