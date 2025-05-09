export class YouTubeHandler {
    constructor() {
        this.player = null;
    }

    loadAPI() {
        return new Promise((resolve) => {
            if (window.YT) {
                resolve();
                return;
            }
    
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
            window.onYouTubeIframeAPIReady = () => {
                resolve();
            };
        });
    }

    async cleanupPlayer() {
        if (this.player) {
            // Detener el video primero
            this.stopVideo();
            // Destruir el player
            this.player.destroy();
            this.player = null;
            
            // Esperar un momento para asegurar la limpieza
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    loadVideo(url, videoFrame) {
        if (!url) {
            videoFrame.innerHTML = "<div class=\"alert alert-info\">El video d'aquesta recepta no està disponible en aquests moments.</div>";
            return;
        }

        const videoId = this.extractYouTubeId(url);
        if (!videoId) {
            console.error('URL de video no válida');
            if (videoFrame) {
                videoFrame.innerHTML = '<div class="alert alert-danger">URL de video no válida</div>';
            }
            return;
        }
        
        if (!window.YT) {
            console.error('YouTube API not loaded yet');
            return;
        }

        if (this.player) {
            this.player.loadVideoById(videoId);
        } else {
            this.player = new YT.Player(videoFrame, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'playsinline': 1,
                    'rel': 0,
                    'modestbranding': 1,
                    'origin': window.location.origin
                },
                events: {
                    'onError': (e) => console.error('YouTube Player Error:', e)
                }
            });
        }
    }

    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    stopVideo() {
        if (this.player && typeof this.player.stopVideo === 'function') {
            this.player.stopVideo();
        }
    }
}