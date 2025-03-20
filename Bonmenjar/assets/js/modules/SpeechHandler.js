export class SpeechHandler {
    constructor() {
        this.synth = window.speechSynthesis;
    }

    speak(text, lang = 'ca-ES') {
        if (this.synth.speaking) this.synth.cancel(); // Evitar solapamientos
        if (text.trim() === '') return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        this.synth.speak(utterance);
    }

    initializeSpeechButtons(modalElement) {
        modalElement.querySelectorAll('.speech-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                let text = '';

                if (type === 'description') {
                    text = modalElement.querySelector('.recipe-description').innerText;
                } else if (type === 'ingredients') {
                    const ingredients = [...modalElement.querySelectorAll('.recipe-ingredients li')].map(li => li.innerText);
                    text = ingredients.join(', ');
                } else if (type === 'instructions') {
                    const instructions = [...modalElement.querySelectorAll('.recipe-instructions li')].map(li => li.innerText);
                    text = instructions.join('. ');
                }

                this.speak(text);
            });
        });
    }
}
