const fs = require('fs');
const path = require('path');
const base64Img = require('base64-img');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

const config = require('../../config');

module.exports.load = function() {
    fs.readdir('assets/textures', (err, names) => {
        let textures = false;

        for (const title of names) {
            const ext = path.extname(title).toLowerCase();
            const isImage = ext === '.png' || ext === '.jpg' || ext === '.jpeg';

            if (isImage) {
                textures = true;
            } else {
                fs.unlinkSync(path.join('assets', 'textures', title));
            }
        }

        let files = [];
        for (const title of names) {
            const name = path.basename(title, path.extname(title));

            // Ignore individual customer frame images (they are now loaded via imagemaps atlases).
            // Some filenames include accidental spaces (e.g. "customer_ 3_0"), so normalize before matching.
            const normalizedName = name.replace(/\s+/g, "");
            if (/^customer_\d+_\d+$/i.test(normalizedName)) continue;

            this.isCurrentVersionAsset(name, 'textures') && files.push(title);
        }

        if(names.length === 0 || files.length === 0 || !textures) {
            this.texturesLoaded = true;
            this.loadChunck();

    	    return;
	    }
            
        let count = {current: 0, total: 0};
        for (let i = 0; i < files.length; i++) {
            if(config.compressTexture) {
                (async () => {
                    await imagemin(['assets/textures/' + files[i]], {
                        destination: 'temp/',
                        plugins: [
                            imageminMozjpeg(),
                            imageminPngquant({
                                quality: [0.5, 0.5]
                            })
                        ]
                    });
                    textureToBase64.bind(this)('temp/' + files[i], files[i], count);
                })();
            } else {
                textureToBase64.bind(this)('assets/textures/' + files[i], files[i], count);
            }

            count.total++;
        }
    });

    function textureToBase64(filePath, title, count) {
        base64Img.base64(filePath, (err, data) => {
            if(data) {
                // Use the filename (without extension) as the texture key.
                const key = path.basename(title, path.extname(title));

                // Normalize the texture key (remove spaces, replace dashes) so it can be accessed consistently.
                const normalizedKey = key.replace(/\s+/g, "").replace(/-/g, "_");

                // Store the base64 data so Phaser can use it as a texture key.
                this.resources += 'window.App.resources.textures.' + normalizedKey + ' = ' + "'" + data + "'" + ';';
            }

            count.current++;
                
            if(count.current === count.total) {
                this.texturesLoaded = true;
                this.loadChunck();
            }
        }); 
    }
}