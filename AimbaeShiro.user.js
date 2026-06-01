// ==UserScript==
// @name             AimbaeShiro – Krunker.IO Cheat
// @name:tr          AimbaeShiro – Krunker.IO Hilesi
// @name:ja          AimbaeShiro – Krunker.IO チート
// @name:az          AimbaeShiro – Krunker.IO Hilesi
// @namespace        https://github.com/GameSketchers/AimbaeShiro
// @version          1.6.6
// @description      Krunker.io Cheat 2025: Anime Aimbot, ESP/Wallhack, Free Skins, Bhop Script. Working & updated mod menu.
// @description:tr   Krunker.io Hile 2025: Anime Aimbot, ESP/Wallhack, Bedava Skinler, Bhop Script. Çalışan güncel mod menü.
// @description:ja   Krunker.io チート 2025: アニメエイムボット、ESP/ウォールハック、無料スキン、Bhopスクリプト。動作中の最新MODメニュー。
// @description:az   Krunker.io Hilesi 2025: Anime Aimbot, ESP/Wallhack, Pulsuz Skinlər, Bhop Skript. İşlək ve güncəl mod menyu.
// @author           anonimbiri
// @match            *://krunker.io/*
// @match            *://*.browserfps.com/*
// @exclude          *://krunker.io/social*
// @exclude          *://krunker.io/editor*
// @exclude          *://krunker.io/viewer*
// @icon             https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png
// @grant            none
// @supportURL       https://github.com/GameSketchers/AimbaeShiro/issues/new?labels=bug&type=bug&template=bug_report.md&title=Bug+Report
// @homepage         https://github.com/GameSketchers/AimbaeShiro
// @run-at           document-start
// @tag              games
// @license          MIT
// @noframes
// ==/UserScript==

(function(uniqueId, CRC2d) {

    class AimbaeShiro {
        constructor() {
            console.log("🌸 AimbaeShiro: Initializing...");

            this.GUI = {};
            this.game = null;
            this.me = null;
            this.renderer = null;
            this.controls = null;
            this.overlay = null;
            this.ctx = null;
            this.socket = null;
            this.skinCache = {};
            this.playerMaps = [];
            this.scale = 1;
            this.three = null;
            this.vars = {};
            this.exports = null;
            this.gameVersion = '';
            this.gameJS = '';
            this.weaponIconCache = {};
            this.notifyContainer = null;
            this.legitTarget = null;
            this.lastTargetChangeTime = 0;
            this.aimOffset = { x: 0, y: 0 };

            this.lastWireframeState = null;

            this.PLAYER_HEIGHT = 11;
            this.PLAYER_WIDTH = 4;
            this.CROUCH_FACTOR = 3;
            this.BOT_CROUCH_FACTOR = 2;
            this.CAMERA_HEIGHT = 1.5;

            this.tempVector = null;
            this.cameraPos = null;

            this.isProxy = Symbol('isProxy');
            this.rightMouseDown = false;
            this.isBindingHotkey = false;
            this.currentBindingSetting = null;
            this.pressedKeys = new Set();

            this.espPreviewCanvas = null;
            this.espPreviewCtx = null;
            this.espCharImg = null;
            this.espCharLoaded = false;
            this.espWeaponImg = null;
            this.espWeaponLoaded = false;

            this.defaultSettings = {
                aimbotEnabled: true,
                aimbotOnRightMouse: false,
                aimbotWallCheck: true,
                aimbotWallBangs: false,
                aimbotTeamCheck: true,
                aimbotBotCheck: true,
                superSilentEnabled: false,
                autoFireEnabled: false,
                fovSize: 90,
                aimOffset: 0,
                drawFovCircle: true,
                espLines: true,
                espSquare: true,
                espNameTags: true,
                espWeaponIcons: true,
                espInfoBackground: true,
                espTeamCheck: true,
                espBotCheck: true,
                wireframeEnabled: false,
                unlockSkins: true,
                bhopEnabled: false,
                antiAimEnabled: false,
                espColor: "#ff0080",
                boxColor: "#ff0080",
                botColor: "#00ff80",
                autoNuke: false,
                antikick: true,
                autoReload: true,
                legitAimbot: true,
                flickSpeed: 25,
                adsTremorReduction: 50,
                aimRandomness: 1.5,
                aimTremor: 0.2,
                thirdPersonEnabled: false,
                alwaysTrail: false,
                weaponZoom: 1.0,
            };
            this.defaultHotkeys = {
                toggleMenu: 'F1',
                aimbotEnabled: 'F2',
                espSquare: 'F3',
                bhopEnabled: 'F4',
                autoFireEnabled: 'F5',
                superSilentEnabled: 'F6',
                antiAimEnabled: 'F7',
                wireframeEnabled: 'F8',
                unlockSkins: 'F9',
                aimbotTeamCheck: 'Numpad1',
                espTeamCheck: 'Numpad2',
                aimbotBotCheck: 'Numpad3',
                espBotCheck: 'Numpad4',
                aimbotWallCheck: 'Numpad5',
                aimbotWallBangs: 'Numpad6',
                espLines: 'Numpad7',
                espNameTags: 'Numpad8',
                espWeaponIcons: 'Numpad9',
            };
            this.settings = {};
            this.hotkeys = {};

            try {
                this.loadSettings();
                this.initializeNotifierContainer();
                this.checkForUpdates();
                this.initializeLoader();
                this.initializeGameHooks();
                this.waitFor(() => window.windows).then(() => {
                    this.initGameGUI();
                });
                this.addEventListeners();
                this.preloadESPAssets();
                console.log("🌸 AimbaeShiro: Successfully Initialized!");
            } catch (error) {
                console.error('🌸 AimbaeShiro: FATAL ERROR during initialization.', error);
            }
        }

        loadSettings() {
            let loadedSettings = {}, loadedHotkeys = {};
            try {
                loadedSettings = JSON.parse(window.localStorage.getItem('aimbaeshiro_settings'));
                loadedHotkeys = JSON.parse(window.localStorage.getItem('aimbaeshiro_hotkeys'));
            } catch (e) {
                console.warn("🌸 AimbaeShiro: Could not parse settings, using defaults.");
            }
            this.settings = { ...this.defaultSettings, ...loadedSettings };
            this.hotkeys = { ...this.defaultHotkeys, ...loadedHotkeys };
        }

        saveSettings(key, value) {
            try {
                window.localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error("🌸 AimbaeShiro: Could not save settings.", e);
            }
        }

        preloadESPAssets() {
            this.espCharImg = new Image();
            this.espCharImg.crossOrigin = 'anonymous';
            this.espCharImg.onload = () => { this.espCharLoaded = true; if (this.espPreviewCtx) this.renderESPPreview(); };
            this.espCharImg.src = 'https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/character-preview.png';
            this.espWeaponImg = new Image();
            this.espWeaponImg.crossOrigin = 'anonymous';
            this.espWeaponImg.onload = () => { this.espWeaponLoaded = true; if (this.espPreviewCtx) this.renderESPPreview(); };
            this.espWeaponImg.src = 'https://assets.krunker.io/textures/weapons/icon_1.png';
        }

        renderESPPreview() {
            const c = this.espPreviewCanvas; if (!c) return;
            const ctx = this.espPreviewCtx; if (!ctx) return;
            const w = c.width, h = c.height;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#0d0815'; ctx.fillRect(0, 0, w, h);

            ctx.strokeStyle = 'rgba(232,67,147,0.04)'; ctx.lineWidth = 1;
            for (let i = 0; i < w; i += 25) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
            for (let i = 0; i < h; i += 25) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

            const cx = w / 2;
            let charTop = 55, charH = 310, charW = 110;
            if (this.espCharLoaded && this.espCharImg) {
                const ratio = this.espCharImg.width / this.espCharImg.height;
                charW = charH * ratio; if (charW > w - 16) { charW = w - 16; charH = charW / ratio; }
                const charX = cx - charW / 2; charTop = (h - charH) / 2 - 10;
                ctx.globalAlpha = 0.9; ctx.drawImage(this.espCharImg, charX, charTop, charW, charH); ctx.globalAlpha = 1.0;
            }

            const boxPad = 10;
            const bx = cx - charW / 2 - boxPad, by = charTop - boxPad, bw = charW + boxPad * 2, bh = charH + boxPad * 2;

            if (this.settings.espLines) {
                const hr = (hex, a) => { let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `rgba(${r},${g},${b},${a})`; };
                const grad = ctx.createLinearGradient(w / 2, h, cx, by + bh);
                grad.addColorStop(0, hr(this.settings.espColor, 0.9)); grad.addColorStop(1, hr(this.settings.espColor, 0.1));
                ctx.strokeStyle = grad; ctx.lineWidth = 2.5; ctx.shadowColor = this.settings.espColor; ctx.shadowBlur = 15;
                ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.lineTo(cx, by + bh); ctx.stroke(); ctx.shadowBlur = 0;
            }

            if (this.settings.espSquare) {
                ctx.strokeStyle = this.settings.boxColor; ctx.lineWidth = 2; ctx.shadowColor = this.settings.boxColor; ctx.shadowBlur = 10;
                ctx.strokeRect(bx, by, bw, bh); ctx.shadowBlur = 0;
            }

            const hpPct = 0.72; const barX = bx - 9, barW = 5;
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(barX, by, barW, bh);
            ctx.fillStyle = '#FDD835'; ctx.fillRect(barX, by + bh * (1 - hpPct), barW, bh * hpPct);
            ctx.font = 'bold 12px Rajdhani,sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
            ctx.shadowColor = '#000'; ctx.shadowBlur = 3; ctx.fillText('♥ 72', barX - 3, by + 13); ctx.shadowBlur = 0;

            if (this.settings.espNameTags) {
                const nameText = 'Player_01';
                const wpnText = this.settings.espWeaponIcons ? ' • AK-47' : '';
                const fullText = nameText + wpnText;
                ctx.font = 'bold 13px Rajdhani,sans-serif'; ctx.textAlign = 'left';
                const tw = ctx.measureText(fullText).width;
                let iconW = 0, iconH = 18;
                if (this.settings.espWeaponIcons && this.espWeaponLoaded && this.espWeaponImg) {
                    iconW = this.espWeaponImg.width * (iconH / this.espWeaponImg.height);
                }
                const tagW = tw + (iconW > 0 ? iconW + 6 : 0) + 16, tagH = 26;
                const tagX = cx - tagW / 2, tagY = by - tagH - 8;
                if (this.settings.espInfoBackground) {
                    ctx.fillStyle = 'rgba(25,10,30,0.7)'; ctx.strokeStyle = this.settings.boxColor; ctx.lineWidth = 1;
                    ctx.shadowColor = this.settings.boxColor; ctx.shadowBlur = 8;
                    ctx.beginPath(); ctx.roundRect(tagX, tagY, tagW, tagH, 4); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
                }
                ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(232,67,147,0.5)'; ctx.shadowBlur = 4;
                ctx.fillText(fullText, tagX + 8, tagY + 18); ctx.shadowBlur = 0;
                if (iconW > 0) {
                    const iconX = tagX + 8 + tw + 6; const iconY = tagY + (tagH - iconH) / 2;
                    ctx.drawImage(this.espWeaponImg, iconX, iconY, iconW, iconH);
                }
            }

            ctx.font = 'bold 12px Rajdhani,sans-serif'; ctx.textAlign = 'center';
            ctx.fillStyle = '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
            ctx.fillText('[24m]', cx, by + bh + 18); ctx.shadowBlur = 0;
        }

        async checkForUpdates() {
            const current = GM_info.script.version || '0.0.0';

            const getLatestFromGitHub = async () => {
                try {
                    const res = await fetch('https://api.github.com/repos/GameSketchers/AimbaeShiro/releases/latest', { cache: 'no-store' });
                    if (!res.ok) throw new Error('GitHub latest failed');
                    const json = await res.json();
                    const latestTag = (json && (json.tag_name || json.name)) ? (json.tag_name || '').toString().trim() : '';
                    const assetUrl = (json.assets && json.assets[0] && json.assets[0].browser_download_url) ? json.assets[0].browser_download_url : null;
                    const version = latestTag.replace(/^v/i, '').trim();
                    return { version, downloadUrl: assetUrl, source: 'github' };
                } catch (e) { return null; }
            };

            const getLatestFromGreasyFork = async () => {
                try {
                    const res = await fetch('https://api.greasyfork.org/en/scripts/538607.json', { cache: 'no-store' });
                    if (!res.ok) throw new Error('GF latest failed');
                    const json = await res.json();
                    const version = (json && json.version) ? json.version : null;
                    const code_url = (json && json.code_url) ? json.code_url : null;
                    return { version, downloadUrl: code_url, source: 'greasyfork' };
                } catch (e) { return null; }
            };

            const latestGh = await getLatestFromGitHub();
            const latest = latestGh || await getLatestFromGreasyFork();
            if (!latest || !latest.version) return;

            const cmp = this.compareVersionStrings(current, latest.version);
            if (cmp < 0) {
                const url = latest.downloadUrl || 'https://greasyfork.org/en/scripts/538607-aimbaeshiro-krunker-io-cheat';
                this.notify({
                    title: 'New version available',
                    message: `Current: ${current} → Latest: ${latest.version}`,
                    actionText: 'Update',
                    onAction: () => { try { window.open(url, '_blank', 'noopener'); } catch (e) { location.href = url; } },
                    timeout: 0
                });
            }
        }

        compareVersionStrings(a, b) {
            const na = String(a || '').replace(/^v/i, '').split('.').map(x => parseInt(x, 10) || 0);
            const nb = String(b || '').replace(/^v/i, '').split('.').map(x => parseInt(x, 10) || 0);
            const len = Math.max(na.length, nb.length);
            for (let i = 0; i < len; i++) { const da = na[i] || 0, db = nb[i] || 0; if (da > db) return 1; if (da < db) return -1; }
            return 0;
        }

        initializeNotifierContainer() {
            let container = document.getElementById('anonimbiri-notify-wrap');
            if (!container) { container = document.createElement('div'); container.id = 'anonimbiri-notify-wrap'; document.documentElement.appendChild(container); }
            this.notifyContainer = container;
        }

        notify({ title = 'Notification', message = '', actionText, onAction, timeout = 6000 } = {}) {
            if (!this.notifyContainer) { console.error("🌸 AimbaeShiro: Notifier container not initialized."); return; }
            const card = document.createElement('div'); card.className = 'anonimbiri-notify-card';
            setTimeout(() => card.classList.add('visible'), 10);
            const content = document.createElement('div'); content.className = 'anonimbiri-notify-content';
            const logo = document.createElement('div'); logo.className = 'anonimbiri-notify-logo';
            const texts = document.createElement('div'); texts.className = 'anonimbiri-notify-texts';
            const titleEl = document.createElement('label'); titleEl.className = 'anonimbiri-notify-title'; titleEl.textContent = title;
            const messageEl = document.createElement('div'); messageEl.className = 'anonimbiri-notify-message'; messageEl.textContent = message;
            texts.append(titleEl, messageEl); content.append(logo, texts);
            const controls = document.createElement('div'); controls.className = 'anonimbiri-notify-controls';
            if (actionText && typeof onAction === 'function') {
                const btn = document.createElement('div'); btn.className = 'anonimbiri-notify-action-btn'; btn.textContent = actionText;
                btn.addEventListener('click', (e) => { e.stopPropagation(); onAction(); dismiss(); }); controls.appendChild(btn);
            }
            card.append(content, controls); this.notifyContainer.appendChild(card);
            let hideTimer; if (timeout > 0) hideTimer = setTimeout(dismiss, timeout);
            function dismiss() { clearTimeout(hideTimer); card.classList.remove('visible'); setTimeout(() => card.remove(), 350); }
            return { dismiss };
        }

        initializeLoader() {
            let tokenPromiseResolve;
            const tokenPromise = new Promise((resolve) => (tokenPromiseResolve = resolve));
            const ifr = document.createElement('iframe');
            ifr.src = location.origin + '/' + (window.location.search ? window.location.search : '');
            ifr.style.display = 'none';
            document.documentElement.append(ifr);
            ifr.contentWindow.fetch=new Proxy(ifr.contentWindow.fetch,{apply(t,a,[u,...r]){if(typeof u==="string"&&u.includes("/seek-game")){ifr.remove();tokenPromiseResolve(u);return;}return Reflect.apply(t,a,[u,...r]);}});
            window.fetch=new Proxy(window.fetch,{apply:async(t,a,[u,...r])=>{if(typeof u==="string"&&u.includes("/seek-game"))u=await tokenPromise;return Reflect.apply(t,a,[u,...r]);}});
            function downloadFileSync(url) { var req = new XMLHttpRequest(); req.open('GET', url, false); req.send(); if (req.status === 200) { return req.response; } return null; }
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.tagName === 'SCRIPT' && node.src && node.src.includes('/static/index-')) {
                            node.remove(); observer.disconnect();
                            this.gameJS = downloadFileSync(`https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@${GM_info.script.version}/GameSource/game.js`);
                            const patchedScript = this.patchGameScript(this.gameJS);
                            this.gameVersion = /let\s+[^\s=]+\s*=\s*['"]([0-9]+\.[0-9]+\.[0-9]+)['"]\s*;\s*let\s+[^\s=]+\s*=\s*[^\s=]+\s*\+\s*['"][^'"]+['"]\s*;\s*let\s+[^\s=]+\s*=\s*process\.env\.CUSTOM_VERSION/s.exec(this.gameJS)[1];
                            window.addEventListener('load', () => { Function(patchedScript)(); });
                            return;
                        }
                    }
                }
            });
            observer.observe(document, { childList: true, subtree: true });
        }

        patchGameScript(script) {
            const entries = {
                isYou: { regex: /(?:this\.\w+\s*=\s*true;)\s*this\.(\w+)\s*=\s*[^;]+;(?:\s*this\.\w+\s*=\s*[^;]+;){5}\s*this\.\w+\s*=\s*null;/s, index: 1 },
                pchObjc: { regex: /this\.([^\s=]+)\s*=\s*new\s+[^\s]+\.Object3D\(\)/u, index: 1 },
                inView: { regex: /([^\s=.]+)\.([^\s=]+)\s*=\s*\([^;]+;\s*if\s*\(\1\.latestData\)/s, index: 2 },
                procInputs: { regex: /for\s*\(\s*var\s+[^\s=]+\s*=\s*0;\s*[^\s<]+\s*<\s*this\.[^;]+;\s*\+\+[^\s)]+\s*\)\s*{\s*this\.([^\s(]+)\([^)]+\);\s*}\s*this\.[^\s(]+\(\);/s, index: 1 },
                weaponIndex: { regex: /}\s*else\s*{\s*this\.[^\s=\[]+\[this\.([^\s=\]]+)\]\s*=\s*[^;]+;\s*}\s*[^.\s]+\.updatePlayerAmmo\(this\);/s, index: 1 },
                //gameVersion: { regex: /(let\s+[^\s=]+\s*=\s*)['"][0-9]+\.[0-9]+\.[0-9]+['"](\s*;\s*let\s+[^\s=]+\s*=\s*[^\s=]+\s*\+\s*['"][^'"]+['"]\s*;\s*let\s+[^\s=]+\s*=\s*process\.env\.CUSTOM_VERSION)/s, patch: `$1"9.2.3"$2` },
                fixHowler: { regex: /Howler\.orientation\([^;]+\);/g, patch: "/* Howler Orientation Removed By Anonimbiri */" },
                respawnT: { regex: /(:\s*)\(parseFloat\([^)]+\)\s*\|\|\s*0\)\s*\*\s*1000/g, patch: `$10` },
                anticheat1: { regex: /if\s*\(\s*window\.utilities\s*\)\s*\{[\s\S]*?\}/, patch: '/* Anticheat Removed By Anonimbiri */' },
                commandline: { regex: /Object\.defineProperty\(console,\s*['_"]_commandLineAPI['_"][\s\S]*?}\);?/g, patch: "/* Antidebug removed by anonimbiri */" },
                writeable:{regex: /writeable:\sfalse,/g, patch: 'writeable: true,'},
                configurable:{regex: /configurable:\sfalse,/g, patch: 'configurable: true,'},
                typeError: {regex: /throw new TypeError/g, patch: "console.error"},
                error: { regex: /throw new Error/g, patch: "console.error" },
            };
            for (const name in entries) {
                const object = entries[name]; const found = object.regex.exec(script);
                if (object.hasOwnProperty('index')) {
                    if (!found) { console.warn(`🌸 AimbaeShiro: Failed to Find '${name}'`); this.vars[name] = null; }
                    else { this.vars[name] = found[object.index]; console.log(`🌸 AimbaeShiro: Found '${name}': ${this.vars[name]}`); }
                } else if (found) { script = script.replace(object.regex, object.patch); console.log(`🌸 AimbaeShiro: Patched '${name}'`); }
                else { console.warn(`🌸 AimbaeShiro: Failed to Patch '${name}'`); }
            }
            return script;
        }

        initializeGameHooks() {
            const cheatInstance = this;
            const originalSkinsSymbol = Symbol('origSkins');
            const localSkinsSymbol = Symbol('localSkins');

            Object.defineProperties(Object.prototype, {
                canvas: {
                    set(canvasValue) {
                        this['_canvas'] = canvasValue;
                        if (canvasValue && canvasValue.id === 'game-overlay') {
                            cheatInstance.overlay = this; cheatInstance.ctx = canvasValue.getContext('2d');
                            Object.defineProperty(this, 'render', {
                                set(originalRender) {
                                    this['_render'] = new Proxy(originalRender, {
                                        apply(target, thisArg, args) {
                                            ['scale', 'game', 'controls', 'renderer', 'me'].forEach((prop, i) => { cheatInstance[prop] = args[i]; });
                                            Reflect.apply(...arguments);
                                            if (cheatInstance.me && cheatInstance.ctx) { cheatInstance.onRenderFrame(); }
                                        },
                                    });
                                },
                                get() { return this['_render']; },
                            });
                        }
                    },
                    get() { return this['_canvas']; },
                },
                THREE: {
                    configurable: true,
                    set(value) {
                        if(cheatInstance.three == null){
                            console.log("🌸 AimbaeShiro: THREE object captured!");
                            cheatInstance.three = value;
                            cheatInstance.tempVector = new value.Vector3();
                            cheatInstance.cameraPos = new value.Vector3();
                            cheatInstance.rayC = new value.Raycaster();
                            cheatInstance.vec2 = new value.Vector2(0, 0);
                        }
                        this['_value'] = value;
                    },
                    get() { return this['_value']; },
                },
                skins: {
                    set(skinsArray) {
                        this[originalSkinsSymbol] = skinsArray;
                        if (!this[localSkinsSymbol]) { this[localSkinsSymbol] = Array.apply(null, Array(25000)).map((_, i) => { return { ind: i, cnt: 1, }}); }
                        return skinsArray;
                    },
                    get() { return cheatInstance.settings.unlockSkins && this.stats ? this[localSkinsSymbol] : this[originalSkinsSymbol]; },
                },
                events: {
                    configurable: true,
                    set(eventEmitter) {
                        this['_events'] = eventEmitter;
                        console.log(this);
                        if (this.ahNum === 0) {
                            cheatInstance.socket = this; cheatInstance.wsEvent = this._dispatchEvent.bind(this); cheatInstance.wsSend = this.send.bind(this);
                            this.send = new Proxy(this.send, {
                                apply(target, thisArg, [type, ...message]) {
                                    if (type=="ah2") return; let data = message[0];
                                    if (type === 'en' && data) { cheatInstance.skinCache = { main: data[2][0], secondary: data[2][1], hat: data[3], body: data[4], knife: data[9], dye: data[14], waist: data[17], playerCard: data[32] }; }
                                    if(cheatInstance.settings.unlockSkins && type === 'spry' && data && data !== 4577){ cheatInstance.skinCache.spray = data; message[0] = 4577; }
                                    return target.apply(thisArg, [type, ...message]);
                                }
                            });
                            this._dispatchEvent = new Proxy(this._dispatchEvent, {
                                apply(target, thisArg, [eventName, ...eventData]) {
                                    if (eventName === 'error' && eventData[0][0].includes('Connection Banned')) {
                                        localStorage.removeItem('krunker_token');
                                        cheatInstance.notify({ title: 'Banned', message: 'Due to a ban, you have been signed out.\nPlease connect to the game with a VPN.', timeout: 5000 });
                                    }
                                    if (cheatInstance.settings.unlockSkins && eventName === '0') {
                                        let playerData = eventData[0][0]; let playerStride = 38;
                                        while (playerData.length % playerStride !== 0) playerStride++;
                                        for (let i = 0; i < playerData.length; i += playerStride) {
                                            if (playerData[i] === cheatInstance.socket.socketId || 0) {
                                                playerData[i + 12] = [cheatInstance.skinCache.main, cheatInstance.skinCache.secondary];
                                                playerData[i + 13] = cheatInstance.skinCache.hat; playerData[i + 14] = cheatInstance.skinCache.body;
                                                playerData[i + 19] = cheatInstance.skinCache.knife; playerData[i + 24] = cheatInstance.skinCache.dye;
                                                playerData[i + 33] = cheatInstance.skinCache.waist; playerData[i + 43] = cheatInstance.skinCache.playerCard;
                                            }
                                        }
                                    }
                                    if (cheatInstance.settings.unlockSkins && eventName === 'sp') { eventData[0][1] = cheatInstance.skinCache.spray; }
                                    return target.apply(thisArg, [eventName, ...eventData]);
                                }
                            });
                        }
                    },
                    get() { return this['_events']; },
                },
                premiumT: { set(value) { return value; }, get() { return cheatInstance.settings.unlockSkins; } },
                idleTimer: { enumerable: false, get() { return cheatInstance.settings.antikick ? 0 : this['_idleTimer']; }, set(value) { this['_idleTimer'] = value; }, },
                kickTimer: { enumerable: false, get() { return cheatInstance.settings.antikick ? Infinity : this['_kickTimer']; }, set(value) { this['_kickTimer'] = value; }, },
                cnBSeen: {
                    set(value) { this.inView = value; },
                    get() { const isEnemy = !this.team || (cheatInstance.me && this.team !== cheatInstance.me.team); return isEnemy && (cheatInstance.settings.espSquare || cheatInstance.settings.espNameTags) ? false : this.inView; },
                },
                canBSeen: {
                    set(value) { this.inViewBot = value; },
                    get() { const isEnemy = !this.team || (cheatInstance.me && this.team !== cheatInstance.me.team); return isEnemy && (cheatInstance.settings.espSquare || cheatInstance.settings.espNameTags) ? false : this.inViewBot; },
                },
                thirdPerson: {
                    set(value) { this['_thirdPerson'] = value; },
                    get() { return cheatInstance.settings.thirdPersonEnabled ? true : (this['_thirdPerson'] !== undefined ? this['_thirdPerson'] : false); }
                },
                trail: {
                    set(value) { this['_trail'] = value; },
                    get() { return cheatInstance.settings.alwaysTrail ? true : this['_trail']; }
                },
            });
        }

        onRenderFrame() {
            if (!this.three || !this.renderer?.camera || !this.me) return;
            if (this.me.procInputs && !this.me.procInputs[this.isProxy]) {
                const originalProcInputs = this.me.procInputs;
                this.me.procInputs = new Proxy(originalProcInputs, {
                    apply: (target, thisArg, args) => { if (thisArg) { this.onProcessInputs(args[0], thisArg); } return Reflect.apply(target, thisArg, args); },
                    get: (target, prop) => { if (prop === this.isProxy) return true; return Reflect.get(target, prop); }
                });
            }

            if (this.settings.weaponZoom !== 1.0 && this.me.aimVal < 1) {
                if(this.renderer.camera) this.renderer.camera.zoom = this.settings.weaponZoom;
            } else if (this.renderer.camera && this.renderer.camera.zoom !== 1.0) {
                this.renderer.camera.zoom = 1.0;
            }

            if (this.lastWireframeState !== this.settings.wireframeEnabled) {
                this.lastWireframeState = this.settings.wireframeEnabled;
                if (this.renderer.scene) {
                    this.renderer.scene.traverse(child => {
                        if (child.material && child.type == 'Mesh' && child.name != '' && child.isObject3D && !child.isModel && child.isMesh){
                            if (Array.isArray(child.material)) { for (const material of child.material) material.wireframe = this.settings.wireframeEnabled; }
                            else child.material.wireframe = this.settings.wireframeEnabled;
                        }
                    });
                }
            }

            const original_strokeStyle = this.ctx.strokeStyle; const original_lineWidth = this.ctx.lineWidth;
            const original_font = this.ctx.font; const original_fillStyle = this.ctx.fillStyle;
            CRC2d.save.apply(this.ctx, []);
            if (this.settings.fovSize > 0 && this.settings.drawFovCircle) {
                const centerX = this.overlay.canvas.width / 2; const centerY = this.overlay.canvas.height / 2;
                this.ctx.beginPath(); this.ctx.arc(centerX, centerY, this.settings.fovSize, 0, 2 * Math.PI, false);
                this.ctx.lineWidth = 2; this.ctx.strokeStyle = 'rgba(255, 0, 128, 0.7)';
                this.ctx.shadowColor = 'rgba(255, 0, 128, 1)'; this.ctx.shadowBlur = 10; this.ctx.stroke(); this.ctx.shadowBlur = 0;
            }
            for (const player of this.game.players.list) { if (player.isYou || !player.active || !player.objInstances) continue; this.drawCanvasESP(player, false); }
            if(this.settings.espBotCheck){ for (const bot of this.game.AI.ais) { if (!bot.mesh || !bot.mesh.visible || bot.health <= 0) continue; this.drawCanvasESP(bot, true); } }
            CRC2d.restore.apply(this.ctx, []);
            this.ctx.strokeStyle = original_strokeStyle; this.ctx.lineWidth = original_lineWidth;
            this.ctx.font = original_font; this.ctx.fillStyle = original_fillStyle;
        }

        onProcessInputs(inputPacket, player) {
            const gameInputIndices = { frame: 0, delta: 1, xdir: 2, ydir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12 };

            if (this.settings.bhopEnabled && this.pressedKeys.has('Space')) {
                this.controls.keys[this.controls.binds.jump.val] ^= 1;
                if (this.controls.keys[this.controls.binds.jump.val]) { this.controls.didPressed[this.controls.binds.jump.val] = 1; }
                if (this.me.velocity.y < -0.03 && this.me.canSlide) {
                    setTimeout(() => { this.controls.keys[this.controls.binds.crouch.val] = 0; }, this.me.slideTimer || 325);
                    this.controls.keys[this.controls.binds.crouch.val] = 1; this.controls.didPressed[this.controls.binds.crouch.val] = 1;
                }
            }
            if (this.settings.autoNuke && Object.keys(this.me.streaks).length && this.socket?.send) { this.socket.send('k', 0); }
            if (this.settings.autoReload && this.me.weapon.secondary !== undefined && this.me.weapon.secondary !== null && this.me.ammos[this.me[this.vars.weaponIndex]] === 0 && this.me.reloadTimer === 0) {
                this.game.players.reload(this.me); inputPacket[gameInputIndices.reload] = 1;
            }

            let target = null;
            if (this.settings.aimbotEnabled && (!this.settings.aimbotOnRightMouse || this.rightMouseDown)) {
                let potentialTargets = [];

                for (let i = 0; i < this.game.players.list.length; i++) {
                    const p = this.game.players.list[i];
                    if (this.isDefined(p) && !p.isYou && p.active && p.health > 0 &&
                        (!this.settings.aimbotTeamCheck || !this.isTeam(p)) &&
                        (!this.settings.aimbotWallCheck || this.getCanSee(p))) {
                        p.isBot = false;
                        potentialTargets.push(p);
                    }
                }

                if (this.settings.aimbotBotCheck && this.game.AI?.ais) {
                    for (let i = 0; i < this.game.AI.ais.length; i++) {
                        const bot = this.game.AI.ais[i];
                        if (bot.mesh && bot.mesh.visible && bot.health > 0 &&
                            (!this.settings.aimbotWallCheck || this.getCanSee(bot))) {
                            bot.isBot = true;
                            potentialTargets.push(bot);
                        }
                    }
                }

                potentialTargets.sort((a, b) => this.getDistanceSq(this.me, a) - this.getDistanceSq(this.me, b));

                if (this.settings.fovSize > 0) {
                    const fovRadiusSq = this.settings.fovSize * this.settings.fovSize;
                    const centerX = this.overlay.canvas.width / 2;
                    const centerY = this.overlay.canvas.height / 2;

                    potentialTargets = potentialTargets.filter(p => {
                        const screenPos = this.world2Screen({ x: p.x, y: p.y, z: p.z });
                        if (!screenPos) return false;
                        const distSq = (screenPos.x - centerX)**2 + (screenPos.y - centerY)**2;
                        return distSq <= fovRadiusSq;
                    });
                }
                target = potentialTargets[0] || null;
            }

            if (target && this.me.reloadTimer === 0 && this.game.gameState !== 4 && this.game.gameState !== 5) {
                const isMelee = this.me.weapon.melee; const closeRange = 17.6; const throwRange = 65.2;
                const distance = Math.sqrt(this.getDistanceSq(this.me, target));

                if (isMelee && distance > (this.me.weapon.canThrow ? throwRange : closeRange)) { }
                else {
                    const targetY = target.isBot ? (target.y - target.dat.mSize / 2) : (target.y - target.crouchVal * 3 + this.me.crouchVal * 3 + this.settings.aimOffset);
                    const yDire = this.getDirection(this.me.z, this.me.x, target.z, target.x);
                    const xDire = this.getXDirection(this.me.x, this.me.y, this.me.z, target.x, targetY, target.z) - (0.3 * this.me.recoilAnimY);

                    if (this.settings.legitAimbot) {
                        let adsReduction = 1.0; if (this.me.aimVal < 1) { adsReduction = 1.0 - (this.settings.adsTremorReduction / 100.0); }

                        if (this.legitTarget !== target) {
                            this.legitTarget = target;
                            this.lastTargetChangeTime = Date.now();
                            this.aimOffset.x = (Math.random() - 0.5) * (this.settings.aimRandomness * adsReduction);
                            this.aimOffset.y = (Math.random() - 0.5) * (this.settings.aimRandomness * adsReduction);
                        }

                        const wanderAmount = this.settings.aimRandomness * adsReduction;
                        this.aimOffset.x += (Math.random() - 0.5) * wanderAmount * 0.1;
                        this.aimOffset.y += (Math.random() - 0.5) * wanderAmount * 0.1;
                        this.aimOffset.x = Math.max(-wanderAmount, Math.min(wanderAmount, this.aimOffset.x));
                        this.aimOffset.y = Math.max(-wanderAmount, Math.min(wanderAmount, this.aimOffset.y));

                        const currentY = this.controls.object.rotation.y;
                        const currentX = this.controls[this.vars.pchObjc].rotation.x;

                        const finalX = xDire + this.aimOffset.y * 0.01;
                        const finalY = yDire + this.aimOffset.x * 0.01;

                        const flickFactor = this.settings.flickSpeed * 0.01;

                        const shortestAngleY = Math.atan2(Math.sin(finalY - currentY), Math.cos(finalY - currentY));
                        let newY = currentY + shortestAngleY * flickFactor;

                        const shortestAngleX = finalX - currentX;
                        let newX = currentX + shortestAngleX * flickFactor;

                        if (this.settings.aimTremor > 0) {
                            const tremorAmount = this.settings.aimTremor * adsReduction;
                            newX += (Math.random() - 0.5) * tremorAmount * 0.01;
                            newY += (Math.random() - 0.5) * tremorAmount * 0.01;
                        }

                        if (!this.settings.superSilentEnabled) this.lookDir(newX, newY);
                        inputPacket[gameInputIndices.xdir] = newX * 1000; inputPacket[gameInputIndices.ydir] = newY * 1000;
                    } else {
                        if (!this.settings.superSilentEnabled) this.lookDir(xDire, yDire);
                        inputPacket[gameInputIndices.xdir] = xDire * 1000; inputPacket[gameInputIndices.ydir] = yDire * 1000;
                    }

                    if (this.settings.autoFireEnabled) {
                        this.playerMaps.length = 0; this.rayC.setFromCamera(this.vec2, this.renderer.fpsCamera);
                        this.playerMaps = this.game.players.list.map(p => p.objInstances).filter(Boolean);
                        let inCast = this.rayC.intersectObjects(this.playerMaps, true).length;
                        let canSee = target.objInstances && this.containsPoint(target.objInstances.position);
                        if (isMelee) {
                            if (distance <= closeRange && this.me.reloadTimer === 0 && !this.me.didShoot && this.me.aimVal === 0 && (!this.settings.legitAimbot || (inCast && canSee))) { inputPacket[gameInputIndices.shoot] = 1; }
                            else if (distance <= throwRange && this.me.weapon.canThrow) {
                                inputPacket[gameInputIndices.scope] = 1;
                                if(this.me.aimVal === 0 && this.me.reloadTimer === 0 && !this.me.didShoot && (!this.settings.legitAimbot || (inCast && canSee))){ inputPacket[gameInputIndices.shoot] = 1; }
                            }
                        } else {
                            if (!this.me.weapon.noAim) inputPacket[gameInputIndices.scope] = 1;
                            if ((this.me.weapon.noAim || this.me.aimVal === 0) && this.me.reloadTimer === 0 && !this.me.didShoot && (!this.settings.legitAimbot || (inCast && canSee))) { inputPacket[gameInputIndices.shoot] = 1; }
                        }
                    }
                }
            } else if (!target && this.game.gameState !== 4 && this.game.gameState !== 5) {
                this.legitTarget = null;
                if (!this.settings.superSilentEnabled && !this.settings.antiAimEnabled) {
                    this.resetLookAt();
                }
                if (this.settings.antiAimEnabled && !this.me.didShoot && this.me.aimVal !== 0){ inputPacket[gameInputIndices.xdir] = -Math.PI * 500; }
            } else if (this.me.weapon.nAuto && this.me.didShoot) {
                inputPacket[gameInputIndices.shoot] = 0; inputPacket[gameInputIndices.scope] = 0;
                this.me.inspecting = false; this.me.inspectX = 0;
            }
        }

        showGUI() {
            if (this.game && !this.game.gameClosed) { if (document.pointerLockElement || document.mozPointerLockElement) { document.exitPointerLock(); } }
            window.showWindow(this.GUI.windowIndex);
        }

        initGameGUI() {
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap';
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);

            const menuCSS = `
.anonimbiri-menu-container{font-family:'Rajdhani','Segoe UI',sans-serif!important;background:rgba(28,19,40,.97)!important;border:1px solid rgba(232,67,147,0.15)!important;border-radius:12px!important;box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 30px rgba(232,67,147,0.08),inset 0 1px 0 rgba(255,255,255,0.05)!important;padding:0!important;overflow:hidden!important;animation:abSlide .5s ease-out;display:flex!important;flex-direction:column!important;}
@keyframes abSlide{from{opacity:0;transform:translate(-50%,calc(-50% - 20px)) scale(.95)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}

.anonimbiri-menu-header{width:100%;height:400px;min-height:220px;position:relative;overflow:hidden;border-radius:12px 12px 0 0;flex-shrink:0;}
.anonimbiri-menu-header::before{content:'';position:absolute;inset:0;background-image:url(https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/banner.png);background-size:cover;background-position:center;z-index:1;}
.anonimbiri-menu-header::after{content:'';position:absolute;bottom:0;left:0;right:0;height:50px;background:linear-gradient(to top,rgba(28,19,40,.97),transparent);z-index:2;}
.anonimbiri-petal{position:absolute;width:8px;height:8px;background:radial-gradient(ellipse,#f8a5c2,#e84393);border-radius:50% 0 50% 0;opacity:0;z-index:3;pointer-events:none;animation:abFall linear infinite;}
@keyframes abFall{0%{opacity:0;transform:translate(0,-20px) rotate(0) scale(.5)}10%{opacity:.5}90%{opacity:.2}100%{opacity:0;transform:translate(80px,220px) rotate(720deg) scale(.1)}}

.anonimbiri-tab-container{display:flex;background:rgba(19,13,26,.9);border-bottom:1px solid rgba(232,67,147,0.1);padding:0 6px;flex-shrink:0;}
.anonimbiri-tab{flex:1;padding:14px 8px;font-size:14px;font-weight:700;letter-spacing:1.2px;color:#6b5570;cursor:pointer;transition:all .3s ease;border-bottom:2px solid transparent;background:transparent;font-family:'Rajdhani',sans-serif;text-align:center;position:relative;overflow:hidden;}
.anonimbiri-tab::before{display:none}
.anonimbiri-tab:hover{color:#b8a0b0;background:rgba(232,67,147,0.05);}
.anonimbiri-tab.active{color:#fd79a8;border-bottom-color:#e84393;background:transparent;}

.anonimbiri-content-wrap{display:flex;flex:1;min-height:0;overflow:hidden;}
.anonimbiri-tab-content{flex:1;padding:16px 20px;overflow-y:auto;min-height:0;}
.anonimbiri-tab-content::-webkit-scrollbar{width:5px}
.anonimbiri-tab-content::-webkit-scrollbar-track{background:transparent}
.anonimbiri-tab-content::-webkit-scrollbar-thumb{background:#c0266e;border-radius:3px}

.anonimbiri-esp-panel{width:220px;background:rgba(19,13,26,.9);border-left:1px solid rgba(232,67,147,0.1);display:flex;flex-direction:column;flex-shrink:0;overflow:hidden;}
.anonimbiri-esp-title{text-align:center;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#e84393;text-transform:uppercase;padding:12px;border-bottom:1px solid rgba(232,67,147,0.1);flex-shrink:0;}
.anonimbiri-esp-wrap{flex:1;display:flex;align-items:center;justify-content:center;padding:8px;overflow:hidden;}
#anonimbiri-espCanvas{border-radius:8px;border:1px solid rgba(232,67,147,0.1);max-width:100%;max-height:100%;}

.anonimbiri-tab-pane{display:none}
.anonimbiri-tab-pane.active{display:block;animation:abFade .3s ease;}
@keyframes abFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

.anonimbiri-section{font-size:12px;font-weight:700;letter-spacing:1.5px;color:#e84393;text-transform:uppercase;margin:18px 0 10px 4px;opacity:.8;}
.anonimbiri-section:first-child{margin-top:0}

.anonimbiri-menu-item{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;margin:6px 0;background:rgba(37,26,51,.8);border:1px solid transparent;border-radius:8px;transition:all .3s ease;cursor:pointer;position:relative;overflow:visible;}
.anonimbiri-menu-item::before{display:none}
.anonimbiri-menu-item:hover{background:rgba(47,34,64,.9);border-color:rgba(232,67,147,0.25);}
.anonimbiri-menu-item.active{background:rgba(47,34,64,.9);border-color:rgba(232,67,147,0.25);}
.anonimbiri-menu-item-content{display:flex;align-items:center;gap:14px;}
.anonimbiri-menu-item-icon{width:24px;height:24px;stroke:#fd79a8;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;transition:all .3s ease;}
.anonimbiri-menu-item:hover .anonimbiri-menu-item-icon{stroke:#e84393;}
.anonimbiri-menu-item label{color:#f0e0ea;font-weight:600;font-size:16px;letter-spacing:0.5px;cursor:pointer;font-family:'Rajdhani',sans-serif;white-space:nowrap;transition:color .3s ease;}
.anonimbiri-controls{display:flex;align-items:center;gap:10px;}

.anonimbiri-menu-item[data-tip]:hover::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:rgba(26,15,40,.95);color:#b8a0b0;padding:8px 12px;border-radius:8px;font-size:12px;max-width:280px;z-index:100;border:1px solid rgba(232,67,147,0.25);box-shadow:0 4px 16px rgba(0,0,0,.5);pointer-events:none;animation:abTipIn .2s ease;line-height:1.4;white-space:normal;font-weight:500;}
@keyframes abTipIn{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

.anonimbiri-toggle-switch{position:relative;width:48px;height:26px;background:#3a2845;border-radius:13px;pointer-events:none;transition:all .3s ease;border:none;}
.anonimbiri-toggle-switch::before{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;background:#bbb;border-radius:50%;transition:all .3s cubic-bezier(.68,-.55,.265,1.55);box-shadow:0 1px 3px rgba(0,0,0,.3);}
.anonimbiri-toggle-switch.active{background:linear-gradient(135deg,#e84393,#fd79a8);box-shadow:0 0 12px rgba(232,67,147,0.25);}
.anonimbiri-toggle-switch.active::before{left:25px;background:#fff;}

.anonimbiri-hk-btn{padding:4px 10px;background:rgba(26,18,37,.8);border:1px solid rgba(232,67,147,0.1);border-radius:4px;color:#6b5570;font-size:11px;cursor:pointer;transition:all .3s ease;white-space:nowrap;min-width:34px;text-align:center;font-family:'Rajdhani',sans-serif;pointer-events:auto;font-weight:600;}
.anonimbiri-hk-btn:hover{border-color:#e84393;color:#fd79a8;}
.anonimbiri-hk-btn.bound{background:rgba(232,67,147,0.1);border-color:rgba(232,67,147,0.3);color:#fd79a8;}

.anonimbiri-color-container{position:relative}
.anonimbiri-color-picker-input{opacity:0;position:absolute;width:42px;height:28px;cursor:pointer;}
.anonimbiri-color-preview{width:34px;height:26px;border:2px solid rgba(255,255,255,.15);border-radius:4px;pointer-events:none;transition:all .3s ease;}
.anonimbiri-menu-item:hover .anonimbiri-color-preview{box-shadow:0 0 8px rgba(232,67,147,0.25);border-color:rgba(255,255,255,.25);}

.anonimbiri-slider-container{display:flex;align-items:center;gap:10px;min-width:190px;}
.anonimbiri-slider{appearance:none;-webkit-appearance:none;width:140px;height:6px;background:#3a2845;border:none;border-radius:3px;outline:none;}
.anonimbiri-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:none;box-shadow:0 1px 4px rgba(0,0,0,.3);cursor:grab;}
.anonimbiri-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:none;cursor:grab;}
.anonimbiri-slider::-moz-range-track{height:6px;background:#3a2845;border:none;border-radius:3px;}
.anonimbiri-slider-value{color:#f0e0ea;font-weight:600;font-size:14px;width:55px;text-align:center;background:rgba(26,18,37,.8);border:1px solid rgba(232,67,147,0.1);border-radius:4px;padding:4px 6px;-moz-appearance:textfield;font-family:'Rajdhani',sans-serif;outline:none;}
.anonimbiri-slider-value:focus{border-color:#e84393;}

.anonimbiri-menu-container hr{border:none;border-top:1px solid rgba(232,67,147,0.1);margin:12px 0;}

.anonimbiri-hotkey-modal{position:fixed;inset:0;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;z-index:2000;backdrop-filter:blur(4px);}
.anonimbiri-hotkey-modal.active{display:flex}
.anonimbiri-hotkey-content{background:rgba(28,19,40,.97);border:1px solid rgba(232,67,147,0.25);padding:30px 45px;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center;animation:abMIn .3s ease;}
@keyframes abMIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
.anonimbiri-hotkey-content h2{color:#fd79a8;font-size:20px;font-weight:600;margin-bottom:10px;letter-spacing:2px;font-family:'Rajdhani',sans-serif;}
.anonimbiri-hotkey-content p{color:#6b5570;font-size:13px;margin-bottom:12px;font-family:'Rajdhani',sans-serif;}
.anonimbiri-hotkey-content p span{color:#fd79a8;font-weight:700;}

#shiro-menu-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px 0 6px;
    height: 45px;
    margin-right: 15px;
    background-color: rgba(28,19,40,.9);
    border: 1px solid rgba(232,67,147,.3);
    cursor: pointer;
    transition: all .3s ease;
    border-radius: 8px;
}
#shiro-menu-button:hover {
    border-color: #e84393;
    box-shadow: 0 0 15px rgba(232,67,147,0.25);
    background-color: rgba(47,34,64,.9);
}
.shiro-icon {
    width: 32px;
    height: 32px;
    background-image: url('https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png');
    background-size: cover;
    background-position: center;
    border-radius: 4px;
}
.shiro-label {
    color: #fd79a8;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Rajdhani', sans-serif;
    letter-spacing: 0.5px;
    white-space: nowrap;
}

#anonimbiri-notify-wrap{position:fixed;top:16px;right:16px;z-index:20000;display:flex;flex-direction:column;gap:10px}
.anonimbiri-notify-card{font-family:'Rajdhani',sans-serif;display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:rgba(28,19,40,.95);border:1px solid rgba(232,67,147,.25);border-radius:12px;backdrop-filter:blur(6px);width:min(92vw,360px);cursor:default;transform:translateX(calc(100%+20px));opacity:0;transition:transform .35s ease,opacity .35s ease;}
.anonimbiri-notify-card.visible{transform:translateX(0);opacity:1;box-shadow:0 10px 25px rgba(232,67,147,.15);}
.anonimbiri-notify-content{display:flex;align-items:center;gap:12px;min-width:0}
.anonimbiri-notify-logo{width:40px;height:40px;flex:0 0 40px;background-image:url('https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png');background-size:cover;background-position:center;border-radius:8px;}
.anonimbiri-notify-texts{display:flex;flex-direction:column;gap:3px;min-width:0}
.anonimbiri-notify-title{color:#f0e0ea;font-weight:700;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;}
.anonimbiri-notify-message{color:#6b5570;font-size:11px;line-height:1.4;white-space:normal;word-break:break-word;}
.anonimbiri-notify-controls{display:flex;align-items:center;gap:8px;padding-left:5px}
.anonimbiri-notify-action-btn{background:rgba(232,67,147,.1);color:#fd79a8;padding:5px 12px;border-radius:4px;font-size:12px;font-weight:700;border:1px solid rgba(232,67,147,.3);min-width:40px;text-align:center;cursor:pointer;transition:all .3s ease;font-family:'Rajdhani',sans-serif;}
.anonimbiri-notify-action-btn:hover{background:#e84393;color:#fff;}
`;

        const style = document.createElement('style');
        style.textContent = menuCSS;
        document.head.appendChild(style);

        const hotkeyModalHTML = `
              <div class="anonimbiri-hotkey-modal" id="anonimbiri-hotkeyModal">
                  <div class="anonimbiri-hotkey-content">
                      <h2>🌸 Press a Key</h2>
                      <p>Assign hotkey to <span id="anonimbiri-hotkeyFeatureName">...</span></p>
                      <p>ESC to cancel · DEL to unbind</p>
                  </div>
              </div>`;
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = hotkeyModalHTML;
        document.body.appendChild(modalContainer);
        this.hotkeyModal = document.getElementById('anonimbiri-hotkeyModal');

        this.GUI.windowIndex = window.windows.length + 1;
        this.GUI.windowObj = {
            closed: false,
            header: "🌸 AimbaeShiro 🌸",
            html: "",
            extraCls: "anonimbiri-menu-container",
            gen: () => this.getGuiHtml(),
            hideScroll: true,
            height: 'calc(100% - 120px)',
            width: 850,
        };

        Object.defineProperty(window.windows, window.windows.length, { value: this.GUI.windowObj });

        this.waitFor(() => document.querySelector('.headerBarRight')).then(headerRight => {
            if (headerRight && !document.getElementById('shiro-menu-button')) {
                const btn = document.createElement("div");
                btn.id = 'shiro-menu-button';
                btn.innerHTML = `<div class="shiro-icon"></div><span class="shiro-label">AimbaeShiro</span>`;

                btn.addEventListener("click", () => this.showGUI());
                btn.addEventListener('mouseenter', () => { if (window.SOUND) window.SOUND.play('hover_0', 0.1); });
                headerRight.prepend(btn);
            }
        });
    }

        getGuiHtml() {
            const I = {
                aimbot: '<circle cx="12" cy="12" r="7" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke-width="2"/>',
                rightMouse: '<rect x="7" y="3" width="10" height="18" rx="3" stroke-width="2" fill="none"/><path d="M12 3v6" stroke-width="2"/>',
                wall: '<path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12"/><path d="M4 8h16"/><path d="M20 12h-16"/><path d="M4 16h16"/><path d="M9 4v4"/><path d="M14 8v4"/><path d="M8 12v4"/><path d="M16 12v4"/><path d="M11 16v4"/>',
                wallOff: '<path d="M8 4h10a2 2 0 0 1 2 2v10m-.589 3.417c-.361 .36 -.86 .583 -1.411 .583h-12a2 2 0 0 1 -2 -2v-12c0 -.55 .222 -1.047 .58 -1.409"/><path d="M4 8h4m4 0h8"/><path d="M20 12h-4m-4 0h-8"/><path d="M4 16h12"/><path d="M9 4v1"/><path d="M14 8v2"/><path d="M8 12v4"/><path d="M11 16v4"/><path d="M3 3l18 18"/>',
                teamCheck: '<path d="M12 2l8 3.5v7c0 5.5-3.5 9.3-8 10.5-4.5-1.2-8-5-8-10.5v-7z" stroke-width="2" fill="none"/><path d="M8 12l3 3 5-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
                autoFire: '<path d="M13 2l-2 7h4l-3 11 7-11h-4l2-7z" stroke-width="2" fill="none"/>',
                superSilent: '<circle cx="12" cy="12" r="3" stroke-width="2" fill="none"/><path d="M3 12h6M15 12h6" stroke-width="2" stroke-dasharray="3 2"/>',
                line: '<path d="M4 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M16 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M7.5 16.5l9 -9"/>',
                espSquare: '<path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" stroke-width="2" stroke-linecap="round"/>',
                nameTags: '<rect x="3" y="7" width="18" height="10" rx="2" stroke-width="2" fill="none"/><circle cx="7" cy="12" r="1.5" fill="currentColor"/><line x1="11" y1="10" x2="18" y2="10" stroke-width="1.5"/><line x1="11" y1="14" x2="16" y2="14" stroke-width="1.5"/>',
                weaponIcons: '<path d="M7 4l1.5 3v11a1 1 0 001 1h3a1 1 0 001-1V7l1.5-3z" stroke-width="2" fill="none"/><path d="M16 8v8l2 2" stroke-width="2" stroke-linecap="round"/>',
                espInfoBg: '<rect x="3" y="6" width="18" height="12" rx="2" stroke-width="2" fill="none"/><rect x="5" y="8" width="14" height="8" rx="1" opacity=".3" fill="currentColor"/>',
                palette: '<path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25"/><path d="M7.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M11.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/><path d="M15.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/>',
                wireframe: '<path d="M12 2l9 5v10l-9 5-9-5V7z" stroke-width="2" fill="none"/><path d="M12 2v20M21 7l-18 10M3 7l18 10" stroke-width="1" opacity=".5"/>',
                unlockSkins: '<rect x="5" y="11" width="14" height="10" rx="2" stroke-width="2" fill="none"/><path d="M8 11V7a4 4 0 018 0v4" stroke-width="2" fill="none"/><circle cx="12" cy="16" r="1" fill="currentColor"/>',
                bounce: '<path d="M4 15.5c3 -1 5.5 -.5 8 4.5c.5 -3 1.5 -5.5 3 -8"/><path d="M18 9a2 2 0 1 1 0 -4a2 2 0 0 1 0 4"/>',
                antiAim: '<circle cx="12" cy="12" r="8" stroke-width="2" fill="none"/><path d="M12 8v4l3 3" stroke-width="2" stroke-linecap="round"/>',
                rocket: '<path d="M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3"/><path d="M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3"/><path d="M14 9a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"/>',
                antiKick: '<path d="M12 2l8 3.5v7c0 5.5-3.5 9.3-8 10.5-4.5-1.2-8-5-8-10.5v-7z" stroke-width="2" fill="none"/><path d="M8 8l8 8M16 8l-8 8" stroke-width="2" stroke-linecap="round"/>',
                autoReload: '<path d="M21 12a9 9 0 01-9 9 9 9 0 01-9-9 9 9 0 019-9c2.5 0 4.7 1 6.3 2.7" stroke-width="2" fill="none"/><path d="M21 4v5h-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
                fov: '<circle cx="12" cy="12" r="9" stroke-width="2" fill="none"/><path d="M12 12l6-4M12 12l6 4" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
                robot: '<path d="M6 6a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2l0 -4"/><path d="M12 2v2"/><path d="M9 12v9"/><path d="M15 12v9"/><path d="M5 16l4 -2"/><path d="M15 14l4 2"/><path d="M9 18h6"/><path d="M10 8v.01"/><path d="M14 8v.01"/>',
            };

            const tips = {
                aimbotEnabled:'Master aimbot toggle.', aimbotOnRightMouse:'Only activate when right mouse held.',
                aimbotWallCheck:'No target through walls.', aimbotWallBangs:'Shoot through penetrable walls.',
                aimbotTeamCheck:'No target teammates.', aimbotBotCheck:'Target AI/bots.',
                autoFireEnabled:'Auto fires when target acquired.', superSilentEnabled:'Aims without moving camera.',
                fovSize:'FOV radius. 0 = full screen.', drawFovCircle:'Displays FOV circle.',
                espTeamCheck:'No ESP for teammates.', espBotCheck:'ESP for AI/bots.',
                espLines:'Line from bottom to enemies.', espSquare:'Box around enemies.',
                espNameTags:'Name, health, weapon info.', espWeaponIcons:'Weapon icon in info.',
                espInfoBackground:'Background for info panel.', espColor:'ESP line color.',
                boxColor:'Box & info color.', botColor:'Bot ESP color.',
                wireframeEnabled:'Wireframe rendering.', unlockSkins:'Client-side skin unlocker.',
                bhopEnabled:'Hold space auto-jump.', antiAimEnabled:'Makes you harder to hit.',
                autoNuke:'Auto nuke when available.', antikick:'Prevents inactivity kick.',
                autoReload:'Auto reload when empty.',
                thirdPersonEnabled: 'Play in 3rd person view.',
                alwaysTrail: 'Always show bullet trails.',
                weaponZoom: 'Adjust ADS zoom level (1 = default).'
            };

            setTimeout(() => {
                this.bindMenuEvents();
                this.espPreviewCanvas = document.getElementById('anonimbiri-espCanvas');
                if (this.espPreviewCanvas) { this.espPreviewCtx = this.espPreviewCanvas.getContext('2d'); this.renderESPPreview(); }
            }, 100);

            let petals = '';
            for (let i = 0; i < 15; i++) petals += `<div class="anonimbiri-petal" style="left:${Math.random()*100}%;top:${Math.random()*40}%;width:${5+Math.random()*7}px;height:${5+Math.random()*7}px;animation-delay:${Math.random()*8}s;animation-duration:${3+Math.random()*5}s"></div>`;

            return `
                <div class="anonimbiri-menu-header">${petals}</div>
                <div class="anonimbiri-tab-container">
                    <div class="anonimbiri-tab active" data-tab="aimbot">⊕ AIMBOT</div>
                    <div class="anonimbiri-tab" data-tab="esp">◎ ESP</div>
                    <div class="anonimbiri-tab" data-tab="misc">✦ MISC</div>
                </div>
                <div class="anonimbiri-content-wrap">
                    <div class="anonimbiri-tab-content">
                        <div class="anonimbiri-tab-pane active" id="anonimbiri-tab-aimbot">
                            <div class="anonimbiri-section">General</div>
                            ${this.createMenuItemHTML('toggle','aimbotEnabled','Aimbot Enabled', I.aimbot, tips.aimbotEnabled)}
                            ${this.createMenuItemHTML('toggle','aimbotOnRightMouse','Right Mouse Trigger', I.rightMouse, tips.aimbotOnRightMouse)}
                            ${this.createMenuItemHTML('toggle','autoFireEnabled','Auto Fire', I.autoFire, tips.autoFireEnabled)}
                            ${this.createMenuItemHTML('toggle','superSilentEnabled','Super Silent Aim', I.superSilent, tips.superSilentEnabled)}
                            <div class="anonimbiri-section">Checks</div>
                            ${this.createMenuItemHTML('toggle','aimbotWallCheck','Wall Check', I.wall, tips.aimbotWallCheck)}
                            ${this.createMenuItemHTML('toggle','aimbotWallBangs','WallBangs', I.wallOff, tips.aimbotWallBangs)}
                            ${this.createMenuItemHTML('toggle','aimbotTeamCheck','Team Check', I.teamCheck, tips.aimbotTeamCheck)}
                            ${this.createMenuItemHTML('toggle','aimbotBotCheck','Bot Aim', I.robot, tips.aimbotBotCheck)}
                            <div class="anonimbiri-section">Legit Aim</div>
                            ${this.createMenuItemHTML('toggle','legitAimbot','Legit AI Aim', I.teamCheck, 'Simulates human-like aiming.')}
                            ${this.createMenuItemHTML('slider','flickSpeed','Flick Speed', I.autoFire, 'Flick speed control.', 0, 100, 1)}
                            ${this.createMenuItemHTML('slider','adsTremorReduction','ADS Stability %', I.aimbot, 'Reduces tremor when ADS.', 0, 100, 1)}
                            ${this.createMenuItemHTML('slider','aimRandomness','Aim Wandering', I.line, 'Simulates imperfect aim.', 0, 5, 0.1)}
                            ${this.createMenuItemHTML('slider','aimTremor','Aim Tremor', I.wireframe, 'Hand tremor simulation.', 0, 5, 0.1)}
                            <div class="anonimbiri-section">Targeting</div>
                            ${this.createMenuItemHTML('slider','fovSize','FOV Size', I.fov, tips.fovSize, 0, 300, 1)}
                            ${this.createMenuItemHTML('toggle','drawFovCircle','Draw FOV Circle', I.espSquare, tips.drawFovCircle)}
                        </div>
                        <div class="anonimbiri-tab-pane" id="anonimbiri-tab-esp">
                            <div class="anonimbiri-section">Visuals</div>
                            ${this.createMenuItemHTML('toggle','thirdPersonEnabled','Third Person', I.robot, tips.thirdPersonEnabled)}
                            ${this.createMenuItemHTML('toggle','alwaysTrail','Weapon Trails', I.line, tips.alwaysTrail)}
                            ${this.createMenuItemHTML('slider','weaponZoom','Weapon Zoom', I.fov, tips.weaponZoom, 0.1, 5.0, 0.1)}
                            ${this.createMenuItemHTML('toggle','espSquare','ESP Box', I.espSquare, tips.espSquare)}
                            ${this.createMenuItemHTML('toggle','espLines','ESP Lines', I.line, tips.espLines)}
                            ${this.createMenuItemHTML('toggle','espNameTags','Name Tags', I.nameTags, tips.espNameTags)}
                            ${this.createMenuItemHTML('toggle','espWeaponIcons','Weapon Icons', I.weaponIcons, tips.espWeaponIcons)}
                            ${this.createMenuItemHTML('toggle','espInfoBackground','Info Background', I.espInfoBg, tips.espInfoBackground)}
                            ${this.createMenuItemHTML('toggle','wireframeEnabled','Wireframe', I.wireframe, tips.wireframeEnabled)}
                            <div class="anonimbiri-section">Filters</div>
                            ${this.createMenuItemHTML('toggle','espTeamCheck','Team Check', I.teamCheck, tips.espTeamCheck)}
                            ${this.createMenuItemHTML('toggle','espBotCheck','Bot ESP', I.robot, tips.espBotCheck)}
                            <div class="anonimbiri-section">Colors</div>
                            ${this.createMenuItemHTML('color','espColor','ESP Color', I.palette, tips.espColor)}
                            ${this.createMenuItemHTML('color','boxColor','Box Color', I.palette, tips.boxColor)}
                            ${this.createMenuItemHTML('color','botColor','Bot Color', I.palette, tips.botColor)}
                        </div>
                        <div class="anonimbiri-tab-pane" id="anonimbiri-tab-misc">
                            <div class="anonimbiri-section">Movement</div>
                            ${this.createMenuItemHTML('toggle','bhopEnabled','Bunny Hop', I.bounce, tips.bhopEnabled)}
                            <div class="anonimbiri-section">Combat</div>
                            ${this.createMenuItemHTML('toggle','antiAimEnabled','Anti-Aim', I.antiAim, tips.antiAimEnabled)}
                            ${this.createMenuItemHTML('toggle','autoNuke','Auto Nuke', I.rocket, tips.autoNuke)}
                            ${this.createMenuItemHTML('toggle','antikick','Anti Kick', I.antiKick, tips.antikick)}
                            ${this.createMenuItemHTML('toggle','autoReload','Auto Reload', I.autoReload, tips.autoReload)}
                            <div class="anonimbiri-section">Other</div>
                            ${this.createMenuItemHTML('toggle','unlockSkins','Unlock All Skins', I.unlockSkins, tips.unlockSkins)}
                        </div>
                    </div>
                    <div class="anonimbiri-esp-panel">
                        <div class="anonimbiri-esp-title">ESP Preview</div>
                        <div class="anonimbiri-esp-wrap">
                            <canvas id="anonimbiri-espCanvas" width="200" height="450"></canvas>
                        </div>
                    </div>
                </div>`;
        }

        createMenuItemHTML(type, setting, label, iconPath, tooltip = '', min, max, step) {
            let controlHTML = '';
            const iconSVG = `<svg class="anonimbiri-menu-item-icon" viewBox="0 0 24 24">${iconPath}</svg>`;
            const tipAttr = tooltip ? ` data-tip="${tooltip}"` : '';
            const hasHK = this.defaultHotkeys.hasOwnProperty(setting);

            switch (type) {
                case 'toggle':
                    if (hasHK) {
                        const kd = this.hotkeys[setting] ? this.hotkeys[setting].replace('Key','').replace('Digit','').replace('Numpad','Num') : '-';
                        const bc = this.hotkeys[setting] ? ' bound' : '';
                        controlHTML = `<button class="anonimbiri-hk-btn${bc}" data-hk="${setting}">${kd}</button>`;
                    }
                    controlHTML += `<div class="anonimbiri-toggle-switch ${this.settings[setting] ? 'active' : ''}"></div>`;
                    break;
                case 'color':
                    controlHTML = `<div class="anonimbiri-color-container">
                        <input type="color" class="anonimbiri-color-picker-input" data-setting="${setting}" value="${this.settings[setting]}">
                        <div class="anonimbiri-color-preview" data-setting="${setting}" style="background-color: ${this.settings[setting]}"></div>
                    </div>`;
                    break;
                case 'slider':
                    const val = (this.settings && typeof this.settings[setting] !== 'undefined') ? this.settings[setting] : 0;
                    const displayVal = val <= 0 ? 'Off' : val;
                    controlHTML = `<div class="anonimbiri-slider-container" data-setting="${setting}">
                        <input type="range" class="anonimbiri-slider" data-setting="${setting}" min="${min}" max="${max}" step="${step}" value="${val}">
                        <input type="text" class="anonimbiri-slider-value" data-setting="${setting}" value="${displayVal}" onfocus="this.type='number'" onblur="this.type='text'; this.value = this.value <= 0 ? 'Off' : this.value">
                    </div>`;
                    break;
            }
            return `<div class="anonimbiri-menu-item ${this.settings[setting] ? 'active' : ''}" data-setting="${setting}"${tipAttr}>
                <div class="anonimbiri-menu-item-content">${iconSVG}<label>${label}</label></div>
                <div class="anonimbiri-controls">${controlHTML}</div>
            </div>`;
        }

        bindMenuEvents() {
            const menu = document.querySelector('.anonimbiri-menu-container');
            if (!menu) return;

            menu.querySelector('.anonimbiri-tab-container').addEventListener('click', (e) => {
                if (e.target.classList.contains('anonimbiri-tab')) {
                    if (window.SOUND) window.SOUND.play('select_0', 0.1);
                    const tabName = e.target.dataset.tab;
                    menu.querySelectorAll('.anonimbiri-tab').forEach(t => t.classList.remove('active'));
                    menu.querySelectorAll('.anonimbiri-tab-pane').forEach(p => p.classList.remove('active'));
                    e.target.classList.add('active');
                    menu.querySelector(`#anonimbiri-tab-${tabName}`).classList.add('active');
                }
            });

            menu.querySelector('.anonimbiri-tab-content').addEventListener('click', (e) => {
                const hkBtn = e.target.closest('.anonimbiri-hk-btn');
                if (hkBtn) { e.stopPropagation(); if (hkBtn.dataset.hk) this.showHotkeyModal(hkBtn.dataset.hk); return; }

                const menuItem = e.target.closest('.anonimbiri-menu-item');
                if (!menuItem) return;
                const setting = menuItem.dataset.setting;
                if (!setting || menuItem.querySelector('.anonimbiri-slider-container')) return;

                if (window.SOUND) window.SOUND.play('select_0', 0.1);

                if (menuItem.querySelector('.anonimbiri-toggle-switch')) {
                    this.settings[setting] = !this.settings[setting];
                    this.saveSettings('aimbaeshiro_settings', this.settings);
                    menuItem.classList.toggle('active');
                    menuItem.querySelector('.anonimbiri-toggle-switch').classList.toggle('active');
                    if (this.espPreviewCtx) this.renderESPPreview();
                } else if (menuItem.querySelector('.anonimbiri-color-picker-input')) {
                    menuItem.querySelector('.anonimbiri-color-picker-input').click();
                }
            });

            menu.querySelectorAll('.anonimbiri-color-picker-input').forEach(cp => cp.addEventListener('input', (e) => {
                const setting = e.target.dataset.setting;
                this.settings[setting] = e.target.value;
                this.saveSettings('aimbaeshiro_settings', this.settings);
                menu.querySelector(`.anonimbiri-color-preview[data-setting="${setting}"]`).style.backgroundColor = e.target.value;
                if (this.espPreviewCtx) this.renderESPPreview();
            }));

            menu.querySelectorAll('.anonimbiri-slider').forEach(slider => {
                const setting = slider.dataset.setting;
                const valueInput = menu.querySelector(`.anonimbiri-slider-value[data-setting="${setting}"]`);
                slider.addEventListener('input', () => {
                    const value = slider.value; this.settings[setting] = Number(value);
                    if (valueInput) valueInput.value = value <= 0 ? 'Off' : value;
                });
                slider.addEventListener('change', () => this.saveSettings('aimbaeshiro_settings', this.settings));
            });

            menu.querySelectorAll('.anonimbiri-slider-value').forEach(valueInput => {
                const setting = valueInput.dataset.setting;
                const slider = menu.querySelector(`.anonimbiri-slider[data-setting="${setting}"]`);
                valueInput.addEventListener('input', () => {
                    let value = Number(valueInput.value);
                    const min = Number(slider.min); const max = Number(slider.max);
                    if (value > max) value = max; if (value < min) value = min;
                    valueInput.value = value; this.settings[setting] = value; if (slider) slider.value = value;
                });
                valueInput.addEventListener('change', () => this.saveSettings('aimbaeshiro_settings', this.settings));
            });

            menu.querySelectorAll('.anonimbiri-menu-item, .anonimbiri-tab').forEach(el => {
                el.addEventListener('mouseenter', () => { if (window.SOUND) window.SOUND.play('hover_0', 0.1); });
            });
        }

        addEventListeners() {
            window.addEventListener('pointerdown', (e) => { if (e.button === 2) this.rightMouseDown = true; });
            window.addEventListener('pointerup', (e) => { if (e.button === 2) this.rightMouseDown = false; });
            window.addEventListener('keydown', (e) => {
                this.pressedKeys.add(e.code);
                if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

                if (this.isBindingHotkey) {
                    e.preventDefault(); e.stopPropagation();
                    if (e.code === 'Escape') { this.hideHotkeyModal(); return; }
                    if (e.code === 'Delete' || e.code === 'Backspace') {
                        delete this.hotkeys[this.currentBindingSetting];
                        this.saveSettings('aimbaeshiro_hotkeys', this.hotkeys);
                        const menu = document.querySelector('.anonimbiri-menu-container');
                        if (menu) { const hkBtn = menu.querySelector(`.anonimbiri-hk-btn[data-hk="${this.currentBindingSetting}"]`); if (hkBtn) { hkBtn.textContent = '-'; hkBtn.classList.remove('bound'); } }
                        this.hideHotkeyModal(); return;
                    }
                    if (Object.values(this.hotkeys).includes(e.code)) { this.notify({ title: "Hotkey Error", message: "Key already assigned!"}); return; }
                    this.hotkeys[this.currentBindingSetting] = e.code;
                    this.saveSettings('aimbaeshiro_hotkeys', this.hotkeys);
                    const menu = document.querySelector('.anonimbiri-menu-container');
                    if(menu) { const hkBtn = menu.querySelector(`.anonimbiri-hk-btn[data-hk="${this.currentBindingSetting}"]`); if(hkBtn) { hkBtn.textContent = e.code.replace('Key','').replace('Digit','').replace('Numpad','Num'); hkBtn.classList.add('bound'); } }
                    this.hideHotkeyModal(); return;
                }

                const action = Object.keys(this.hotkeys).find(key => this.hotkeys[key] === e.code);
                if (action) {
                    e.preventDefault(); e.stopPropagation();
                    if (action === 'toggleMenu') { this.showGUI(); }
                    else if (this.settings.hasOwnProperty(action)) {
                        this.settings[action] = !this.settings[action];
                        this.saveSettings('aimbaeshiro_settings', this.settings);
                        this.notify({ title: "Toggled", message: `${action.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${this.settings[action] ? 'ON' : 'OFF'}`});
                        const menu = document.querySelector('.anonimbiri-menu-container');
                        if (menu) {
                            const item = menu.querySelector(`.anonimbiri-menu-item[data-setting="${action}"]`);
                            if (item) { item.classList.toggle('active', this.settings[action]); const toggle = item.querySelector('.anonimbiri-toggle-switch'); if (toggle) toggle.classList.toggle('active', this.settings[action]); }
                        }
                        if (this.espPreviewCtx) this.renderESPPreview();
                    }
                }
            });
            window.addEventListener('keyup', (e) => { this.pressedKeys.delete(e.code); });
        }

        showHotkeyModal(settingName) {
            if (!this.hotkeyModal) return;
            this.isBindingHotkey = true; this.currentBindingSetting = settingName;
            const featureNameEl = document.getElementById('anonimbiri-hotkeyFeatureName');
            if (featureNameEl) featureNameEl.textContent = settingName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            this.hotkeyModal.classList.add('active');
        }

        hideHotkeyModal() { if (!this.hotkeyModal) return; this.isBindingHotkey = false; this.currentBindingSetting = null; this.hotkeyModal.classList.remove('active'); }

        isDefined(val) { return val !== undefined && val !== null; }
        isTeam(player) { return this.me && this.me.team ? this.me.team === player.team : false; }
        getDistanceSq(p1, p2) { return (p2.x - p1.x)**2 + (p2.y - p1.y)**2 + (p2.z - p1.z)**2; }
        getDirection(z1, x1, z2, x2) { return Math.atan2(x1 - x2, z1 - z2); }
        getXDirection(t,e,o,i,s,n){const r=s-e,a=Math.sqrt((i-t)**2+(s-e)**2+(n-o)**2);return Math.asin(r/a)}

        containsPoint(point) { let planes = this.renderer.frustum.planes; for (let i = 0; i < 6; i ++) { if (planes[i].distanceToPoint(point) < 0) { return false; } } return true; }

        lineInRect(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2) {
            let t1 = (x1 - lx1) * dx; let t2 = (x2 - lx1) * dx; let t3 = (y1 - ly1) * dy; let t4 = (y2 - ly1) * dy;
            let t5 = (z1 - lz1) * dz; let t6 = (z2 - lz1) * dz;
            let tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
            let tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
            if (tmax < 0) return false; if (tmin > tmax) return false; return tmin;
        }

        getCanSee(player, boxSize) {
            const from = this.me; if (!from || !this.game?.map?.manager?.objects) return true;
            boxSize = boxSize || 0; const toX = player.x, toY = player.y, toZ = player.z; let penetrableWallsHit = 0;
            for (let obj, dist = Math.sqrt((toX-from.x)**2+(toY-from.y)**2+(toZ-from.z)**2), xDr = this.getDirection(from.z, from.x, toZ, toX), yDr = this.getDirection(Math.sqrt((toX-from.x)**2+(toZ-from.z)**2), toY, 0, from.y), dx = 1 / (dist * Math.sin(xDr - Math.PI) * Math.cos(yDr)), dz = 1 / (dist * Math.cos(xDr - Math.PI) * Math.cos(yDr)), dy = 1 / (dist * Math.sin(yDr)), yOffset = from.y + (from.height || this.PLAYER_HEIGHT) - this.CAMERA_HEIGHT, i = 0; i < this.game.map.manager.objects.length; ++i) {
                let tmpDst;
                if (!(obj = this.game.map.manager.objects[i]).noShoot && obj.active && obj.transparent !== false &&
                    (tmpDst = this.lineInRect(from.x, from.z, yOffset, dx, dz, dy, obj.x - Math.max(0, obj.width - boxSize), obj.z - Math.max(0, obj.length - boxSize), obj.y - Math.max(0, obj.height - boxSize), obj.x + Math.max(0, obj.width - boxSize), obj.z + Math.max(0, obj.length - boxSize), obj.y + Math.max(0, obj.height - boxSize))) && 1 > tmpDst) {
                    if (!this.settings.aimbotWallBangs || !obj.penetrable || !this.me.weapon.pierce) { return false; }
                    penetrableWallsHit++;
                }
            }
            return penetrableWallsHit <= 1;
        }

        async waitFor(condition, timeout = Infinity) {
            const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            return new Promise(async (resolve, reject) => {
                if (typeof timeout != 'number') reject('Timeout argument not a number in waitFor');
                let result;
                while (result === undefined || result === false || result === null || result.length === 0) {
                    if ((timeout -= 100) < 0) { resolve(false); return; } await sleep(100);
                    result = typeof condition === 'string' ? Function(condition)() : condition();
                }
                resolve(result);
            });
        }

        lookDir(xDire, yDire) {
            this.controls.object.rotation.y = yDire;
            this.controls[this.vars.pchObjc].rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, xDire));
            this.controls.yDr = this.controls[this.vars.pchObjc].rotation.x % Math.PI;
            this.controls.xDr = this.controls.object.rotation.y % Math.PI;
            this.renderer.camera.updateProjectionMatrix();
            this.renderer.updateFrustum();
        }

        resetLookAt() {
            this.controls.object.rotation.y = this.controls.xDr;
            this.controls[this.vars.pchObjc].rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.controls.yDr));
            this.renderer.camera.updateProjectionMatrix();
            this.renderer.updateFrustum();
        }

        world2Screen(worldPosition) {
            if (!this.renderer?.camera || !this.overlay?.canvas) return null;
            this.tempVector.set(worldPosition.x, worldPosition.y, worldPosition.z);
            this.tempVector.project(this.renderer.camera);
            if (this.tempVector.z > 1) return null;
            return { x: (this.tempVector.x + 1) / 2 * this.overlay.canvas.width, y: (-this.tempVector.y + 1) / 2 * this.overlay.canvas.height };
        }

        drawCanvasESP(player, isBot) {
            if (this.settings.espTeamCheck && this.isTeam(player)) return;
            const playerPos = { x: player.x, y: player.y, z: player.z };
            const effectiveHeight = isBot ? player.dat.mSize : (player.height || this.PLAYER_HEIGHT) - ((player.crouchVal || 0) * this.CROUCH_FACTOR);
            const halfWidth = isBot ? (player.dat.mSize * 0.4) / 2 : this.PLAYER_WIDTH / 2;
            const corners = [
                { x: playerPos.x - halfWidth, y: playerPos.y, z: playerPos.z - halfWidth },
                { x: playerPos.x + halfWidth, y: playerPos.y, z: playerPos.z - halfWidth },
                { x: playerPos.x - halfWidth, y: playerPos.y, z: playerPos.z + halfWidth },
                { x: playerPos.x + halfWidth, y: playerPos.y, z: playerPos.z + halfWidth },
                { x: playerPos.x - halfWidth, y: playerPos.y + effectiveHeight, z: playerPos.z - halfWidth },
                { x: playerPos.x + halfWidth, y: playerPos.y + effectiveHeight, z: playerPos.z - halfWidth },
                { x: playerPos.x - halfWidth, y: playerPos.y + effectiveHeight, z: playerPos.z + halfWidth },
                { x: playerPos.x + halfWidth, y: playerPos.y + effectiveHeight, z: playerPos.z + halfWidth },
            ];

            let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity, onScreen = false;
            for (let i = 0; i < corners.length; i++) {
                const screenPos = this.world2Screen(corners[i]);
                if (screenPos) {
                    onScreen = true;
                    xmin = Math.min(xmin, screenPos.x);
                    xmax = Math.max(xmax, screenPos.x);
                    ymin = Math.min(ymin, screenPos.y);
                    ymax = Math.max(ymax, screenPos.y);
                }
            }
            if (!onScreen || !isFinite(xmin + xmax + ymin + ymax)) return;
            const boxWidth = xmax - xmin; const boxHeight = ymax - ymin;
            CRC2d.save.apply(this.ctx, []);

            if (this.settings.espLines) {
                const startX = this.overlay.canvas.width / 2, startY = this.overlay.canvas.height, endX = xmin + boxWidth / 2, endY = ymax, trailColor = isBot ? this.settings.botColor : this.settings.espColor;
                const hexToRgba = (hex, alpha) => { let r=0,g=0,b=0; if (hex.length == 7) { r=parseInt(hex.slice(1,3),16); g=parseInt(hex.slice(3,5),16); b=parseInt(hex.slice(5,7),16); } return `rgba(${r},${g},${b},${alpha})`; };
                const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
                gradient.addColorStop(0, hexToRgba(trailColor, 0.7)); gradient.addColorStop(1, hexToRgba(trailColor, 0));
                this.ctx.lineWidth = 2.5; this.ctx.strokeStyle = gradient; this.ctx.shadowColor = trailColor; this.ctx.shadowBlur = 15;
                CRC2d.beginPath.apply(this.ctx, []); CRC2d.moveTo.apply(this.ctx, [startX, startY]); CRC2d.lineTo.apply(this.ctx, [endX, endY]); CRC2d.stroke.apply(this.ctx, []);
            }

            if (this.settings.espSquare) {
                this.ctx.shadowColor = this.settings.boxColor; this.ctx.shadowBlur = 10; this.ctx.lineWidth = 1.5; this.ctx.strokeStyle = isBot ? this.settings.botColor : this.settings.boxColor;
                CRC2d.strokeRect.apply(this.ctx, [xmin, ymin, boxWidth, boxHeight]);
            }

            if (player.health && player.maxHealth) {
                const healthPercentage = Math.max(0, player.health / player.maxHealth);
                const barX = xmin - 7; const barY = ymin; const barWidth = 4; const barHeight = boxHeight;
                this.ctx.fillStyle = "rgba(0,0,0,0.5)"; CRC2d.fillRect.apply(this.ctx, [barX, barY, barWidth, barHeight]);
                this.ctx.fillStyle = healthPercentage > 0.75 ? "#43A047" : healthPercentage > 0.4 ? "#FDD835" : "#E53935";
                CRC2d.fillRect.apply(this.ctx, [barX, barY + barHeight * (1-healthPercentage), barWidth, barHeight * healthPercentage]);
                this.ctx.font = "bold 11px Rajdhani, sans-serif"; this.ctx.textAlign = "right"; this.ctx.fillStyle = "#FFFFFF";
                this.ctx.shadowColor = '#000000'; this.ctx.shadowBlur = 4;
                CRC2d.fillText.apply(this.ctx, [`♥ ${Math.round(player.health)}`, barX - 4, barY + 11]);
            }

            if (this.settings.espNameTags) {
                this.ctx.font = "bold 11px Rajdhani, sans-serif"; this.ctx.textAlign = "left";
                const padding = 4; const iconHeight = 16; const borderRadius = 4; let iconWidth = 0;
                const hasWeapon = player.weapon && player.weapon.name;
                let weaponIcon = null;
                if (hasWeapon && this.settings.espWeaponIcons && player.weapon.icon) {
                    if (!this.weaponIconCache) this.weaponIconCache = {};
                    const cacheKey = (player.weapon.melee ? 'melee_' : 'weapons_') + player.weapon.icon;
                    if (!this.weaponIconCache[cacheKey]) { this.weaponIconCache[cacheKey] = new Image(); this.weaponIconCache[cacheKey].src = `https://assets.krunker.io/textures/${player.weapon.melee ? 'melee' : 'weapons'}/${player.weapon.icon}.png`; }
                    weaponIcon = this.weaponIconCache[cacheKey];
                    if (weaponIcon.complete && weaponIcon.naturalWidth > 0) { iconWidth = weaponIcon.width * (iconHeight / weaponIcon.height); }
                }
                const namePart = isBot ? `[AI] ${player.name || 'Bot'}` : player.level ? `[LVL ${player.level}] ${player.name || 'Player'}` : `${player.name || 'Player'}`;
                const weaponPart = hasWeapon ? ` • ${player.weapon.name}` : '';
                const fullText = namePart + weaponPart;
                const fullTextWidth = this.ctx.measureText(fullText).width;
                const infoBoxWidth = fullTextWidth + (iconWidth > 0 ? iconWidth + padding : 0) + padding * 2;
                const infoBoxHeight = 20;
                const infoBoxX = (xmin + boxWidth / 2) - (infoBoxWidth / 2); const infoBoxY = ymin - infoBoxHeight - 5;

                if (this.settings.espInfoBackground) {
                    this.ctx.fillStyle = "rgba(25, 10, 30, 0.55)"; this.ctx.strokeStyle = isBot ? this.settings.botColor : this.settings.boxColor;
                    this.ctx.lineWidth = 1; this.ctx.shadowColor = isBot ? this.settings.botColor : this.settings.boxColor; this.ctx.shadowBlur = 6;
                    CRC2d.beginPath.apply(this.ctx, []);
                    CRC2d.moveTo.apply(this.ctx, [infoBoxX + borderRadius, infoBoxY]);
                    CRC2d.lineTo.apply(this.ctx, [infoBoxX + infoBoxWidth - borderRadius, infoBoxY]);
                    CRC2d.arcTo.apply(this.ctx, [infoBoxX + infoBoxWidth, infoBoxY, infoBoxX + infoBoxWidth, infoBoxY + borderRadius, borderRadius]);
                    CRC2d.lineTo.apply(this.ctx, [infoBoxX + infoBoxWidth, infoBoxY + infoBoxHeight - borderRadius]);
                    CRC2d.arcTo.apply(this.ctx, [infoBoxX + infoBoxWidth, infoBoxY + infoBoxHeight, infoBoxX + infoBoxWidth - borderRadius, infoBoxY + infoBoxHeight, borderRadius]);
                    CRC2d.lineTo.apply(this.ctx, [infoBoxX + borderRadius, infoBoxY + infoBoxHeight]);
                    CRC2d.arcTo.apply(this.ctx, [infoBoxX, infoBoxY + infoBoxHeight, infoBoxX, infoBoxY + infoBoxHeight - borderRadius, borderRadius]);
                    CRC2d.lineTo.apply(this.ctx, [infoBoxX, infoBoxY + borderRadius]);
                    CRC2d.arcTo.apply(this.ctx, [infoBoxX, infoBoxY, infoBoxX + borderRadius, infoBoxY, borderRadius]);
                    CRC2d.closePath.apply(this.ctx, []); CRC2d.fill.apply(this.ctx, []); CRC2d.stroke.apply(this.ctx, []);
                }
                this.ctx.fillStyle = "#FFFFFF";
                if (this.settings.espInfoBackground) { this.ctx.shadowColor = '#ff008080'; this.ctx.shadowBlur = 4; }
                else { this.ctx.shadowColor = '#000000'; this.ctx.shadowBlur = 5; }
                CRC2d.fillText.apply(this.ctx, [fullText, infoBoxX + padding, infoBoxY + infoBoxHeight / 2 + 4]);
                if (weaponIcon && weaponIcon.complete && iconWidth > 0) { this.ctx.drawImage(weaponIcon, infoBoxX + padding + fullTextWidth + padding, infoBoxY + (infoBoxHeight - iconHeight) / 2, iconWidth, iconHeight); }
                this.ctx.shadowBlur = 0;
                const distance = Math.round(Math.sqrt((this.me.x-player.x)**2+(this.me.y-player.y)**2+(this.me.z-player.z)**2) / 10);
                this.ctx.textAlign = "center"; this.ctx.fillStyle = "#FFFFFF"; this.ctx.shadowColor = '#000000'; this.ctx.shadowBlur = 4;
                CRC2d.fillText.apply(this.ctx, [`[${distance}m]`, xmin + boxWidth / 2, ymax + 14]);
            }
            CRC2d.restore.apply(this.ctx, []);
        }
    }

    window[uniqueId] = new AimbaeShiro();

})('shiro_' + Math.random().toString(36).substring(2, 10), CanvasRenderingContext2D.prototype);
