// ==UserScript==
// @name         AimbaeShiro – Krunker.IO Cheat
// @name:tr      AimbaeShiro – Krunker.IO Hilesi
// @name:ja      AimbaeShiro – Krunker.IO チート
// @name:az      AimbaeShiro – Krunker.IO Hilesi
// @namespace    https://github.com/GameSketchers/AimbaeShiro
// @version      1.4.7
// @description    Krunker.io Cheat 2025: Anime Aimbot, ESP/Wallhack, Free Skins, Bhop Script. Working & updated mod menu.
// @description:tr Krunker.io Hile 2025: Anime Aimbot, ESP/Wallhack, Bedava Skinler, Bhop Script. Çalışan güncel mod menü.
// @description:ja Krunker.io チート 2025: アニメエイムボット、ESP/ウォールハック、無料スキン、Bhopスクリプト。動作中の最新MODメニュー。
// @description:az Krunker.io Hilesi 2025: Anime Aimbot, ESP/Wallhack, Pulsuz Skinlər, Bhop Skript. İşlək və güncəl mod menyu.
// @author       anonimbiri
// @match        *://krunker.io/*
// @match        *://*.browserfps.com/*
// @exclude      *://krunker.io/social*
// @exclude      *://krunker.io/editor*
// @exclude      *://krunker.io/viewer*
// @icon         https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png
// @grant        none
// @supportURL   https://github.com/GameSketchers/AimbaeShiro/issues/new?labels=bug&type=bug&template=bug_report.md&title=Bug+Report
// @homepage     https://github.com/GameSketchers/AimbaeShiro
// @run-at       document-start
// @tag          games
// @license      MIT
// @noframes
// ==/UserScript==

const cheatInstanceId = '_' + Math.random().toString(36).slice(2);

window[cheatInstanceId] = function() {
    'use strict';
    delete window[cheatInstanceId];

    class AimbaeShiro {
        constructor() {
            console.log("🌸 AimbaeShiro: Initializing...");
            this.uniqueId = 'shiro_' + Math.random().toString(36).substring(2, 10);
            window[this.uniqueId] = this;

            this.game = null;
            this.me = null;
            this.renderer = null;
            this.controls = null;
            this.overlay = null;
            this.ctx = null;
            this.socket = null;
            this.skins = null;
            this.scale = 1;
            this.three = null;
            this.notifyContainer = null;

            this.PLAYER_HEIGHT = 11;
            this.PLAYER_WIDTH = 4;
            this.CROUCH_FACTOR = 3;
            this.CAMERA_HEIGHT = 1.5;

            this.tempVector = null;
            this.cameraPos = null;

            this.isProxy = Symbol('isProxy');
            this.rightMouseDown = false;
            this.isBindingHotkey = false;
            this.currentBindingSetting = null;
            this.pressedKeys = new Set();

            this.defaultSettings = {
                aimbotEnabled: true,
                aimbotOnRightMouse: false,
                aimbotWallCheck: true,
                aimbotWallBangs: false,
                aimbotTeamCheck: true,
                autoFireEnabled: false,
                fovSize: 90,
                aimOffset: 0,
                drawFovCircle: true,
                espLines: true,
                espSquare: true,
                espNameTags: true,
                espWeaponIcons: true,
                espTeamCheck: true,
                wireframeEnabled: false,
                unlockSkins: true,
                bhopEnabled: false,
                menuVisible: true,
                espColor: "#ff0080",
                boxColor: "#ff0080",
                menuTopPx: null,
                menuLeftPx: null,
                autoNuke: false,
                antikick: true,
                autoReload: true,
            };
            this.defaultHotkeys = {
                toggleMenu: 'F2',
                aimbotEnabled: 'F3',
                espLines: 'F4',
                espSquare: 'F6',
                wireframeEnabled: 'F7',
                bhopEnabled: 'F8',
                autoFireEnabled: 'F9',
                aimbotWallCheck: 'F10',
                aimbotWallBangs: 'Insert',
                aimbotTeamCheck: 'F11',
                espTeamCheck: 'F12',
                espNameTags: 'Numpad1',
                espWeaponIcons: 'Numpad2',
                unlockSkins: 'Numpad3',
            };
            this.settings = {};
            this.hotkeys = {};

            try {
                this.loadSettings();
                this.initializeNotifierContainer();
                this.checkForUpdates();
                this.initializeGameHooks();
                this.createGUI();
                this.createMenuButton();
                this.addEventListeners();
                console.log("🌸 AimbaeShiro: Successfully Initialized!");
            } catch (error)
            {
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
                } catch (e) {
                    return null;
                }
            };

            const getLatestFromGreasyFork = async () => {
                try {
                    const res = await fetch('https://api.greasyfork.org/en/scripts/538607.json', { cache: 'no-store' });
                    if (!res.ok) throw new Error('GF latest failed');
                    const json = await res.json();
                    const version = (json && json.version) ? json.version : null;
                    const code_url = (json && json.code_url) ? json.code_url : null;
                    return { version, downloadUrl: code_url, source: 'greasyfork' };
                } catch (e) {
                    return null;
                }
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
                    onAction: () => {
                        try { window.open(url, '_blank', 'noopener'); } catch (e) { location.href = url; }
                    },
                    timeout: 0
                });
            }
        }

        compareVersionStrings(a, b) {
            const na = String(a || '').replace(/^v/i, '').split('.').map(x => parseInt(x, 10) || 0);
            const nb = String(b || '').replace(/^v/i, '').split('.').map(x => parseInt(x, 10) || 0);
            const len = Math.max(na.length, nb.length);
            for (let i = 0; i < len; i++) {
                const da = na[i] || 0, db = nb[i] || 0;
                if (da > db) return 1;
                if (da < db) return -1;
            }
            return 0;
        }

        initializeNotifierContainer() {
            let container = document.getElementById('anonimbiri-notify-wrap');
            if (!container) {
                container = document.createElement('div');
                container.id = 'anonimbiri-notify-wrap';
                document.documentElement.appendChild(container);
            }
            this.notifyContainer = container;
        }

        notify({ title = 'Notification', message = '', actionText, onAction, timeout = 6000 } = {}) {
            if (!this.notifyContainer) {
                console.error("🌸 AimbaeShiro: Notifier container not initialized.");
                return;
            }

            const card = document.createElement('div');
            card.className = 'anonimbiri-notify-card';

            setTimeout(() => card.classList.add('visible'), 10);

            const content = document.createElement('div');
            content.className = 'anonimbiri-notify-content';

            const logo = document.createElement('div');
            logo.className = 'anonimbiri-notify-logo';

            const texts = document.createElement('div');
            texts.className = 'anonimbiri-notify-texts';

            const titleEl = document.createElement('label');
            titleEl.className = 'anonimbiri-notify-title';
            titleEl.textContent = title;

            const messageEl = document.createElement('div');
            messageEl.className = 'anonimbiri-notify-message';
            messageEl.textContent = message;

            texts.append(titleEl, messageEl);
            content.append(logo, texts);

            const controls = document.createElement('div');
            controls.className = 'anonimbiri-notify-controls';

            if (actionText && typeof onAction === 'function') {
                const btn = document.createElement('div');
                btn.className = 'anonimbiri-notify-action-btn';
                btn.textContent = actionText;
                btn.addEventListener('click', (e) => { e.stopPropagation(); onAction(); dismiss(); });
                controls.appendChild(btn);
            }

            card.append(content, controls);
            this.notifyContainer.appendChild(card);

            let hideTimer;
            if (timeout > 0) hideTimer = setTimeout(dismiss, timeout);

            function dismiss() {
                clearTimeout(hideTimer);
                card.classList.remove('visible');
                setTimeout(() => card.remove(), 350);
            }

            return { dismiss };
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
                            cheatInstance.overlay = this;
                            cheatInstance.ctx = canvasValue.getContext('2d');
                            Object.defineProperty(this, 'render', {
                                set(originalRender) {
                                    this['_render'] = new Proxy(originalRender, {
                                        apply(target, thisArg, args) {
                                            ['scale', 'game', 'controls', 'renderer', 'me'].forEach((prop, i) => {
                                                cheatInstance[prop] = args[i];
                                            });
                                            Reflect.apply(...arguments);
                                            if (cheatInstance.me && cheatInstance.ctx) {
                                                cheatInstance.onRenderFrame();
                                            }
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
                        }
                        this['_value'] = value;
                    },
                    get() { return this['_value']; },
                },
                skins: {
                    set(skinsArray) {
                        this[originalSkinsSymbol] = skinsArray;
                        if (!this[localSkinsSymbol]) {
                            this[localSkinsSymbol] = Array.apply(null, Array(5e3)).map((_, i) => { return { ind: i, cnt: 0x1, }});
                        }
                        return skinsArray;
                    },
                    get() {
                        return cheatInstance.settings.unlockSkins && this.stats ? this[localSkinsSymbol] : this[originalSkinsSymbol];
                    },
                },
                events: {
                    configurable: true,
                    set(eventEmitter) {
                        this['_events'] = eventEmitter;
                        if (this.ahNum === 0) {
                            cheatInstance.socket = this;
                            cheatInstance.wsEvent = this._dispatchEvent.bind(this);
                            cheatInstance.wsSend = this.send.bind(this);
                            this.send = new Proxy(this.send, {
                                apply(target, thisArg, [type, ...message]) {
                                    if (type=="ah2") return;
                                    let data = message[0];
                                    if (type === 'en' && data) {
                                        cheatInstance.skins = { main: data[2][0], secondary: data[2][1], hat: data[3], body: data[4], knife: data[9], dye: data[14], waist: data[17] };
                                    }
                                    if(type === 'spry' && data){
                                        console.log(data);
                                        cheatInstance.spray = data;
                                        message[0] = 4577;
                                    }
                                    return target.apply(thisArg, [type, ...message]);
                                }
                            });

                            this._dispatchEvent = new Proxy(this._dispatchEvent, {
                                apply(target, thisArg, [eventName, ...eventData]) {
                                    if (eventName === 'error' && eventData[0][0].includes('Connection Banned')) {
                                        localStorage.removeItem('krunker_token');
                                        cheatInstance.notify({
                                            title: 'Banned',
                                            message: 'Due to a ban, you have been signed out.\nPlease connect to the game with a VPN.',
                                            timeout: 5000
                                        });
                                        console.log('🌸 AimbaeShiro: Due to a ban, you have been signed out, Please connect to the game with a VPN.');
                                    }
                                    if (cheatInstance.settings.unlockSkins && eventName === '0') {
                                        let playerData = eventData[0][0];
                                        let playerStride = 38;
                                        while (playerData.length % playerStride !== 0) playerStride++;
                                        for (let i = 0; i < playerData.length; i += playerStride) {
                                            if (playerData[i] === cheatInstance.socket.socketId || 0) {
                                                playerData[i + 12] = [cheatInstance.skins.main, cheatInstance.skins.secondary];
                                                playerData[i + 13] = cheatInstance.skins.hat;
                                                playerData[i + 14] = cheatInstance.skins.body;
                                                playerData[i + 19] = cheatInstance.skins.knife;
                                                playerData[i + 24] = cheatInstance.skins.dye;
                                                playerData[i + 33] = cheatInstance.skins.waist;
                                            }
                                        }
                                    }
                                    if (cheatInstance.settings.unlockSkins && eventName === 'sp') {
                                        eventData[0][1] = cheatInstance.spray;
                                    }
                                    return target.apply(thisArg, [eventName, ...eventData]);
                                }
                            });
                        }
                    },
                    get() { return this['_events']; },
                },
                premiumT: {
                    set(value) { return value; },
                    get() { return cheatInstance.settings.unlockSkins; }
                },
                idleTimer: {
                    enumerable: false,
                    get() { return cheatInstance.settings.antikick ? 0 : this['_idleTimer']; },
                    set(value) { this['_idleTimer'] = value; },
                },
                kickTimer: {
                    enumerable: false,
                    get() { return cheatInstance.settings.antikick ? Infinity : this['_kickTimer']; },
                    set(value) { this['_kickTimer'] = value; },
                },
                cnBSeen: {
                    set(value) { this.inView = value; },
                    get() {
                        const isEnemy = !this.team || (cheatInstance.me && this.team !== cheatInstance.me.team);
                        return isEnemy && (cheatInstance.settings.espSquare || cheatInstance.settings.espNameTags) ? false : this.inView;
                    },
                },
                canBSeen: {
                    set(value) { this.inViewBot = value; },
                    get() {
                        const isEnemy = !this.team || (cheatInstance.me && this.team !== cheatInstance.me.team);
                        return isEnemy && (cheatInstance.settings.espSquare || cheatInstance.settings.espNameTags) ? false : this.inViewBot;
                    },
                },
            });
        }

        onRenderFrame() {
            if (!this.three || !this.renderer?.camera || !this.me) return;

            if (this.me.procInputs && !this.me.procInputs[this.isProxy]) {
                const originalProcInputs = this.me.procInputs;
                this.me.procInputs = new Proxy(originalProcInputs, {
                    apply: (target, thisArg, args) => {
                        if (thisArg) {
                            this.onProcessInputs(args[0], thisArg);
                        }
                        return Reflect.apply(target, thisArg, args);
                    },
                    get: (target, prop) => {
                        if (prop === this.isProxy) return true;
                        return Reflect.get(target, prop);
                    }
                });
            }

            if (this.renderer.scene) {
                this.renderer.scene.traverse(child => {
                    if (child.material && child.type == 'Mesh' && child.name != '' && child.isObject3D && !child.isModel && child.isMesh){
                        if (Array.isArray(child.material)) {
                            for (const material of child.material) material.wireframe = this.settings.wireframeEnabled;
                        } else child.material.wireframe = this.settings.wireframeEnabled;
                    }
                });
            }

            const original_strokeStyle = this.ctx.strokeStyle;
            const original_lineWidth = this.ctx.lineWidth;
            const original_font = this.ctx.font;
            const original_fillStyle = this.ctx.fillStyle;

            let CRC2d = CanvasRenderingContext2D.prototype

            CRC2d.save.apply(this.ctx, []);

            if (this.settings.fovSize > 0 && this.settings.drawFovCircle && !this.settings.menuVisible) {
                const centerX = this.overlay.canvas.width / 2;
                const centerY = this.overlay.canvas.height / 2;
                const radius = this.settings.fovSize;

                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = 'rgba(255, 0, 128, 0.7)';
                this.ctx.shadowColor = 'rgba(255, 0, 128, 1)';
                this.ctx.shadowBlur = 10;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }

            for (const player of this.game.players.list) {
                if (player.isYou || !player.active || !player.objInstances) continue;
                this.drawCanvasESP(player, CRC2d);
            }

            CRC2d.restore.apply(this.ctx, []);

            this.ctx.strokeStyle = original_strokeStyle;
            this.ctx.lineWidth = original_lineWidth;
            this.ctx.font = original_font;
            this.ctx.fillStyle = original_fillStyle;
        }

        onProcessInputs(inputPacket, player) {
            const gameInputIndices = { frame: 0, delta: 1, xdir: 2, ydir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12 };

            if (this.settings.bhopEnabled && this.pressedKeys.has('Space')) {
                this.controls.keys[this.controls.binds.jump.val] ^= 1;
                if (this.controls.keys[this.controls.binds.jump.val]) {
                    this.controls.didPressed[this.controls.binds.jump.val] = 1;
                }

                if (this.me.velocity.y < -0.03 && this.me.canSlide) {
                    setTimeout(() => { this.controls.keys[this.controls.binds.crouch.val] = 0; }, this.me.slideTimer || 325);
                    this.controls.keys[this.controls.binds.crouch.val] = 1;
                    this.controls.didPressed[this.controls.binds.crouch.val] = 1;
                }
            }

            if (this.settings.autoNuke && Object.keys(this.me.streaks).length && this.socket?.send) {
                this.socket.send('k', 0);
            }

            if (this.settings.autoReload && this.me.weapon.secondary !== undefined && this.me.weapon.secondary !== null && this.me.ammos[this.me.weapon.secondary ? 1 : 0] === 0 && this.me.reloadTimer === 0) {
                this.game.players.reload(this.me);
                inputPacket[gameInputIndices.reload] = 1;
            }

            // Aimbot
            let target = null;
            if (this.settings.aimbotEnabled && (!this.settings.aimbotOnRightMouse || this.rightMouseDown)) {
                let potentialTargets = this.game.players.list
                .filter(p => this.isDefined(p) && !p.isYou && p.active && p.health > 0 && (!this.settings.aimbotTeamCheck || !this.isTeam(p)) && (!this.settings.aimbotWallCheck || this.getCanSee(p)))
                .sort((a, b) => this.getDistance(this.me, a) - this.getDistance(this.me, b));

                if (this.settings.fovSize > 0) {
                    const fovRadius = this.settings.fovSize;
                    const centerX = this.overlay.canvas.width / 2;
                    const centerY = this.overlay.canvas.height / 2;

                    potentialTargets = potentialTargets.filter(p => {
                        const screenPos = this.world2Screen(new this.three.Vector3(p.x, p.y, p.z));
                        if (!screenPos) return false;

                        const dist = Math.sqrt(Math.pow(screenPos.x - centerX, 2) + Math.pow(screenPos.y - centerY, 2));
                        return dist <= fovRadius;
                    });
                }

                target = potentialTargets[0] || null;
            }

            if (target && this.me.weapon.secondary !== undefined && this.me.weapon.secondary !== null && !this.me.weapon.melee) {
                const yDire = (this.getDirection(this.me.z, this.me.x, target.z, target.x) || 0);
                const xDire = ((this.getXDirection(this.me.x, this.me.y, this.me.z, target.x, target.y - target.crouchVal * 3 + this.me.crouchVal * 3 + this.settings.aimOffset, target.z) || 0) - (0.3 * this.me.recoilAnimY));

                this.lookDir(yDire, xDire);

                // süper silet için
                /*inputPacket[gameInputIndices.ydir] = yDire;
                inputPacket[gameInputIndices.xdir] = xDire;*/

                if (this.settings.autoFireEnabled) {
                    if (!this.me.weapon.noAim) inputPacket[gameInputIndices.scope] = 1;
                    if ((this.me.weapon.noAim || this.me.aimVal === 0) && this.me.reloadTimer === 0 && !this.me.didShoot) inputPacket[gameInputIndices.shoot] = 1;
                }
            } else if (target && this.me.weapon.melee) {
                const yDire = (this.getDirection(this.me.z, this.me.x, target.z, target.x) || 0);
                const xDire = ((this.getXDirection(this.me.x, this.me.y, this.me.z, target.x, target.y - target.crouchVal * 3 + this.me.crouchVal * 3 + this.settings.aimOffset, target.z) || 0) - (0.3 * this.me.recoilAnimY));

                const distance = this.getDistance(this.me, target);

                const closeRange = 17.610595881164134;
                const throwRange = 65.24113971486675;

                if (distance <= closeRange) {
                    this.lookDir(yDire, xDire);

                    if (this.settings.autoFireEnabled && this.me.reloadTimer === 0 && !this.me.didShoot && this.me.aimVal === 0) {
                        inputPacket[gameInputIndices.shoot] = 1;
                    }
                } else if (distance <= throwRange && this.me.weapon.canThrow) {
                    this.lookDir(yDire, xDire);

                    if (this.settings.autoFireEnabled) {
                        inputPacket[gameInputIndices.scope] = 1;
                        if(this.me.aimVal === 0 && this.me.reloadTimer === 0 && !this.me.didShoot){inputPacket[gameInputIndices.shoot] = 1;}
                    }
                }
            }
        }

        createGUI() {
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap';
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);

            const animeFontLink = document.createElement('link');
            animeFontLink.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&display=swap';
            animeFontLink.rel = 'stylesheet';
            document.head.appendChild(animeFontLink);

            const menuCSS = `
             .anonimbiri-menu-container{font-family:'Orbitron',monospace;position:fixed;width:90vw;max-width:500px;background:rgba(10,10,10,.95);border:2px solid #ff0080;border-radius:15px;box-shadow:0 0 30px rgba(255,0,128,.5),inset 0 0 20px rgba(255,0,128,.1);backdrop-filter:blur(10px);animation:anonimbiri-menuGlow 2s ease-in-out infinite alternate,anonimbiri-slideIn .5s ease-out;user-select:none;z-index:1000;display:none;opacity:0;transition:opacity .3s ease-out,transform .3s ease-out}
             .anonimbiri-menu-container.visible{display:block;opacity:1}
             @keyframes anonimbiri-menuGlow{from{box-shadow:0 0 30px rgba(255,0,128,.3),inset 0 0 20px rgba(255,0,128,.1)}to{box-shadow:0 0 50px rgba(255,0,128,.6),inset 0 0 30px rgba(255,0,128,.2)}}
             @keyframes anonimbiri-slideIn{from{opacity:0;transform:translateY(-20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
             .anonimbiri-menu-header{height:250px;background:linear-gradient(45deg,#ff0080,#ff4da6);border-radius:13px 13px 0 0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;cursor:grab}
             .anonimbiri-menu-header:active{cursor:grabbing}
             .anonimbiri-menu-header::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background-image:url(https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/banner.jpeg);background-size:cover;background-position:center;opacity:.8;z-index:1;animation:anonimbiri-bannerShift 10s ease-in-out infinite}
             @keyframes anonimbiri-bannerShift{0%,100%{transform:scale(1.05) rotate(-1deg)}50%{transform:scale(1.1) rotate(1deg)}}
             .anonimbiri-menu-header::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(45deg,rgba(255,0,128,.3),rgba(255,77,166,.3));z-index:2}
             .anonimbiri-tab-container{display:flex;background:rgba(20,20,20,.9);border-bottom:1px solid #ff0080}
             .anonimbiri-tab{flex:1;padding:12px;background:rgba(30,30,30,.8);color:#ff0080;text-align:center;cursor:pointer;transition:all .3s ease;font-weight:700;font-size:12px;letter-spacing:1px;border-right:1px solid rgba(255,0,128,.3);position:relative;overflow:hidden}
             .anonimbiri-tab::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);transition:left .5s ease}
             .anonimbiri-tab:hover::before{left:100%}
             .anonimbiri-tab:last-child{border-right:none}
             .anonimbiri-tab:hover{background:rgba(255,0,128,.2);color:#fff;transform:translateY(-2px)}
             .anonimbiri-tab.active{background:linear-gradient(45deg,#ff0080,#ff4da6);color:#fff;box-shadow:0 2px 10px rgba(255,0,128,.5)}
             .anonimbiri-tab-content{padding:15px;max-height:calc(100vh - 350px);min-height:150px;overflow-y:auto}
             .anonimbiri-tab-pane{display:none}
             .anonimbiri-tab-pane.active{display:block;animation:anonimbiri-fadeIn .3s ease}
             @keyframes anonimbiri-fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
             .anonimbiri-menu-item{display:flex;justify-content:space-between;align-items:center;padding:10px 15px;margin:8px 0;background:rgba(30,30,30,.8);border:1px solid rgba(255,0,128,.3);border-radius:8px;transition:all .3s ease;cursor:pointer;position:relative;overflow:hidden}
             .anonimbiri-menu-item::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,0,128,.1),transparent);transition:left .5s ease}
             .anonimbiri-menu-item:hover::before{left:100%}
             .anonimbiri-menu-item:hover{background:rgba(255,0,128,.1);border-color:#ff0080;transform:translateX(5px) scale(1.02);box-shadow:0 5px 15px rgba(255,0,128,.3)}
             .anonimbiri-menu-item.active{background:rgba(255,0,128,.2);border-color:#ff0080}
             .anonimbiri-menu-item-content{display:flex;align-items:center;gap:12px}
             .anonimbiri-menu-item-icon{width:20px;height:20px;stroke:#ff4da6;fill:none;stroke-width:1.8;transition:all .3s ease;stroke-linecap:round;stroke-linejoin:round}
             .anonimbiri-menu-item:hover .anonimbiri-menu-item-icon{stroke:#ff0080;transform:scale(1.08)}
             .anonimbiri-menu-item label{color:#ff4da6;font-weight:700;font-size:14px;letter-spacing:1px;cursor:pointer;transition:color .3s ease}
             .anonimbiri-menu-item:hover label{color:#ff0080}
             .anonimbiri-controls{display:flex;align-items:center;gap:10px}
             .anonimbiri-toggle-switch{position:relative;width:50px;height:24px;background:rgba(40,40,40,.8);border-radius:12px;pointer-events:none;transition:all .3s ease;border:1px solid rgba(255,0,128,.3)}
             .anonimbiri-toggle-switch::before{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;background:#666;border-radius:50%;transition:all .3s cubic-bezier(.68,-.55,.265,1.55);box-shadow:0 2px 5px rgba(0,0,0,.3)}
             .anonimbiri-toggle-switch.active{background:linear-gradient(45deg,#ff0080,#ff4da6);box-shadow:0 0 15px rgba(255,0,128,.5)}
             .anonimbiri-toggle-switch.active::before{left:28px;background:#fff}
             .anonimbiri-color-container{position:relative}
             .anonimbiri-color-picker-input{opacity:0;position:absolute;width:40px;height:24px;cursor:pointer}
             .anonimbiri-color-preview{width:40px;height:24px;border:1px solid #ff0080;border-radius:4px;pointer-events:none;transition:all .3s ease}
             .anonimbiri-menu-item:hover .anonimbiri-color-preview{transform:scale(1.1);box-shadow:0 0 10px rgba(255,0,128,.7)}
             .anonimbiri-hotkey{background:rgba(255,0,128,.2);color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;border:1px solid #ff0080;pointer-events:none;min-width:40px;text-align:center}
             .anonimbiri-menu-item:hover .anonimbiri-hotkey{background:#ff0080;transform:scale(1.05)}
             .anonimbiri-tab-content::-webkit-scrollbar{width:8px}
             .anonimbiri-tab-content::-webkit-scrollbar-track{background:rgba(20,20,20,.5);border-radius:4px}
             .anonimbiri-tab-content::-webkit-scrollbar-thumb{background:#ff0080;border-radius:4px}
             .anonimbiri-tab-content::-webkit-scrollbar-thumb:hover{background:#ff4da6}
             .anonimbiri-close-btn{position:absolute;top:10px;right:15px;color:#fff;font-size:20px;cursor:pointer;z-index:4;width:25px;height:25px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);border-radius:50%;transition:all .3s ease}
             .anonimbiri-close-btn svg{width:16px;height:16px;fill:#fff}
             .anonimbiri-close-btn:hover{background:#ff0080;transform:rotate(90deg) scale(1.1)}
             .anonimbiri-hotkey-modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);display:none;align-items:center;justify-content:center;z-index:2000;animation:anonimbiri-fadeIn .3s ease}
             .anonimbiri-hotkey-modal.active{display:flex}
             .anonimbiri-hotkey-content{background:linear-gradient(135deg,#1a1a1a,#2a1a2a);padding:40px;border-radius:15px;border:2px solid #ff0080;box-shadow:0 0 50px rgba(255,0,128,.7);text-align:center;animation:anonimbiri-modalPulse .5s ease-out}
             @keyframes anonimbiri-modalPulse{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}
             .anonimbiri-hotkey-content h2{color:#ff0080;font-size:24px;margin-bottom:20px;letter-spacing:2px}
             .anonimbiri-hotkey-content p{color:#fff;font-size:16px;margin-bottom:30px}
             .anonimbiri-hotkey-content p span{color:#ff4da6;font-weight:700}
             #shiro-menu-button{height:80px;background-color:rgba(255,0,128,.05);border:1px solid rgba(255,0,128,.5);cursor:pointer;background-image:url('https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png');background-size:contain;background-position:center;background-repeat:no-repeat;transition:all .3s ease}
             #shiro-menu-button:hover{background-color:rgba(255,0,128,.2);border-color:#ff0080;transform:scale(1.03);box-shadow:0 0 15px rgba(255,0,128,.5)}
             .anonimbiri-slider-container{display:flex;align-items:center;gap:10px;min-width:160px}
             .anonimbiri-slider{appearance:none;-webkit-appearance:none;width:140px;height:6px;background:linear-gradient(90deg,rgba(255,0,128,.35),rgba(255,77,166,.35));border:1px solid rgba(255,0,128,.35);border-radius:999px;outline:none;transition:box-shadow .2s ease}
             .anonimbiri-slider:hover{box-shadow:0 0 12px rgba(255,0,128,.45)}
             .anonimbiri-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid #ff0080;box-shadow:0 0 12px rgba(255,0,128,.6);cursor:pointer;transition:transform .15s ease}
             .anonimbiri-slider:active::-webkit-slider-thumb{transform:scale(1.08)}
             .anonimbiri-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid #ff0080;box-shadow:0 0 12px rgba(255,0,128,.6);cursor:pointer}
             .anonimbiri-slider::-moz-range-track{height:6px;background:linear-gradient(90deg,rgba(255,0,128,.35),rgba(255,77,166,.35));border:1px solid rgba(255,0,128,.35);border-radius:999px}
             .anonimbiri-slider-value{color:#fff;font-weight:800;letter-spacing:.5px;font-size:12px;min-width:40px;text-align:center;background:rgba(255,0,128,.18);border:1px solid rgba(255,0,128,.45);border-radius:6px;padding:3px 8px;box-shadow:inset 0 0 8px rgba(255,0,128,.35)}
             .anonimbiri-menu-item:hover .anonimbiri-slider-value{background:#ff0080}
             #anonimbiri-notify-wrap{position:fixed;top:16px;right:16px;z-index:20000;display:flex;flex-direction:column;gap:10px}
             .anonimbiri-notify-card{font-family:'Orbitron',monospace;display:flex;justify-content:space-between;align-items:center;padding:10px 15px;background:rgba(30,30,30,.9);border:1px solid rgba(255,0,128,.6);border-radius:8px;backdrop-filter:blur(6px);width:min(92vw,360px);cursor:default;transform:translateX(calc(100% + 20px));opacity:0;transition:transform .35s ease,opacity .35s ease,box-shadow .3s ease}
             .anonimbiri-notify-card.visible{transform:translateX(0);opacity:1;box-shadow:0 10px 25px rgba(255,0,128,.3)}
             .anonimbiri-notify-content{display:flex;align-items:center;gap:12px;min-width:0}
             .anonimbiri-notify-logo{width:40px;height:40px;flex:0 0 40px;background-image:url('https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png');background-size:cover;background-position:center}
             .anonimbiri-notify-texts{display:flex;flex-direction:column;gap:4px;min-width:0}
             .anonimbiri-notify-title{color:#fff;font-weight:800;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px}
             .anonimbiri-notify-message{color:#ddd;font-size:10px;line-height:1.5;white-space:normal;word-break:break-word}
             .anonimbiri-notify-controls{display:flex;align-items:center;gap:8px;padding-left:5px}
             .anonimbiri-notify-action-btn{background:rgba(255,0,128,.2);color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;border:1px solid #ff0080;min-width:40px;text-align:center;cursor:pointer;transition:all .2s ease}
             .anonimbiri-notify-action-btn:hover{background:#ff0080;transform:scale(1.05)}
             `;

            const style = document.createElement('style');
            style.textContent = menuCSS;
            document.head.appendChild(style);

            const neonIcons = {
                aimbot: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
                rightMouse: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 6v4"/>',
                wallCheck: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 12h16M8 6v12M16 6v12"/>',
                wallbangs: '<rect x="2" y="2" width="2" height="20" rx="1"/><path d="M4 2l10 3v16L4 18V2z"/><circle cx="12" cy="12" r="1"/><path d="M16 12h6m-3-2l2 2-2 2"/>',
                wallbangsWireframe: '<path d="M12 3l8 4v10l-8 4-8-4V7l8-4z"/><path d="M12 3v18"/><path d="M20 7l-8 4-8-4"/><path d="M4 11l8 4 8-4"/>',
                teamCheck: '<path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
                autoFire: '<path d="M13 3L6 12h4l-2 9 8-12h-4l1-6z"/>',
                espLines: '<circle cx="12" cy="12" r="9"/><path d="M12 12l6-6M12 12h9M12 12v9"/>',
                espSquare: '<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>',
                nameTags: '<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M12 10h6M12 14h6"/>',
                weaponIcons: '<path d="M7 7l2-2 2 2v10H7z"/><path d="M13 7l2-2 2 2v10h-4z"/>',
                colorPicker: '<path d="M12 4a8 8 0 1 0 0 16 3 3 0 0 0 0-6h-2a3 3 0 1 1 0-6h2"/><circle cx="8.5" cy="9.5" r="1"/><circle cx="11.5" cy="8" r="1"/><circle cx="15.5" cy="9.5" r="1"/><circle cx="9.5" cy="13.5" r="1"/>',
                wireframe: '<path d="M12 3l8 4v10l-8 4-8-4V7l8-4z"/><path d="M12 3v18M20 7l-8 4-8-4"/>',
                unlockSkins: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0"/><circle cx="12" cy="16" r="1"/><path d="M12 17v2"/>',
                bunnyHop: '<path d="M6 16l6-6 6 6"/><path d="M6 10h12"/>',
                autoNuke: '<circle cx="12" cy="12" r="2"/><path d="M12 4v4l-3 2"/><path d="M20 12h-4l-2-3"/><path d="M12 20v-4l3-2"/>',
                antiKick: '<path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z"/><path d="M8 8l8 8"/>',
                autoReload: '<path d="M20 12a8 8 0 1 1-2-5.3"/><path d="M20 5v6h-6"/>',
                hotkeys: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M6 10h12M6 13h12"/>',
                fov: '<circle cx="12" cy="12" r="9"/><path d="M12 12l8-3M12 12l8 3"/><circle cx="12" cy="12" r="1.2"/>'
            };

            const menuHTML = `
             <div class="anonimbiri-menu-container" id="anonimbiri-cheatMenu">
                 <div class="anonimbiri-menu-header" id="anonimbiri-menuHeader">
                 <div class="anonimbiri-close-btn" id="anonimbiri-closeBtn">
                     <svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
                 </div>
                 </div>

                 <div class="anonimbiri-tab-container">
                 <div class="anonimbiri-tab active" data-tab="aimbot">AIMBOT</div>
                 <div class="anonimbiri-tab" data-tab="esp">ESP</div>
                 <div class="anonimbiri-tab" data-tab="misc">MISC</div>
                 <div class="anonimbiri-tab" data-tab="hotkeys">HOTKEYS</div>
                 </div>

                 <div class="anonimbiri-tab-content">
                 <div class="anonimbiri-tab-pane active" id="anonimbiri-tab-aimbot">
                     ${this.createMenuItemHTML('toggle','aimbotEnabled','Aimbot Enabled', neonIcons.aimbot)}
                     ${this.createMenuItemHTML('toggle','aimbotOnRightMouse','Right Mouse Trigger', neonIcons.rightMouse)}
                     ${this.createMenuItemHTML('toggle','aimbotWallCheck','Wall Check', neonIcons.wallCheck)}
                     ${this.createMenuItemHTML('toggle','aimbotWallBangs','WallBangs', neonIcons.wallbangs)}
                     ${this.createMenuItemHTML('toggle','aimbotTeamCheck','Team Check', neonIcons.teamCheck)}
                     ${this.createMenuItemHTML('toggle','autoFireEnabled','Auto Fire', neonIcons.autoFire)}
                     ${this.createMenuItemHTML('slider','fovSize','FOV Size', neonIcons.fov)}
                     ${this.createMenuItemHTML('toggle','drawFovCircle','Draw FOV Circle', neonIcons.espSquare)}
                 </div>

                 <div class="anonimbiri-tab-pane" id="anonimbiri-tab-esp">
                     ${this.createMenuItemHTML('toggle','espTeamCheck','Team Check', neonIcons.teamCheck)}
                     ${this.createMenuItemHTML('toggle','espLines','Energy Trail ESP', neonIcons.espLines)}
                     ${this.createMenuItemHTML('toggle','espSquare','Glowing Box ESP', neonIcons.espSquare)}
                     ${this.createMenuItemHTML('toggle','espNameTags','Full Info (Name/HP/Wpn)', neonIcons.nameTags)}
                     ${this.createMenuItemHTML('toggle','espWeaponIcons','Show Weapon (in Full Info)', neonIcons.weaponIcons)}
                     ${this.createMenuItemHTML('color','espColor','Trail Color', neonIcons.colorPicker)}
                     ${this.createMenuItemHTML('color','boxColor','Box & Info Color', neonIcons.colorPicker)}
                 </div>

                 <div class="anonimbiri-tab-pane" id="anonimbiri-tab-misc">
                     ${this.createMenuItemHTML('toggle','wireframeEnabled','Wireframe', neonIcons.wireframe)}
                     ${this.createMenuItemHTML('toggle','unlockSkins','Unlock All Skins', neonIcons.unlockSkins)}
                     ${this.createMenuItemHTML('toggle','bhopEnabled','Bunny Hop', neonIcons.bunnyHop)}
                     ${this.createMenuItemHTML('toggle','autoNuke','Auto Nuke', neonIcons.autoNuke)}
                     ${this.createMenuItemHTML('toggle','antikick','Anti Kick', neonIcons.antiKick)}
                     ${this.createMenuItemHTML('toggle','autoReload','Auto Reload', neonIcons.autoReload)}
                 </div>

                 <div class="anonimbiri-tab-pane" id="anonimbiri-tab-hotkeys">
                     ${this.createMenuItemHTML('hotkey','toggleMenu','Toggle Menu', neonIcons.hotkeys)}
                     ${this.createMenuItemHTML('hotkey','aimbotEnabled','Toggle Aimbot', neonIcons.aimbot)}
                     ${this.createMenuItemHTML('hotkey','aimbotWallCheck','Toggle Wall Check', neonIcons.wallCheck)}
                     ${this.createMenuItemHTML('hotkey','aimbotWallBangs','Toggle WallBangs', neonIcons.wallbangs)}
                     ${this.createMenuItemHTML('hotkey','aimbotTeamCheck','Toggle Aimbot Team', neonIcons.teamCheck)}
                     ${this.createMenuItemHTML('hotkey','espTeamCheck','Toggle ESP Team', neonIcons.teamCheck)}
                     ${this.createMenuItemHTML('hotkey','espNameTags','Toggle Full Info', neonIcons.nameTags)}
                     ${this.createMenuItemHTML('hotkey','espWeaponIcons','Toggle Weapon Icon', neonIcons.weaponIcons)}
                     ${this.createMenuItemHTML('hotkey','autoFireEnabled','Toggle Auto Fire', neonIcons.autoFire)}
                     ${this.createMenuItemHTML('hotkey','espLines','Toggle Energy Trail', neonIcons.espLines)}
                     ${this.createMenuItemHTML('hotkey','espSquare','Toggle Glowing Box', neonIcons.espSquare)}
                     ${this.createMenuItemHTML('hotkey','wireframeEnabled','Toggle Wireframe', neonIcons.wireframe)}
                     ${this.createMenuItemHTML('hotkey','unlockSkins','Toggle Unlock Skins', neonIcons.unlockSkins)}
                     ${this.createMenuItemHTML('hotkey','bhopEnabled','Toggle Bunny Hop', neonIcons.bunnyHop)}
                 </div>
                 </div>
             </div>`;

            const hotkeyModalHTML = `
             <div class="anonimbiri-hotkey-modal" id="anonimbiri-hotkeyModal">
                 <div class="anonimbiri-hotkey-content">
                     <h2>Assign Hotkey</h2>
                     <p>Press any key to assign it to <span id="anonimbiri-hotkeyFeatureName">...</span></p>
                     <p>(Press ESC to cancel)</p>
                 </div>
             </div>`;

            const container = document.createElement('div');
            container.innerHTML = menuHTML + hotkeyModalHTML;
            document.body.appendChild(container);

            this.gui = document.getElementById('anonimbiri-cheatMenu');
            this.hotkeyModal = document.getElementById('anonimbiri-hotkeyModal');

            if (this.settings.menuLeftPx !== null && this.settings.menuTopPx !== null) {
                this.gui.style.left = `${this.settings.menuLeftPx}px`;
                this.gui.style.top = `${this.settings.menuTopPx}px`;
            } else {
                setTimeout(() => {
                    const t = this.gui.getBoundingClientRect();
                    this.gui.style.left = `calc(50% - ${t.width / 2}px)`;
                    this.gui.style.top = `calc(50% - ${t.height / 2}px)`;
                    const e = this.gui.getBoundingClientRect();
                    this.settings.menuLeftPx = e.left;
                    this.settings.menuTopPx = e.top;
                    this.saveSettings('aimbaeshiro_settings', this.settings);
                }, 100);
            }

            if (this.settings.menuVisible) this.gui.classList.add('visible');

            this.updateAllGUIElements();
            this.makeMenuDraggable();
            this.bindSliderUI();
        }

        createMenuItemHTML(type, setting, label, iconPath) {
            let controlHTML = '';
            const iconSVG = `<svg class="anonimbiri-menu-item-icon" viewBox="0 0 24 24">${iconPath}</svg>`;
            switch (type) {
                case 'toggle':
                    controlHTML = `<div class="anonimbiri-toggle-switch"></div>`;
                    break;
                case 'color':
                    controlHTML = `<div class="anonimbiri-color-container">
                         <input type="color" class="anonimbiri-color-picker-input" data-setting="${setting}">
                         <div class="anonimbiri-color-preview" data-setting="${setting}"></div>
                     </div>`;
                    break;
                case 'hotkey':
                    controlHTML = `<div class="anonimbiri-hotkey" data-hotkey="${setting}"></div>`;
                    break;
                case 'slider':
                    const val = (this.settings && typeof this.settings[setting] !== 'undefined') ? this.settings[setting] : 0;
                    controlHTML = `<div class="anonimbiri-slider-container" data-setting="${setting}">
                         <input type="range" class="anonimbiri-slider" data-setting="${setting}" min="0" max="300" step="1" value="${val}">
                         <div class="anonimbiri-slider-value" data-setting="${setting}">${val <= 0 ? 'Off' : val}</div>
                     </div>`;
                    break;
            }
            return `<div class="anonimbiri-menu-item" data-setting="${setting}">
                 <div class="anonimbiri-menu-item-content">${iconSVG}<label>${label}</label></div>
                 <div class="anonimbiri-controls">${controlHTML}</div>
             </div>`;
        }

        bindSliderUI() {
            this.gui.querySelectorAll('.anonimbiri-slider').forEach(slider => {
                const setting = slider.dataset.setting;
                const valueDisplay = this.gui.querySelector(`.anonimbiri-slider-value[data-setting="${setting}"]`);

                slider.addEventListener('input', () => {
                    const value = slider.value;
                    this.settings[setting] = Number(value);
                    if (valueDisplay) {
                        valueDisplay.textContent = value <= 0 ? 'Off' : value;
                    }
                });

                slider.addEventListener('change', () => {
                    this.saveSettings('aimbaeshiro_settings', this.settings);
                    if (window.SOUND) window.SOUND.play('select_0', 0.1);
                });
            });
        }


        createMenuButton(){this.waitFor(()=>document.getElementById('menuItemContainer')).then(t=>{t&&!document.getElementById('shiro-menu-button')&&(t=>{const e=document.createElement('div');e.id='shiro-menu-button',e.className='menuItem',e.addEventListener('click',()=>{window.SOUND&&window.SOUND.play('select_0',.1),this.toggleMenuVisibility()}),t.prepend(e)})(t)})}

        addEventListeners() {
            window.addEventListener('pointerdown', (e) => { if (e.button === 2) this.rightMouseDown = true; });
            window.addEventListener('pointerup', (e) => { if (e.button === 2) this.rightMouseDown = false; });
            window.addEventListener('keydown', (e) => {
                this.pressedKeys.add(e.code);
                if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
                if (this.isBindingHotkey) {
                    e.preventDefault(); e.stopPropagation();
                    if (e.code === 'Escape') { this.hideHotkeyModal(); return; }
                    if (Object.values(this.hotkeys).includes(e.code)) { console.warn("🌸 AimbaeShiro: Key already assigned!"); return; }
                    this.hotkeys[this.currentBindingSetting] = e.code; this.saveSettings('aimbaeshiro_hotkeys', this.hotkeys); this.updateHotkeyButton(this.currentBindingSetting); this.hideHotkeyModal(); return;
                }
                const action = Object.keys(this.hotkeys).find(key => this.hotkeys[key] === e.code);
                if (action) {
                    if (action === 'toggleMenu') { this.toggleMenuVisibility(); }
                    else if (this.settings.hasOwnProperty(action)) { this.settings[action] = !this.settings[action]; this.saveSettings('aimbaeshiro_settings', this.settings); this.updateGUIToggle(action); }
                }
            });
            window.addEventListener('keyup', (e) => { this.pressedKeys.delete(e.code); });
            document.getElementById('anonimbiri-closeBtn').addEventListener('click', () => this.toggleMenuVisibility());
            this.gui.querySelector('.anonimbiri-tab-container').addEventListener('click', (e) => {
                if (e.target.classList.contains('anonimbiri-tab')) {
                    if (window.SOUND) window.SOUND.play('select_0', 0.1);
                    const tabName = e.target.dataset.tab;
                    this.gui.querySelectorAll('.anonimbiri-tab').forEach(t => t.classList.remove('active'));
                    this.gui.querySelectorAll('.anonimbiri-tab-pane').forEach(p => p.classList.remove('active'));
                    e.target.classList.add('active');
                    document.getElementById(`anonimbiri-tab-${tabName}`).classList.add('active');
                }
            });
            this.gui.addEventListener('click', (e) => {
                const menuItem = e.target.closest('.anonimbiri-menu-item');
                if (!menuItem) return;
                const setting = menuItem.dataset.setting;
                if (!setting || menuItem.querySelector('.anonimbiri-slider-container')) return;

                if (window.SOUND) window.SOUND.play('select_0', 0.1);

                if (menuItem.querySelector('.anonimbiri-toggle-switch')) {
                    this.settings[setting] = !this.settings[setting];
                    this.saveSettings('aimbaeshiro_settings', this.settings);
                    this.updateGUIToggle(setting);
                } else if (menuItem.querySelector('.anonimbiri-color-picker-input')) {
                    menuItem.querySelector('.anonimbiri-color-picker-input').click();
                } else if (menuItem.querySelector('.anonimbiri-hotkey')) {
                    this.showHotkeyModal(setting);
                }
            });
            this.gui.querySelectorAll('.anonimbiri-menu-item, .anonimbiri-tab, .anonimbiri-close-btn').forEach(el => { el.addEventListener('mouseenter', () => { if (window.SOUND) window.SOUND.play('hover_0', 0.1); }); });
            this.gui.querySelectorAll('.anonimbiri-color-picker-input').forEach(cp => cp.addEventListener('input', (e) => { this.settings[e.target.dataset.setting] = e.target.value; this.saveSettings('aimbaeshiro_settings', this.settings); this.updateGUIPicker(e.target.dataset.setting); }));
        }

        updateAllGUIElements() {
            Object.keys(this.settings).forEach(s => {
                if (s.toLowerCase().includes('color')) {
                    this.updateGUIPicker(s);
                } else if (typeof this.settings[s] === 'boolean') {
                    this.updateGUIToggle(s);
                }
            });
            Object.keys(this.hotkeys).forEach(h => this.updateHotkeyButton(h));
        }

        updateGUIToggle(settingName) {
            const item = this.gui.querySelector(`.anonimbiri-menu-item[data-setting="${settingName}"]`); if (!item) return; const toggle = item.querySelector('.anonimbiri-toggle-switch'); const isActive = this.settings[settingName]; item.classList.toggle('active', isActive); if (toggle) toggle.classList.toggle('active', isActive);
        }

        updateGUIPicker(settingName) {
            if (!settingName.toLowerCase().includes('color')) return; const picker = this.gui.querySelector(`input[type="color"][data-setting="${settingName}"]`); const preview = this.gui.querySelector(`.anonimbiri-color-preview[data-setting="${settingName}"]`); if (picker) picker.value = this.settings[settingName]; if (preview) preview.style.backgroundColor = this.settings[settingName];
        }

        updateHotkeyButton(settingName) { const b = this.gui.querySelector(`.anonimbiri-hotkey[data-hotkey="${settingName}"]`); if (b) b.textContent = this.hotkeys[settingName]?.replace('Key', '').replace('Digit', '') || 'N/A'; }

        toggleMenuVisibility() {
            this.settings.menuVisible = !this.settings.menuVisible; this.gui.classList.toggle('visible', this.settings.menuVisible); this.saveSettings('aimbaeshiro_settings', this.settings);
            if (this.settings.menuVisible) { if (window.SOUND) window.SOUND.play('tick_0', 0.1); let lock = document.pointerLockElement || document.mozPointerLockElement; if (lock) document.exitPointerLock(); }
        }

        showHotkeyModal(settingName) {
            if (!this.hotkeyModal) return;
            this.isBindingHotkey = true; this.currentBindingSetting = settingName; const labelEl = this.gui.querySelector(`.anonimbiri-menu-item[data-setting="${settingName}"] label`);
            const featureNameEl = document.getElementById('anonimbiri-hotkeyFeatureName');
            if (featureNameEl) featureNameEl.textContent = labelEl ? labelEl.textContent : settingName;
            this.hotkeyModal.classList.add('active');
        }

        hideHotkeyModal() { if (!this.hotkeyModal) return; this.isBindingHotkey = false; this.currentBindingSetting = null; this.hotkeyModal.classList.remove('active'); }

        makeMenuDraggable() {
            const header = document.getElementById("anonimbiri-menuHeader"); let isDragging = !1, offsetX, offsetY;
            const startDragging = e => { isDragging = !0; const t = this.gui.getBoundingClientRect(), o = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX, i = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY; offsetX = o - t.left, offsetY = i - t.top, document.addEventListener("mousemove", updatePosition), document.addEventListener("mouseup", stopDragging), document.addEventListener("touchmove", updatePosition, { passive: !1 }), document.addEventListener("touchend", stopDragging) }, updatePosition = e => { if (!isDragging) return; e.preventDefault(); const t = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX, o = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY; let i = t - offsetX, n = o - offsetY; const s = 5, a = this.gui.offsetWidth, r = this.gui.offsetHeight; i = Math.max(s, Math.min(i, window.innerWidth - a - s)), n = Math.max(s, Math.min(n, window.innerHeight - r - s)), this.gui.style.left = `${i}px`, this.gui.style.top = `${n}px` }, stopDragging = () => { isDragging = !1, document.removeEventListener("mousemove", updatePosition), document.removeEventListener("mouseup", stopDragging), document.removeEventListener("touchmove", updatePosition), document.removeEventListener("touchend", stopDragging); const e = this.gui.getBoundingClientRect(); this.settings.menuLeftPx = e.left, this.settings.menuTopPx = e.top, this.saveSettings("aimbaeshiro_settings", this.settings) };
            header.addEventListener("mousedown", startDragging), header.addEventListener("touchstart", startDragging, { passive: !1 });
        }

        isDefined(val) { return val !== undefined && val !== null; }
        isTeam(player) { return this.me && this.me.team ? this.me.team === player.team : false; }
        getDistance(p1, p2) { return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2)); }
        getDirection(z1, x1, z2, x2) { return Math.atan2(x1 - x2, z1 - z2); }
        getXDirection(t,e,o,i,s,n){const r=s-e,a=this.getDistance({x:t,y:e,z:o},{x:i,y:s,z:n});return Math.asin(r/a)}

        lineInRect(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2) {
            let t1 = (x1 - lx1) * dx;
            let t2 = (x2 - lx1) * dx;
            let t3 = (y1 - ly1) * dy;
            let t4 = (y2 - ly1) * dy;
            let t5 = (z1 - lz1) * dz;
            let t6 = (z2 - lz1) * dz;
            let tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
            let tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
            if (tmax < 0) return false;
            if (tmin > tmax) return false;
            return tmin;
        }

        getCanSee(player, boxSize) {
            const from = this.me;
            if (!from || !this.game ?.map ?.manager ?.objects) return true;
            boxSize = boxSize || 0;
            const toX = player.x, toY = player.y, toZ = player.z;

            for (let obj, dist = this.getDistance(from, player), xDr = this.getDirection(from.z, from.x, toZ, toX), yDr = this.getDirection(this.getDistance({x: from.x, y: 0, z: from.z}, {x: toX, y: 0, z: toZ}), toY, 0, from.y), dx = 1 / (dist * Math.sin(xDr - Math.PI) * Math.cos(yDr)), dz = 1 / (dist * Math.cos(xDr - Math.PI) * Math.cos(yDr)), dy = 1 / (dist * Math.sin(yDr)), yOffset = from.y + (from.height || this.PLAYER_HEIGHT) - this.CAMERA_HEIGHT, i = 0; i < this.game.map.manager.objects.length; ++i) {
                if (!(obj = this.game.map.manager.objects[i]).noShoot && obj.active && !obj.transparent && (!this.settings.aimbotWallBangs || (!obj.penetrable || !this.me.weapon.pierce))) {
                    let tmpDst = this.lineInRect(from.x, from.z, yOffset, dx, dz, dy, obj.x - Math.max(0, obj.width - boxSize), obj.z - Math.max(0, obj.length - boxSize), obj.y - Math.max(0, obj.height - boxSize), obj.x + Math.max(0, obj.width - boxSize), obj.z + Math.max(0, obj.length - boxSize), obj.y + Math.max(0, obj.height - boxSize));
                    if (tmpDst && 1 > tmpDst) return false;
                }
            }
            return true;
        }

        async waitFor(condition, timeout = Infinity) {
            const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
            return new Promise(async (resolve, reject) => {
                if (typeof timeout != 'number') reject('Timeout argument not a number in waitFor');
                let result;
                while (result === undefined || result === false || result === null || result.length === 0) {
                    if ((timeout -= 100) < 0) { resolve(false); return; }
                    await sleep(100);
                    result = typeof condition === 'string' ? Function(condition)() : condition();
                }
                resolve(result);
            });
        }

        lookDir(xDire, yDire) {
            this.controls.object.rotation.y = yDire
            this.controls.pchObjc.rotation.x = xDire;
            this.controls.pchObjc.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.controls.pchObjc.rotation.x));
            this.controls.yDr = (this.controls.pchObjc.rotation.x % Math.PI).round(3);
            this.controls.xDr = (this.controls.object.rotation.y % Math.PI).round(3);
            this.renderer.camera.updateProjectionMatrix();
            this.renderer.updateFrustum();
        }

        world2Screen(worldPosition) {
            if (!this.renderer?.camera || !this.overlay?.canvas) return null;
            const pos = worldPosition.clone(); pos.project(this.renderer.camera);
            if (pos.z > 1) return null;
            return { x: (pos.x + 1) / 2 * this.overlay.canvas.width, y: (-pos.y + 1) / 2 * this.overlay.canvas.height, };
        }

        drawCanvasESP(player, CRC2d) {
            if (this.settings.espTeamCheck && this.isTeam(player)) return;

            const playerPos = new this.three.Vector3(player.x, player.y, player.z);
            const effectiveHeight = this.PLAYER_HEIGHT - ((player.crouchVal || 0) * this.CROUCH_FACTOR);
            const halfWidth = this.PLAYER_WIDTH / 2;
            const corners = [
                new this.three.Vector3(playerPos.x - halfWidth, playerPos.y, playerPos.z - halfWidth), new this.three.Vector3(playerPos.x + halfWidth, playerPos.y, playerPos.z - halfWidth),
                new this.three.Vector3(playerPos.x - halfWidth, playerPos.y, playerPos.z + halfWidth), new this.three.Vector3(playerPos.x + halfWidth, playerPos.y, playerPos.z + halfWidth),
                new this.three.Vector3(playerPos.x - halfWidth, playerPos.y + effectiveHeight, playerPos.z - halfWidth), new this.three.Vector3(playerPos.x + halfWidth, playerPos.y + effectiveHeight, playerPos.z - halfWidth),
                new this.three.Vector3(playerPos.x - halfWidth, playerPos.y + effectiveHeight, playerPos.z + halfWidth), new this.three.Vector3(playerPos.x + halfWidth, playerPos.y + effectiveHeight, playerPos.z + halfWidth),
            ];
            let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity, onScreen = false;
            for (const corner of corners) {
                const screenPos = this.world2Screen(corner);
                if (screenPos) { onScreen = true; xmin = Math.min(xmin, screenPos.x); xmax = Math.max(xmax, screenPos.x); ymin = Math.min(ymin, screenPos.y); ymax = Math.max(ymax, screenPos.y); }
            }

            if (!onScreen || !isFinite(xmin + xmax + ymin + ymax)) return;

            const boxWidth = xmax - xmin;
            const boxHeight = ymax - ymin;

            CRC2d.save.apply(this.ctx, []);

            if (this.settings.espLines) {
                const startX = this.overlay.canvas.width / 2, startY = this.overlay.canvas.height, endX = xmin + boxWidth / 2, endY = ymax, trailColor = this.settings.espColor;
                const hexToRgba = (hex, alpha) => { let r=0,g=0,b=0; if (hex.length == 7) { r=parseInt(hex.slice(1,3),16); g=parseInt(hex.slice(3,5),16); b=parseInt(hex.slice(5,7),16); } return `rgba(${r},${g},${b},${alpha})`; };
                const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
                gradient.addColorStop(0, hexToRgba(trailColor, 0.7)); gradient.addColorStop(1, hexToRgba(trailColor, 0));
                this.ctx.lineWidth = 3; this.ctx.strokeStyle = gradient; this.ctx.shadowColor = trailColor; this.ctx.shadowBlur = 15;
                CRC2d.beginPath.apply(this.ctx, []);
                CRC2d.moveTo.apply(this.ctx, [startX, startY]);
                CRC2d.lineTo.apply(this.ctx, [endX, endY]);
                CRC2d.stroke.apply(this.ctx, []);
            }

            if (this.settings.espSquare) {
                this.ctx.shadowColor = this.settings.boxColor; this.ctx.shadowBlur = 10; this.ctx.lineWidth = 2; this.ctx.strokeStyle = this.settings.boxColor;
                CRC2d.strokeRect.apply(this.ctx, [xmin, ymin, boxWidth, boxHeight]);
            }

            if (this.settings.espNameTags) {
                // Disable glow for text
                this.ctx.shadowBlur = 0;

                if (player.health && player.maxHealth) {
                    const healthPercentage = Math.max(0, player.health / player.maxHealth);
                    this.ctx.fillStyle = "rgba(0,0,0,0.5)";
                    CRC2d.fillRect.apply(this.ctx, [xmin-8, ymin, -6, boxHeight]);
                    this.ctx.fillStyle = healthPercentage > 0.75 ? "#43A047" : healthPercentage > 0.4 ? "#FDD835" : "#E53935";
                    CRC2d.fillRect.apply(this.ctx, [xmin-8, ymin + boxHeight * (1-healthPercentage), -6, boxHeight * healthPercentage]);
                }

                this.ctx.font = "bold 14px Rajdhani, sans-serif";
                this.ctx.fillStyle = "#FFFFFF";
                this.ctx.strokeStyle = "#000000"; this.ctx.lineWidth = 2.5; this.ctx.textAlign = "left";

                let textY = ymin + 1, lineSpacing = 16;
                CRC2d.strokeText.apply(this.ctx, [player.name || 'Player', xmax + 5, textY]);
                CRC2d.fillText.apply(this.ctx, [player.name || 'Player', xmax + 5, textY]);
                textY += lineSpacing;

                if (player.health) {
                    const healthText = `♥ ${Math.round(player.health)}`;
                    CRC2d.strokeText.apply(this.ctx, [healthText, xmax+5, textY]);
                    CRC2d.fillText.apply(this.ctx, [healthText, xmax+5, textY]);
                    textY += lineSpacing;
                }

                if (player.weapon && this.settings.espWeaponIcons) {
                    const weaponText = `❖ ${player.weapon.name}`;
                    CRC2d.strokeText.apply(this.ctx, [weaponText, xmax + 5, textY]);
                    CRC2d.fillText.apply(this.ctx, [weaponText, xmax + 5, textY]);
                }

                const distance = Math.round(this.getDistance(this.me, player) / 10);
                const distanceText = `[${distance}m]`;
                const distanceTextX = xmin + boxWidth / 2;
                const distanceTextY = ymax + lineSpacing;
                this.ctx.textAlign = "center";
                CRC2d.strokeText.apply(this.ctx, [distanceText, distanceTextX, distanceTextY]);
                CRC2d.fillText.apply(this.ctx, [distanceText, distanceTextX, distanceTextY]);
            }

            CRC2d.restore.apply(this.ctx, []);
        }
    }

    new AimbaeShiro();
};

let tokenPromiseResolve;
const tokenPromise = new Promise((resolve) => (tokenPromiseResolve = resolve));
const ifr = document.createElement('iframe');
ifr.src = location.origin + '/' + (window.location.search ? window.location.search : '');
ifr.style.display = 'none';
document.documentElement.append(ifr);
const ifrFetch = ifr.contentWindow.fetch;
Object.defineProperty(ifr.contentWindow, 'fetch', {
    get() {
        if (ifr.contentWindow?.windows?.length > 0) {
            return function (url) { if (typeof url === 'string' && url.includes('/seek-game')) { ifr.remove(); tokenPromiseResolve(url); return; } return ifrFetch.apply(this, arguments); };
        }
        return ifrFetch;
    },
});
const _fetch = window.fetch;
window.fetch = async function (url, options) { if (typeof url === 'string' && url.includes('/seek-game')) { url = await tokenPromise; } return _fetch.apply(this, arguments); };
function downloadFileSync(url) { var req = new XMLHttpRequest(); req.open('GET', url, false); req.send(); if (req.status === 200) { return req.response; } return null; }
const observer = new MutationObserver(function (mutations) {
    for (const mutation of mutations) {
        if (mutation.addedNodes) {
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'SCRIPT' && node.src && node.src.includes('/static/index-')) {
                    node.remove(); observer.disconnect();
                    const modifiedGameScript = downloadFileSync(`https://raw.githubusercontent.com/GameSketchers/AimbaeShiro/refs/heads/main/GameSource/game.js`);
                    if (modifiedGameScript) { window.addEventListener('load', () => { Function(cheatInstanceId + '();\n\n' + modifiedGameScript)(); });
                                            } else { console.error("🌸 AimbaeShiro: Failed to download modified game script."); }
                    return;
                }
            }
        }
    }
});
observer.observe(document, { childList: true, subtree: true });
