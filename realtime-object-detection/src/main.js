(async () => {
    const callAPI = async (endpoint = '', queries = {}, requestBody = null) => {
        const url = new URL(endpoint);

        for(const [ key, value ] of Object.entries(queries)) url.searchParams.set(key, value);

        let request = { method: 'GET' };

        if(requestBody) request = { method: 'POST', body: JSON.stringify(requestBody) };

        const response = await fetch(url.toString(), request);
        const body     = await response.json();

        if(!response.ok) throw new Error(`api-bad-status: ${response.status}`);

        return body;
    };

    const getParam = (name = '', url = window.location.href) => {
        return (new URL(url)).searchParams.get(name);
    };

    const isObject = v => v !== null && typeof v === 'object';

    const browserStorageSet = (setData = {}, sKey = window.location.pathname, session = false) => {
        if(!isObject(setData)) return false;

        setData = JSON.stringify(setData);

        session ? sessionStorage.setItem(sKey, setData) : localStorage.setItem(sKey, setData);

        return true;
    };

    const browserStorageGet = (key = '', sKey = window.location.pathname, session = false) => {
        let sData = session ? sessionStorage.getItem(sKey) : localStorage.getItem(sKey);

        if(!sData) return null;

        sData = JSON.parse(sData);

        if(!isObject(sData)) return false;

        if(key) return key in sData ? sData[key] : null;

        return sData;
    };

    class App {
        constructor() {
            document.title = 'リアルタイム 物体検出';

            this.detector = null;

            window.onload = (e) => {
                this.initialize();
            };
        }

        async initialize(selectors = 'main .container') {
            this.ownedSelectors = selectors;

            document.querySelector(this.ownedSelectors).innerHTML = `
                <div class="controls">
                    <input type="button" value="開始" id="button" disabled>
                </div>
                <div class="view" style="position: relative; margin: 0 auto;">
                    <video id="video" style="width: 100%; height: auto; display: none;"></video>
                    <canvas id="canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
                </div>
                <p id="status">モデルをロード中...</p>
            `;

            if(!this.detector) this.detector = await ml5.objectDetection('cocossd');

            this.isDetecting = false;

            this.video  = document.querySelector(`${this.ownedSelectors} .view #video`);
            this.canvas = document.querySelector(`${this.ownedSelectors} .view #canvas`);
            this.ctx    = this.canvas.getContext('2d');

            this.button = document.querySelector(`${this.ownedSelectors} .controls #button`);

            this.button.disabled = false;
            this.button.onclick  = () => this.start();

            this.status = document.querySelector(`${this.ownedSelectors} #status`);

            this.status.innerText = 'モデルのロードが完了しました';

            return true;
        }

        async start() {
            try {
                if(this.button) this.button.disabled = true;

                if(this.status) this.status.innerText = '開始しています...';

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width:  { ideal: 720 },
                        height: { ideal: 480 }
                    }
                });

                this.video.srcObject = stream;

                await new Promise((resolve) => {
                    this.video.onloadedmetadata = () => {
                        this.video.play();

                        resolve();
                    };
                });

                this.canvas.width  = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;

                if(this.status) this.status.innerText = `Width: ${this.video.videoWidth}, Height: ${this.video.videoHeight}`;

                this.video.style.display = 'block';

                this.isDetecting = true;

                this.detect();

                if(this.button) {
                    this.button.value    = '停止';
                    this.button.disabled = false;
                    this.button.onclick  = () => this.stop();
                }
            } catch(e) {
                console.error(e);

                if(this.status) this.status.innerText = 'エラー: カメラを使用できません';
            }

            return true;
        }

        stop() {
            if(this.button) this.button.disabled = true;

            if(this.status) this.status.innerText = '停止しています...';

            this.video.style.display = 'none';

            this.isDetecting = false;

            if(this.video && this.video.srcObject) {
                const tracks = this.video.srcObject.getTracks();

                tracks.forEach(track => track.stop());

                this.video.srcObject = null;
            }

            if(this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if(this.status) this.status.innerText = '停止しました';

            if(this.button) {
                this.button.value    = '再開';
                this.button.disabled = false;
                this.button.onclick  = () => this.start();
            }

            return true;
        }

        async detect() {
            if(!this.isDetecting) return;

            try {
                const results = await this.detector.detect(this.video);

                this.draw(results);

                requestAnimationFrame(() => this.detect());
            } catch(e) {
                console.error(e);
            }
        }

        draw(results) {
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            if(results && results.length > 0) {
                results.forEach((result) => {
                    const { x, y, width, height } = result;

                    const label      =  result.label;
                    const confidence = (result.confidence * 100).toFixed(1);

                    const text = `${label} ${confidence}%`;
                    const textWidth = this.ctx.measureText(text).width;

                    this.ctx.strokeStyle = '#00ff00';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(x, y, width, height);

                    this.ctx.fillStyle = '#00ff00';
                    this.ctx.font = 'bold 16px Arial';
                    this.ctx.fillRect(x, y - 25, textWidth + 10, 25);

                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillText(text, x + 5, y - 7);
                });
            }
        }
    }

    const app = new App();
})();