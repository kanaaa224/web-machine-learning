/*
    (c) 2024 kanaaa224. All rights reserved.
*/

import * as utils from 'https://cdn.jsdelivr.net/gh/kanaaa224/web-common@master/web-app-sources/utils.js';

const { $, create } = utils.dom; utils.dom.extend();

import ml5 from 'https://cdn.jsdelivr.net/npm/ml5@1.2.0/+esm';

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

        if(!this.classifier) this.classifier = await new Promise(resolve => { ml5.imageClassifier('MobileNet', model => resolve(model)); });

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
                    <div>
                        <p style="padding-block: 5rem;">
                            モデルデータのロードが完了<br>
                            物体識別を行う画像ファイルを選択して開始
                        </p>
                    </div>
                </section>
                <section>
                    <button>
                        <span class="mdi mdi-file-outline"></span>
                        <span class="text">ファイル選択</span>
                    </button>
                    <button>開始</button>
                </section>
            </article>
        `);

        $('main button:nth-child(1)').on('click', async e => {
            if(this.loading) return;

            const input = create('input');

            input.type   = 'file';
            input.accept = 'image/*';

            input.onchange = () => {
                this.file = input.files[0];

                $('main button:nth-child(1) span.text').text('ファイル選択済み');
            };

            input.click();
        });

        $('main button:nth-child(2)').on('click', async e => {
            if(this.loading || !this.file) return;

            this.loading = true;

            const url = URL.createObjectURL(this.file);

            await $('main section').setHTMLWithFade(`
                <div>
                    <img src="${url}">
                    <p>読み込み中...</p>
                </div>
            `);

            const img     = $('main img');
            const results = await this.classifier.classify(img);

            await $('main p').html(
                results
                    .map(result => `${result.label}: ${(result.confidence * 100).toFixed(1)}%`)
                    .join('<br>')
            );

            this.loading = false;
        });
    }

}