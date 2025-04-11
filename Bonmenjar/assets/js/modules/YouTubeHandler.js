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

    loadVideo(url, videoFrame) {
        const videoId = this.extractYouTubeId(url);
        if (!videoId) return;
        
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
                    'modestbranding': 1
                },
                events: {
                    'onError': (e) => console.error('YouTube Player Error:', e)
                }
            });
        }
    }

    extractYouTubeId(url) {
        // Handle YouTube short URLs
        if (url.includes('youtu.be/')) {
            return url.split('youtu.be/')[1].split(/[?&]/)[0];
        }
        
        // Handle standard URLs
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        // Additional check for parameters right after ID
        const id = (match && match[2].length === 11) ? match[2] : null;
        console.log('YouTube ID:', id);
        return id ? id.split(/[&?]/)[0] : null; // Truncate at first & or ?
    }

    stopVideo() {
        if (this.player) {
            this.player.stopVideo();
        }
    }
}