# Сборка игры
```
npm i // установка зависимостей
npm run dev // сборка для разработки игры
npm run prod // билд игры под разные рекламные платформы
```
# История изменения кора
## 0.0.5
- Добавлена сеть Liftoff
- Добавлена сеть TikTok
- Добавлена подержка спайн анимаций(пока с багом текстур)
- Пофикшен баг загрузки ассетов(когда к примеру есть всего один шрифт и он используется только в одной версии то билды не будут собиратся)
- Добавлен debug.js
- Пофикшен баг когда маска могла быть только setAlign('Center')
- Добавлены утилитные функции generateID, destroy, animText, changeProperty
- Добавлен мют звуков до первого клика

## 0.0.4
- Добавлена поддержка обеих ориентаций в одном файле
- Добавлена автоматическая сборка разных версий плеебла
- Фикс бага когда после изменения файла не с первого раза загружается игра нужно было перезагружать страницу
- Обновлена кастомная версия фейзера(добавлена рендер текстура и вебджл)
- Фикс бага когда при вводе команды npm run prod не чистилась папка dist
- Обновлен тег adwords
- Фикс сборки Vungle теперь готовый плеебл будет называться ad.html и лежать в папке Vungle
- в класс ParentScene добавлен метод sort

## 0.0.3
- Добавлена геометрическая и битмап маска
- Добавлена функция по правильному определению координат при клике
- Добавлена ParentScene с максимальными значениями размера игры
- Фикс не остановки музыки при сворачивании приложения
- Фикс бага когда иногда не загружаются текстуры
- Новый путь к Game.js
- Добавлен лоадер перед игрой
- Добавлен тег title который автоматически будет брать название из конфига
- Добавлен в .gitignor папка .idea
- Небольшой рефаторинг Preloader.js
- Добавил в readme.md шпаргалку по твинам, туториал по гиту, скил матрицу из coda.io и список для сверки перед отправкой на код ревью

## 0.0.2
- Кастомная версия кора
- Добавлены рекламные сети Applovin, Google, IronSource, UnityAds, Vungle
- Автоматическое сжатие звуков
- Мелкие фиксы и апдейты

## 0.0.1
- Добавлены базовые возможности по билду игры

# Сборка ассетов
- Все ассеты игры должны быть в папке assets/ из этой папки все содержимое будет переведено в base64 при сборке
- Из за ограничений по весу в 2mb мы должны очень сильно следить за ассетами, арт нужно загружать в игру чтобы он не скейлился кодом в меньшую сторону, изображение у которых нету прозрачности должны быть в jpg если только они не в папке sheets а также весь арт будет автоматически сильно сжат
- assets/audio: нужно загружать звуки в формате mp3, они автоматически переделаются в mp4 и oqq после чего переведутся в base64, каждый mp3 файл станет больше весить раза в 2 из за этих манипуляций
- assets/fonts/: шрифт должен быть в формате ttf
- assets/sheets/: здесь должны быть маленькие изображения, все файлы из этой папки будут собраны в один большой атлас с максимальным размером 2048х2048, если будет больше то атлас не соберется и будут предупреждения в консоли
- assets/textures/: тут будут все большие файлы + те которые не поместились в атлас
- temp/: когда ассеты будут собираться автоматически сюда будут попадать копии арта который будет переведен в base64, это нужно чтобы видеть какой атлас собрался, сколько весит + насколько сжались остальные текстуры
- Для сборки звука нужно установить программу https://ffmpeg.org/ после установки нужно ввести команду ffmpeg для теста

# Код
- В папке core ничего менять нельзя если был найден баг то я в ношу этот фикс в основной репозиторий и оттуда уже берется новый кор
- core/builder: код сборки игры
- core/framework: общий код для всех игр, скейл, загрузка и тд.
- core/libs: разные библиотеки, версии фейзера, плагины
- core/networks: api разных рекламных сетей
- core/template: html шаблоны
- src/: тут код игры
- config.js: настройки игры
- dist/: скомпилированные файлы для рекламных сетей
- весь код должен быть в ветке dev после релиза игры код из ветки dev переносится в main, если нужно обновить то создается отдельно ветка от main с названием на подобии hotfix/fix-pointer или же feature/added-pointer

# Особенности
- Вместо обычных координат x и y используем cx и cy или же setCustomPosition
- Для разных ориентаций экрана мы можем использовать разные свойства объекта
- В config.js мы можем добавлять разные версии одного плеебла
- Мы можем выбирать откуда начинаются координаты для каждого объекта, к примеру мы хотим разместить изображение в верхнем правом углу мы пишем this.add.image(0, 0, 'atlas', 'logo').setAlign('Top Rigth') после этого координаты 0, 0 будут в верхнем правом углу, по дефолту у всех изображений координаты 0,0 будут в центральной точке (в примере будет более понятно)
- Текущую версию кора можно посмотреть в консоли рядом с версией phaser
- При тестировании на площадках выключать adblock

# Валидаторы
- Applovin: https://p.applov.in/playablePreview?create=1 (на сайте есть ссылка на скачивание приложения для теста)
- Facebook: https://developers.facebook.com/tools/playable-preview/
- Google Ads: https://h5validator.appspot.com/adwords/asset (нужно нажать на Select for App Campaigns, архив должен быть до 1мб)
- Iron Source: https://demos.ironsrc.com/test-tool/?adUnitLoader=dapi&mode=testing (сверху нужно выбрать dapi, после успешного теста внизу будет ссылка на скачивание приложения на телефон, нужно еще перепроверить на телефоне)
- Liftoff: нету валидатора, api такое же как и в applovin
- Tiktok: https://bytedance.feishu.cn/docs/doccnmdeT1KStyS0QdVExnVAy8v
- UnityAds: у них есть свое приложение для тестирования но оно ужасно, по факту если в applovin все ок то и здесь проблем не будет
- Vungle: нету валидатора, но у них простое api, также как и с UnityAds если в applovin все ок то и здесь проблем не будет

# Туториал по гиту
- В ветке main должен быть только пустой readme который создается автоматически
- От ветки main делаем ветку dev в которой будет вся разработка
- Если обновился кор то пока он не будет переведен в submodule, просто перекидываем новую папку кор себе в проект
- Используйте правильный стиль в гите https://tproger.ru/translations/git-style-guide/ 
- Разрабатывайте проект не локально не должно быть сначала initial commit а потом финальная версия

# Список для проверки перед отправкой на код ревью
- Правильность названия ассетов, все ассеты включая звуки и шрифты должны начинаться с маленькой буквы и использовать _ как разделитель
- Правильность названия переменых и функций, используем camelCase
- В проекте не должно быть window.innerWidth, window.innerHeight, setInterval, setTimeout
- В финальной версии игры не должно быть console.log
- Использовать стиль кода как в статье https://learn.javascript.ru/coding-style
- В консоле не должно быть ошибок или предупреждений
- Не должно быть больших анонимных функций
- Не должно быть лишних ассетов
- Размер игры меньше 2мб (В случае adwords zip архив должен быть до 1мб)
- В конце игры должен быть вызов this.game.network.complete()
- Старайтесь разбивать код на классы, чтоб в Game.js было максимум пару сотен строк

# Скил матрица по развитию
- Примеры на фейзере https://phaser.io/examples
- Новости связаные с фейзером https://phaser.io/news
- Блог с примерами разных механик игр https://www.emanueleferonato.com
- Форум по html5 играм  https://www.html5gamedevs.com/
- Коротко об plyable ads https://vc.ru/marketing/93969-chto-takoe-playable-ads-i-kak-rabotaet-tehnologiya
- Блог рекламной сети https://www.is.com/community/blog/
- Game Dev паттерны программирования https://live13.livejournal.com/462582.html
- Правильный стиль кода  в js https://learn.javascript.ru/coding-style
- Список разных вещей связанных с фейзером https://github.com/Raiper34/awesome-phaser
- Список html5 игр с исходниками https://github.com/leereilly/games
- Шпаргалка по типам твинов https://easings.net/ru

# Билд кастомной версии фейзера
- Скачать репозиторий https://github.com/photonstorm/phaser3-custom-build
- В pakage.json поменять версию на последнюю ```"phaser": "^3.55.2"```
- Установить зависимости ```npm i```
- Заменить файл webpack.config-full.js и phaser-full.js
- Собрать билд с помощью команды ```npm run buildfull```
- Это работает для  версии 3.55.2 для новых версий возможны небольшие изменения
## webpack.config-full.js

```
'use strict';

const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');

module.exports = {

   //   mode: 'development',
   mode: 'production',

   entry: {
       'phaser-full.min': './phaser-full.js'
   },

   resolve: {
       alias: {
           'eventemitter3': path.resolve(__dirname, './node_modules/eventemitter3')
       },
       modules: [ 'node_modules/phaser/src' ]
   },

   output: {
       path: `${__dirname}/dist/`,
       filename: '[name].js',
       library: 'Phaser',
       libraryTarget: 'umd',
       sourceMapFilename: '[file].map',
       devtoolModuleFilenameTemplate: 'webpack:///[resource-path]',
       devtoolFallbackModuleFilenameTemplate: 'webpack:///[resource-path]?[hash]',
       umdNamedDefine: true
   },

   performance: { hints: false },

   optimization: {
       minimizer: [
           new UglifyJSPlugin({
               include: /\.min\.js$/,
               parallel: true,
               sourceMap: false,
               uglifyOptions: {
                   compress: true,
                   ie8: false,
                   ecma: 5,
                   output: {comments: false},
                   warnings: false
               },
               warningsFilter: () => false
           })
       ]
   },

   plugins: [
       new webpack.DefinePlugin({
           "typeof CANVAS_RENDERER": JSON.stringify(true),
           "typeof WEBGL_RENDERER": JSON.stringify(true),
           "typeof EXPERIMENTAL": JSON.stringify(false),
           "typeof PLUGIN_CAMERA3D": JSON.stringify(false),
           "typeof PLUGIN_FBINSTANT": JSON.stringify(false)
       }),

       new CleanWebpackPlugin()
   ],

   devtool: 'source-map'

};
```
## phaser-full.js
```
require('polyfills');

var CONST = require('const');
var Extend = require('utils/object/Extend');

var Phaser = {
    Cache: require('cache'),
    Cameras: {
        Scene2D: require('cameras/2d')
    },
    Events: require('events/index'),
    Game: require('core/Game'),
    GameObjects: {
        DisplayList: require('gameobjects/DisplayList'),
        GameObjectCreator: require('gameobjects/GameObjectCreator'),
        GameObjectFactory: require('gameobjects/GameObjectFactory'),
        UpdateList: require('gameobjects/UpdateList'),
        Components: require('gameobjects/components'),
        BuildGameObject: require('gameobjects/BuildGameObject'),
        BuildGameObjectAnimation: require('gameobjects/BuildGameObjectAnimation'),
        GameObject: require('gameobjects/GameObject'),
        Graphics: require('gameobjects/graphics/Graphics.js'),
        Image: require('gameobjects/image/Image'),
        Sprite: require('gameobjects/sprite/Sprite'),
        Text: require('gameobjects/text/Text'),
        Container: require('gameobjects/container/Container'),
        RenderTexture: require('gameobjects/rendertexture/RenderTexture.js'),
        TileSprite: require('gameobjects/tilesprite/TileSprite'),
        DOMElement: require('gameobjects/domelement/DOMElement'),
        Particles: {
            Particle: require('gameobjects/particles/Particle'),
            ParticleEmitter: require('gameobjects/particles/ParticleEmitter'),
            ParticleEmitterManager: require('gameobjects/particles/ParticleEmitterManager'),
            GravityWell: require('gameobjects/particles/GravityWell'),
        },
        Factories: {
            Graphics: require('gameobjects/graphics/GraphicsFactory'),
            RenderTexture: require('gameobjects/rendertexture/RenderTextureFactory.js'),
            Image: require('gameobjects/image/ImageFactory'),
            Sprite: require('gameobjects/sprite/SpriteFactory'),
            Text: require('gameobjects/text/TextFactory'),
            Container: require('gameobjects/container/ContainerFactory'),
            TileSprite: require('gameobjects/tilesprite/TileSpriteFactory'),
            ParticleEmitterManager: require('gameobjects/particles/ParticleManagerFactory'),
            DOMElement: require('gameobjects/domelement/DOMElementFactory')
        },
        Creators: {
            Graphics: require('gameobjects/graphics/GraphicsCreator'),
            RenderTexture: require('gameobjects/rendertexture/RenderTextureCreator.js'),
            Image: require('gameobjects/image/ImageCreator'),
            Sprite: require('gameobjects/sprite/SpriteCreator'),
            Text: require('gameobjects/text/TextCreator'),
            Container: require('gameobjects/container/ContainerCreator'),
            TileSprite: require('gameobjects/tilesprite/TileSpriteCreator'),
            ParticleEmitterManager: require('gameobjects/particles/ParticleManagerCreator')
        }
    },
    Input: require('input'),
    Loader: require('loader'),
    Renderer: {
        Canvas: require('renderer/canvas'),
    },
    Scale: require('scale'),
    ScaleModes: require('renderer/ScaleModes'),
    Scene: require('scene/Scene'),
    Scenes: require('scene'),
    Time: require('time'),
    Tweens: require('tweens')
};

if (typeof FEATURE_SOUND)
{
    Phaser.Sound = require('sound');
}

Phaser = Extend(false, Phaser, CONST);

module.exports = Phaser;

global.Phaser = Phaser;
```