/*
    (c) 2024 kanaaa224. All rights reserved.
*/

import * as utils from 'https://cdn.jsdelivr.net/gh/kanaaa224/web-common@master/web-app-sources/utils.js';

const { $, create } = utils.dom; utils.dom.extend();

import ml5 from 'https://cdn.jsdelivr.net/npm/ml5@1.3.1/+esm';

export default class App {

    constructor() {
        this.initialize();
    }

    async initialize() {
        let manifest = $('link[rel="manifest"]');

        const response = await fetch(manifest.href);
        const data     = await response.json();

        manifest = data;

        const link = create('link');

        link.rel  = 'icon';
        link.href = new URL(manifest.icons[0].src, response.url).href;

        document.head.appendChild(link);

        const title = document.title = manifest.name;

        await $('body').setHTMLWithFade(`
            <main></main>
            <header>
                <h1>${title}</h1>
                <div>
                    <p>
                        <a href="https://github.com/kanaaa224/web-machine-learning" target="_blank">
                            <span class="mdi mdi-github"></span>
                        </a>
                    </p>
                </div>
            </header>
            <footer>
                <p>© 2024 <a href="https://kanaaa224.github.io" target="_blank">kanaaa224</a>. All rights reserved.</p>
            </footer>
        `);

        await this.mainLoading();

        if(!this.detector) this.detector = await ml5.objectDetection('cocossd');

        await this.mainReady();
    }

    async mainLoading() {
        await $('main').setHTMLWithFade(`
            <article>
                <section>
                    <p>モデルデータをロード中...</p>
                </section>
            </article>
        `);
    }

    async mainReady() {
        await $('main').setHTMLWithFade(`
            <article>
                <section>
                    <p>モデルデータのロード完了</p>
                    <button>開始</button>
                </section>
            </article>
        `);

        $('main button').on('click', async e => {
            await this.mainStart(); this.start();
        });
    }

    async mainStart() {
        await $('main').setHTMLWithFade(`
            <article>
                <section>
                    <div>
                        <video></video>
                        <canvas></canvas>
                    </div>
                </section>
                <section>
                    <p>開始しています...</p>
                    <button>停止</button>
                </section>
            </article>
        `);

        $('main button').on('click', e => {
            this.isDetecting ? this.stop() : this.start();
        });
    }

    async start() {
        const main   = $('main');
        const video  = $('video',  main);
        const canvas = $('canvas', main);
        const p      = $('p',      main);
        const button = $('button', main);

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width:  { ideal: 720 },
                height: { ideal: 480 }
            }
        });

        video.srcObject = stream;

        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play(); resolve();
            };
        });

        const width  = video.videoWidth;
        const height = video.videoHeight;

        canvas.width  = width;
        canvas.height = height;

        this.isDetecting = true;

        p     .text(`${width} x ${height}`);
        button.text('停止');

        this.detect();
    }

    stop() {
        const main   = $('main');
        const video  = $('video',  main);
        const button = $('button', main);

        if(video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }

        this.isDetecting = false;

        button.text('再開');
    }

    async detect() {
        const main  = $('main');
        const video = $('video', main);

        if(!this.isDetecting) return;

        try {
            const results = await this.detector.detect(video);

            this.draw(results);

            requestAnimationFrame(() => this.detect());
        } catch(e) {
            console.error(e);
        }
    }

    draw(results) {
        const main   = $('main');
        const video  = $('video',  main);
        const canvas = $('canvas', main);
        const ctx    = canvas.getContext('2d');

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        for(const result of results) {
            const { x, y, width, height } = result;

            const label      = result.label;
            const confidence = (result.confidence * 100).toFixed(1);
            const text       = `${label} ${confidence}%`;
            const textWidth  = ctx.measureText(text).width;

            ctx.strokeStyle = '#0f0';
            ctx.lineWidth   = 3;
            ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = '#0f0';
            ctx.font      = 'bold 16px Arial';
            ctx.fillRect(x, y - 25, textWidth + 10, 25);
            ctx.fillStyle = '#000';
            ctx.fillText(text, x + 5, y - 7);
        }
    }

}