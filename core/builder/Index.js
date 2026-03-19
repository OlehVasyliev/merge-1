const fs = require('fs');
const zip = require('bestzip');
const open = require('open');

const textures = require('./Textures.js');
const sheets = require('./Sheets.js');
const fonts = require('./Fonts.js');
const audio = require('./Audio.js');
const spine = require('./Spine.js');
const imagemaps = require('./Imagemaps.js');

let config = require('../../config');

class BuilderPlugin {
    constructor(options = {}) {
        this.mode = options.mode;

        this.currentVersion = 0;
        this.isOpenTab = false;
    }

    apply(compiler) {
        compiler.hooks.done.tap('Builder Plugin', (compilation, callback) => {
            this.callback = callback;
            
            this.setDefaultProps();

            if( !fs.existsSync('assets') ) fs.mkdirSync('assets');
            if( !fs.existsSync('dist') ) fs.mkdirSync('dist');
            if( !fs.existsSync('temp') ) fs.mkdirSync('temp');

            if(this.mode === 'production') {
                for (let i = 0; i < Object.keys(config.versions).length; i++) {
                    const path = 'dist/' + Object.keys(config.versions)[i];
                    if( !fs.existsSync(path) ) fs.mkdirSync(path);
                }
            }

            !fs.existsSync('assets/textures') ? fs.mkdir('assets/textures', () => textures.load.bind(this)()) : textures.load.bind(this)();
            !fs.existsSync('assets/sheets') ? fs.mkdir('assets/sheets', () => sheets.load.bind(this)()) : sheets.load.bind(this)();
            !fs.existsSync('assets/fonts') ? fs.mkdir('assets/fonts', () => fonts.load.bind(this)()) : fonts.load.bind(this)();
            !fs.existsSync('assets/audio') ? fs.mkdir('assets/audio', () => audio.load.bind(this)()) : audio.load.bind(this)();
            !fs.existsSync('assets/spine') ? fs.mkdir('assets/spine', () => spine.load.bind(this)()) : spine.load.bind(this)();
            !fs.existsSync('assets/imagemap') ? fs.mkdir('assets/imagemap', () => imagemaps.load.bind(this)()) : imagemaps.load.bind(this)();
        });
    }

    setDefaultProps() {
        this.buildComplete = false;
        this.texturesLoaded = false;
        this.sheetsLoaded = false;
        this.fontsLoaded = false;
        this.audioLoaded = false;
        this.spineLoaded = false;
        this.imagemapsLoaded = false;
        this.inlineSpine = false;

        this.currentNetworkCount = 0;

        this.fonts = '';

        this.resources = `window.App={};window.App.CORE_VERSION;window.App.network='{network}';window.App.version='{version}';`;
        this.resources += `window.App.iosUrl='${config.ios}';window.App.androidUrl='${config.android}';`;
        this.resources += 'window.App.resources={};window.App.resources.textures={};window.App.resources.sheets={};';
        this.resources += 'window.App.resources.audio={};window.App.resources.spine={};window.App.resources.imagemaps={};';
    }

    isCurrentVersionAsset(name, folder) {
        let includes = false;
        let includesCurrentVersion = false;

        const currentVesion = this.mode === 'production' ? Object.keys(config.versions)[this.currentVersion] : config.currentVersion;

        for (const key in config.versions) {
            const folderList = config.versions[key][folder] || [];
            if (folderList.includes(name)) {
                if (currentVesion === key) includesCurrentVersion = true;
                includes = true;
            }
        }

        if (includesCurrentVersion || !includes) return true;

        return false;
    }

    loadChunck() {
        if(!this.audioLoaded || !this.fontsLoaded || !this.sheetsLoaded || !this.texturesLoaded || !this.spineLoaded || !this.imagemapsLoaded || this.buildComplete) return;
        
        this.buildComplete = true;
        this.makeHtml(this.mode === 'development' ? 'dev' : config.networks[0]);
    }

    makeHtml(network) {
        let html = fs.readFileSync(`./core/template/${network === 'IronSource' ? 'dapi' : 'mraid'}.html`, 'utf8');
        const engine = fs.readFileSync(`core/libs/phaser${config.customPhaser ? '-custom' : ''}.min.js`, 'utf8');
        const spine = (this.inlineSpine) ? fs.readFileSync('core/libs/SpinePlugin.min.js', 'utf8') : '';

        html = html.replace('{engine}', engine + spine);
        html = html.replace('{fonts}', this.fonts);
        html = html.replace('{resources}', this.resources);
        html = html.replace('{fonts}', '');
        html = html.replace('{network}', network);
        html = html.replace('{title}', config.name);
        
        (this.mode === 'development') ? this.buildDev(html) : this.buildProd(html, network);
    }

    buildDev(html) {
        html = html.replace('{devCode}', `<script src = './../../main.js'></script>`);
        html = html.replace('{code}', '');
        html = html.replace('{version}', config.currentVersion);

        fs.writeFile('./dist/index.html', html, (err) => {
            if(!this.isOpenTab) {
                open('http://localhost:3080/index.html');
                this.isOpenTab = true;
            }
        });
    }

    buildProd(html, network) {
        const code = fs.readFileSync('dist/main.js', 'utf8');
        html = html.replace('{devCode}', '');
        html = html.replace('{code}', code);

        const folderName = Object.keys(config.versions)[this.currentVersion];
        html = html.replace('{version}', folderName);
        
        const makeNextNetwork = () => {
            if(this.currentNetworkCount !== config.networks.length - 1) {
                this.currentNetworkCount++;
                this.makeHtml(config.networks[this.currentNetworkCount]);
            } else {
                if(this.currentVersion !== Object.keys(config.versions).length - 1) {
                    this.buildNextVersion();
                } else {
                    fs.unlink('dist/main.js', () => {});
                }
            }
        }

        if(network === 'Google') {
            fs.writeFile('dist/' + folderName + '/index.html', html, (err) => {
                zip({
                    source: 'index.html',
                    destination: config.name + '(Adwords).zip',
                    cwd: 'dist/' + folderName + '/'
                }).then(() => {
                    fs.unlink('dist/' + folderName + '/index.html', () => makeNextNetwork());
                });
            });
        } else if(network === 'TikTok') {
            let c = fs.readFileSync('./core/template/config.json', 'utf8');
            fs.writeFileSync('dist/' + folderName + '/config.json', c);
            
            fs.writeFile('dist/' + folderName + '/index.html', html, (err) => {
                zip({
                    source: ['index.html', 'config.json'],
                    destination: config.name + '(TikTok).zip',
                    cwd: 'dist/' + folderName + '/'
                }).then(() => {
                    fs.unlink('dist/' + folderName + '/config.json', () => {});
                    fs.unlink('dist/' + folderName + '/index.html', () => makeNextNetwork());
                });
            });
        } else if(network === 'Vungle') {
            const path = 'dist/' + folderName + '/' + config.name + '(' + network + ')';
            fs.mkdir(path, () => {
                fs.writeFile(path + '/ad.html', html, (err) => makeNextNetwork());
            });
        } else {
            fs.writeFile('dist/' + folderName + '/' + config.name + '(' + network + ')' + '.html', html, (err) => makeNextNetwork());
        }
    }

    buildNextVersion() {
        this.currentVersion++;
        
        this.setDefaultProps();

        textures.load.bind(this)();
        sheets.load.bind(this)();
        fonts.load.bind(this)();
        audio.load.bind(this)();
        spine.load.bind(this)();
    }
}
  
module.exports = BuilderPlugin;