import * as consts from './consts.js';
import * as api    from './api.js';
import * as utils  from './utils.js';

import ml5 from 'https://cdn.jsdelivr.net/npm/ml5@1.2.0/+esm';

export default class App {
    constructor() {
        document.title = consts.app.name;

        this.initialize();
    }

    async initialize(selectors = 'main .container') {
        document.querySelector(selectors).innerHTML = `
            <div class="upload">
                <input type="file" id="file">
                <input type="button" id="load" value="ロード" disabled>
            </div>
            <div class="preview"></div>
            <div class="results">
                <p>物体識別処理に必要なモデルをロード中...</p>
            </div>
        `;

        if(!this.classifier) {
            this.classifier = await new Promise(resolve => {
                ml5.imageClassifier('MobileNet', model => resolve(model));
            });
        }

        this.outputResults('モデルのロードが完了。物体識別を行う画像ファイルを選択してください');

        const button = document.querySelector(`${selectors} .upload #load`);

        button.disabled = false;
        button.onclick = () => this.imageLoad();

        return true;
    }

    outputResults(html = '', selectors = 'main .container .results') {
        if(!document.querySelector(selectors)) return false;

        document.querySelector(selectors).innerHTML = `<p>${html}</p>`;

        return true;
    }

    imageDraw(img_src = '', selectors = 'main .container .preview') {
        if(!document.querySelector(selectors)) return false;

        document.querySelector(selectors).innerHTML = `<canvas></canvas>`;

        const canvas = document.querySelector(`${selectors} canvas`);

        const canvasWidth = 400, canvasHeight = 400;

        canvas.width  = canvasWidth;
        canvas.height = canvasHeight;

        let ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const img = new Image();

        img.onload = () => {
            let imgWidth, imgHeight;

            if(img.width / img.height > canvasWidth / canvasHeight) {
                imgWidth  = canvasWidth;
                imgHeight = Math.floor(img.height * (canvasWidth / img.width));
            } else {
                imgWidth  = Math.floor(img.width * (canvasHeight / img.height));
                imgHeight = canvasHeight;
            }

            canvas.width  = imgWidth;
            canvas.height = imgHeight;

            ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
        };

        img.src = img_src;

        return true;
    }

    imageClassify(img_src = '') {
        const img = new Image();

        img.onload = () => {
            if(!this.classifier) this.classifier = ml5.imageClassifier('MobileNet');

            this.classifier.classify(img, (results, error) => {
                if(error) console.error(error);

                this.outputResults(`結果: ${results[0].label}<br>信頼度: ${results[0].confidence.toFixed(4)}`);
            });
        };

        img.src = img_src;

        return true;
    }

    imageLoad(selectors = 'main .container .upload') {
        if(!document.querySelector(selectors)) return false;

        const inputFile = document.querySelector(`${selectors} #file`);

        const file = inputFile.files[0];

        if(!file) return false;

        if(!file.type.match('image.*')) return false;

        const reader = new FileReader();

        reader.onload = () => {
            this.outputResults('処理中...');

            this.imageDraw    (reader.result);
            this.imageClassify(reader.result);
        };

        reader.readAsDataURL(file);

        return true;
    }
}