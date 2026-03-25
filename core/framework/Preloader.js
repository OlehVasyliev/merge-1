export default class Preloader extends Phaser.Scene {
    constructor() {
        super({key: 'Preloader'});
    }

    preload() {
        for (var key in window.App.resources.spine) {
            // SpinePlugin ищет текстуру по имени из .atlas файла (например "B01_Luna.png")
            // Регистрируем и с расширением и без для совместимости
            this.textures.addBase64(key + '.png', window.App.resources.spine[key].png);
            this.textures.addBase64(key, window.App.resources.spine[key].png);
        }
    }
  
    create() {
        this.loaded = 0;
        this.audioLoaded = false;

        this.loadTotal = Object.keys(App.resources.textures).length + Object.keys(App.resources.spine).length;
        window.App.resources.sheets.json && this.loadTotal++;
        window.App.resources.audio.json && this.loadTotal++;
        if (window.App.resources.imagemaps) {
            this.loadTotal += Object.keys(App.resources.imagemaps).length;
        }

        for (let key in App.resources.textures) {
            this.textures.addBase64(key, window.App.resources.textures[key]);
            this.loaded++;
        }

        if (window.App.resources.imagemaps) {
            for (const key in window.App.resources.imagemaps) {
                const map = window.App.resources.imagemaps[key];
                if (!map || !map.png || !map.json) continue;

                const img = new Image();
                img.onload = () => {
                    this.textures.addAtlas(key, img, map.json);
                    this.loaded++;
                    this.startGame();
                };
                img.onerror = () => {
                    this.loaded++;
                    this.startGame();
                };
                img.src = map.png;
            }
        }

        if(window.App.resources.sheets.json) {
            let shardsImg = new Image();
            shardsImg.onload = () => {
                this.textures.addAtlas('atlas', shardsImg, window.App.resources.sheets.json);
                this.loaded++;

                this.startGame();
            };
            shardsImg.src = window.App.resources.sheets.png;
        }

        if(window.App.resources.audio.json) {
            this.cache.json.add('sfx', window.App.resources.audio.json);
            
            let codec = window.App.resources.audio.m4a;
            if(!this.game.device.audio.m4a) codec = window.App.resources.audio.ogg;
            let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioCtx.decodeAudioData(this.base64ToArrayBuffer(codec), (buffer) => {
                if(this.audioLoaded) return;

                this.cache.audio.add('sfx', buffer);
                this.loaded++;

                this.audioLoaded = true;
                
                this.startGame();
            });

            setTimeout(() => {
                if(this.audioLoaded) return;
                this.loaded++;
                
                this.audioLoaded = true;

                this.startGame();
            }, 1000)
        }

        // Ждём загрузки spine текстур перед вызовом getAtlas
        const waitForSpineTextures = () => {
            const spineKeys = Object.keys(App.resources.spine);
            let allReady = true;
            let notReadyKey = null;
            
            for (const key of spineKeys) {
                const textureKey = key + '.png';
                if (!this.textures.exists(textureKey)) {
                    allReady = false;
                    notReadyKey = textureKey + ' (not exists)';
                    break;
                }
                const tex = this.textures.get(textureKey);
                const source = tex.getSourceImage();
                if (!source || !source.complete || source.naturalWidth === 0) {
                    allReady = false;
                    notReadyKey = textureKey + ' (not complete: ' + (source ? source.complete + '/' + source.naturalWidth : 'no source') + ')';
                    break;
                }
            }
            
            console.log('waitForSpineTextures:', allReady, notReadyKey);
            
            if (allReady) {
                // Все текстуры загружены - создаём атласы
                for (var key in App.resources.spine) {
                    // prefix: '' - чтобы SpinePlugin искал текстуру по точному имени "B01_Luna.png"
                    this.cache.custom.spine.add(key, {preMultipliedAlpha: false, prefix: '', data: window.App.resources.spine[key].atlas});
                    this.cache.custom.spineTextures.add(key, this.spine.getAtlas(key));
                    this.cache.json.add(key, window.App.resources.spine[key].json);
                    this.loaded++;
                }
                this.startGame();
            } else {
                // Ещё не все готовы - проверяем снова через 50мс
                this.time.addEvent({delay: 50, callback: waitForSpineTextures, callbackScope: this});
            }
        };
        
        this.time.addEvent({delay: 100, callback: waitForSpineTextures, callbackScope: this});

        this.startGame();
    }

    base64ToArrayBuffer(base64) {
        let binaryString = window.atob(base64);
        let len = binaryString.length;
        let bytes = new Uint8Array( len );

        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes.buffer;
    }

    startGame() {
        if(this.loaded !== this.loadTotal) return;
        
        this.loadTotal = -1;

        this.time.addEvent({delay: 250, callback: () => {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            
            this.scene.start('Game');
        }, callbackScope: this});
    }
}