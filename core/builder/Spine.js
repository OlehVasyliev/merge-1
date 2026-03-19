const fs = require('fs');
const base64Img = require('base64-img');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

module.exports.load = function() {
	fs.readdir('assets/spine', (err, names) => {
        let files = [];
        for (const title of names) {
            const name = title.slice(0, title.indexOf('.'));
            
            this.isCurrentVersionAsset(name, 'spine') && files.push(title);
        }
        
        if(files.length === 0 || names.length === 0) {
            this.spineLoaded = true;
            this.inlineSpine = false;
            this.loadChunck();
            
            return;
        }
        
        let count = {current: 0, total: names.length / 3};
        for (let i = 0; i < files.length; i++) {
            if(files[i].slice(files[i].length - 3, files[i].length) === 'png') {
                (async () => {
                    await imagemin(['assets/spine/' + files[i]], {
                        destination: 'temp/',
                        plugins: [
                            imageminMozjpeg(),
                            imageminPngquant({
                                quality: [0.6, 0.8]
                            })
                        ]
                    });
                            
                    spineToBase64.bind(this)('temp/' + files[i], files[i], count);
                })();
            } else if(files[i].slice(files[i].length - 4, files[i].length) === 'json') {
                fs.readFile('assets/spine/' + files[i], 'utf8', (err, json) => {
                    this.resources += 'window.App.resources.spine.' + files[i] + ' = ' + "'" + JSON.minify(json) + "'" + ';';
                });
            } else if(files[i].slice(files[i].length - 5, files[i].length) === 'atlas') {
                this.resources += 'window.App.resources.spine.' + files[i].slice(0, -6) + ' = {};';
                fs.readFile('assets/spine/' + files[i], 'utf8', (err, atlas) => {
                    atlas = atlas.replace(new RegExp("\n","g"), "\\n");
                    this.resources += 'window.App.resources.spine.' + files[i] + ' = ' + "'" + atlas + "'" + ';';
                });
            }
        }
    });

    function spineToBase64(path, title, count) {
        base64Img.base64(path, (err, data) => {
            this.resources += 'window.App.resources.spine.' + title + ' = ' + "'" + data + "'" + ';';
                
            count.current++;
                
            if(count.current === count.total) {
                this.spineLoaded = true;
                this.inlineSpine = true;
                this.loadChunck();
            }
        }); 
    }
}