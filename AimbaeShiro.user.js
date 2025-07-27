// ==UserScript==
// @name         AimbaeShiro – Krunker.IO Cheat
// @name:tr      AimbaeShiro – Krunker.IO Hilesi
// @name:ja      AimbaeShiro – Krunker.IO チート
// @name:az      AimbaeShiro – Krunker.IO Hilesi
// @namespace    https://github.com/GameSketchers/AimbaeShiro
// @version      1.4.0
// @description  A powerful anime-themed cheat suite with a non-silent Aimbot, Unlock Skins, glowing & animated ESP Box, Energy Trail, Healthbars, and more. Powered by an advanced injection method.
// @description:tr Fiziksel nişan alan Aimbot, Tüm Kozmetikleri Açma, parlak & animasyonlu ESP Kutusu, Enerji İzi, Can Barları ve daha fazlasını içeren güçlü, anime temalı bir hile aracı. Gelişmiş bir enjeksiyon yöntemiyle güçlendirilmiştir.
// @description:ja 非サイレントエイムボット、全スキンアンロック、輝くアニメーションESPボックス、エナジートレイル、ヘルスバーなどを備えた強力なアニメ風チートスイート。高度な注入方法を搭載。
// @description:az Fiziki nişan alan Aimbot, Bütün Kosmetikləri Açma, parlayan & animasiyalı ESP Qutusu, Enerji İzi, Can Zolaqları və daha çoxunu ehtiva edən güclü, anime tərzli bir hile vasitəsidir. Qabaqcıl bir enjeksiyon üsulu ilə gücləndirilmişdir.
// @author       anonimbiri
// @match        *://krunker.io/*
// @match        *://browserfps.com/*
// @exclude      *://krunker.io/social*
// @exclude      *://krunker.io/editor*
// @icon         https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png
// @grant        none
// @supportURL   https://github.com/GameSketchers/AimbaeShiro/issues/new?labels=bug&type=bug&template=bug_report.md&title=Bug+Report
// @homepage     https://github.com/GameSketchers/AimbaeShiro
// @run-at       document-start
// @tag          games
// @license      MIT
// @noframes
// @require      https://unpkg.com/three@0.150.0/build/three.min.js
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
            this.scale = 1;
            this.three = window.THREE;

            this.PLAYER_HEIGHT = 11;
            this.PLAYER_WIDTH = 4;
            this.CROUCH_FACTOR = 3;

            this.tempVector = new this.three.Vector3();
            this.cameraPos = new this.three.Vector3();

            this.isProxy = Symbol('isProxy');
            this.rightMouseDown = false;
            this.isBindingHotkey = false;
            this.currentBindingSetting = null;
            this.pressedKeys = new Set();

            this.defaultSettings = {
                aimbotEnabled: true,
                aimbotOnRightMouse: false,
                aimbotWallCheck: true,
                aimbotTeamCheck: true,
                autoFireEnabled: false,
                espLines: true,
                espSquare: true,
                espNameTags: true,
                espWeaponIcons: true,
                espTeamCheck: true,
                wireframeEnabled: false,
                unlockSkins: false,
                bhopEnabled: false,
                menuVisible: true,
                espColor: "#ff0080",
                boxColor: "#ff0080",
                menuTopPx: null,
                menuLeftPx: null,
                autoNuke: false,
                antikick: true,
                autoReload: false,
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
                this.initializeGameHooks();
                this.createGUI();
                this.createMenuButton();
                this.addEventListeners();
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
                skins: {
                    set(skinsArray) {
                        this[originalSkinsSymbol] = skinsArray;
                        if (!this[localSkinsSymbol]) {
                            this[localSkinsSymbol] = Array.from({ length: 25000 }, (_, i) => ({ ind: i, cnt: 1, }));
                        }
                        return skinsArray;
                    },
                    get() {
                        return cheatInstance.settings.unlockSkins && this.stats ? this[localSkinsSymbol] : this[originalSkinsSymbol];
                    },
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
                        const isEnemy = !cheatInstance.isDefined(cheatInstance.me) || !cheatInstance.me.team || cheatInstance.me.team !== this.team;
                        return this.inView || (isEnemy && (cheatInstance.settings.espSquare || cheatInstance.settings.espLines || cheatInstance.settings.espNameTags));
                    },
                },
                useLooseClient: {
                    enumerable: false,
                    get() { return this['_ulc']; },
                    set(value) {
                        cheatInstance.waitFor(() => window.instructionsUpdate).then((instructions) => {
                            new MutationObserver((mutations) => {
                                const target = mutations[0].target;
                                if (location.host === 'krunker.io' && target.textContent.includes('Connection Banned')) {
                                    localStorage.removeItem('krunker_token');
                                    alert("You Have Been Banned And Signed Out, You Will Now Be Redirected to Krunker's Proxy 'browserfps'");
                                    location.assign('https://browserfps.com/');
                                }
                            }).observe(instructions, { attributes: true, attributeFilter: ['style'] });
                        });
                        this['_ulc'] = value;
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

            this.espCanvas.width = window.innerWidth;
            this.espCanvas.height = window.innerHeight;
            this.ctx.clearRect(0, 0, this.espCanvas.width, this.espCanvas.height);

            if (this.renderer.scene) {
                this.renderer.scene.traverse(child => {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            for (const material of child.material) material.wireframe = this.settings.wireframeEnabled;
                        } else child.material.wireframe = this.settings.wireframeEnabled;
                    }
                });
            }

            for (const player of this.game.players.list) {
                if (player.isYou || !player.active || !player.objInstances) continue;
                this.drawCanvasESP(player);
            }
        }

        onProcessInputs(inputPacket, player) {
            const gameInputIndices = { frame: 0, slowMotion: 1, pitch: 2, yaw: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponSwitch: 10 };

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

            if (this.settings.autoNuke && Object.keys(this.me.streaks).length && this.game.socket?.send) {
                this.game.socket.send('k', 0);
            }

            if (this.settings.autoReload && this.me.weapon.secondary !== undefined && this.me.weapon.secondary !== null && this.me.ammos[this.me.weapon.secondary ? 1 : 0] === 0 && this.me.reloadTimer === 0) {
                inputPacket[gameInputIndices.reload] = 1;
            }

            // Aimbot
            let target = null;
            if (this.settings.aimbotEnabled && (!this.settings.aimbotOnRightMouse || this.rightMouseDown)) {
                const potentialTargets = this.game.players.list
                .filter(p => this.isDefined(p) && !p.isYou && p.active && p.health > 0 && (!this.settings.aimbotTeamCheck || !this.isTeam(p)) && (!this.settings.aimbotWallCheck || p.inView))
                .sort((a, b) => this.getDistance(this.me, a) - this.getDistance(this.me, b));

                target = potentialTargets[0] || null;

                this.controls.target = null;
            }

            if (target) {

                const targetPos = this.getTargetPosition(target);

                target.isTarget = this.settings.markTarget;
                const yaw = this.getDirection(this.me.z, this.me.x, targetPos.z, targetPos.x);
                const pitch = this.getXDirection(this.me.x, this.me.y, this.me.z, targetPos.x, targetPos.y, targetPos.z);
                const compensatedPitch = pitch - (0.3 * this.me.recoilAnimY);

                this.controls.target = {
                    xD: compensatedPitch,
                    yD: yaw,
                };
                this.controls.update(400);

                // süper silent için
                /*inputPacket[gameInputIndices.ydir] = yaw * 1000;
                inputPacket[gameInputIndices.xdir] = compensatedPitch * 1000;*/

                if (this.settings.autoFireEnabled && this.me.reloadTimer === 0 && !this.me.didShoot && this.me.aimVal > 0) {
                    inputPacket[gameInputIndices.scope] = 1;
                    inputPacket[gameInputIndices.shoot] = 1;
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
            const menuCSS = `.anonimbiri-menu-container{font-family:'Orbitron',monospace;position:fixed;width:90vw;max-width:500px;background:rgba(10,10,10,.95);border:2px solid #ff0080;border-radius:15px;box-shadow:0 0 30px rgba(255,0,128,.5),inset 0 0 20px rgba(255,0,128,.1);backdrop-filter:blur(10px);animation:anonimbiri-menuGlow 2s ease-in-out infinite alternate,anonimbiri-slideIn .5s ease-out;user-select:none;z-index:1000;display:none;opacity:0;transition:opacity .3s ease-out,transform .3s ease-out}.anonimbiri-menu-container.visible{display:block;opacity:1}@keyframes anonimbiri-menuGlow{from{box-shadow:0 0 30px rgba(255,0,128,.3),inset 0 0 20px rgba(255,0,128,.1)}to{box-shadow:0 0 50px rgba(255,0,128,.6),inset 0 0 30px rgba(255,0,128,.2)}}@keyframes anonimbiri-slideIn{from{opacity:0;transform:translateY(-20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}.anonimbiri-menu-header{height:250px;background:linear-gradient(45deg,#ff0080,#ff4da6);border-radius:13px 13px 0 0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;cursor:grab}.anonimbiri-menu-header:active{cursor:grabbing}.anonimbiri-menu-header::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background-image:url(https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/banner.jpeg);background-size:cover;background-position:center;opacity:.8;z-index:1;animation:anonimbiri-bannerShift 10s ease-in-out infinite}@keyframes anonimbiri-bannerShift{0%,100%{transform:scale(1.05) rotate(-1deg)}50%{transform:scale(1.1) rotate(1deg)}}.anonimbiri-menu-header::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(45deg,rgba(255,0,128,.3),rgba(255,77,166,.3));z-index:2}.anonimbiri-tab-container{display:flex;background:rgba(20,20,20,.9);border-bottom:1px solid #ff0080}.anonimbiri-tab{flex:1;padding:12px;background:rgba(30,30,30,.8);color:#ff0080;text-align:center;cursor:pointer;transition:all .3s ease;font-weight:700;font-size:12px;letter-spacing:1px;border-right:1px solid rgba(255,0,128,.3);position:relative;overflow:hidden}.anonimbiri-tab::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);transition:left .5s ease}.anonimbiri-tab:hover::before{left:100%}.anonimbiri-tab:last-child{border-right:none}.anonimbiri-tab:hover{background:rgba(255,0,128,.2);color:#fff;transform:translateY(-2px)}.anonimbiri-tab.active{background:linear-gradient(45deg,#ff0080,#ff4da6);color:#fff;box-shadow:0 2px 10px rgba(255,0,128,.5)}.anonimbiri-tab-content{padding:15px;max-height:calc(100vh - 350px);min-height:150px;overflow-y:auto}.anonimbiri-tab-pane{display:none}.anonimbiri-tab-pane.active{display:block;animation:anonimbiri-fadeIn .3s ease}@keyframes anonimbiri-fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.anonimbiri-menu-item{display:flex;justify-content:space-between;align-items:center;padding:10px 15px;margin:8px 0;background:rgba(30,30,30,.8);border:1px solid rgba(255,0,128,.3);border-radius:8px;transition:all .3s ease;cursor:pointer;position:relative;overflow:hidden}.anonimbiri-menu-item::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,0,128,.1),transparent);transition:left .5s ease}.anonimbiri-menu-item:hover::before{left:100%}.anonimbiri-menu-item:hover{background:rgba(255,0,128,.1);border-color:#ff0080;transform:translateX(5px) scale(1.02);box-shadow:0 5px 15px rgba(255,0,128,.3)}.anonimbiri-menu-item.active{background:rgba(255,0,128,.2);border-color:#ff0080}.anonimbiri-menu-item-content{display:flex;align-items:center;gap:12px}.anonimbiri-menu-item-icon{width:20px;height:20px;fill:#ff4da6;transition:all .3s ease}.anonimbiri-menu-item:hover .anonimbiri-menu-item-icon{fill:#ff0080;transform:scale(1.1)}.anonimbiri-menu-item label{color:#ff4da6;font-weight:700;font-size:14px;letter-spacing:1px;cursor:pointer;transition:color .3s ease}.anonimbiri-menu-item:hover label{color:#ff0080}.anonimbiri-controls{display:flex;align-items:center;gap:10px}.anonimbiri-toggle-switch{position:relative;width:50px;height:24px;background:rgba(40,40,40,.8);border-radius:12px;pointer-events:none;transition:all .3s ease;border:1px solid rgba(255,0,128,.3)}.anonimbiri-toggle-switch::before{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;background:#666;border-radius:50%;transition:all .3s cubic-bezier(.68,-.55,.265,1.55);box-shadow:0 2px 5px rgba(0,0,0,.3)}.anonimbiri-toggle-switch.active{background:linear-gradient(45deg,#ff0080,#ff4da6);box-shadow:0 0 15px rgba(255,0,128,.5)}.anonimbiri-toggle-switch.active::before{left:28px;background:#fff}.anonimbiri-color-container{position:relative}.anonimbiri-color-picker-input{opacity:0;position:absolute;width:40px;height:24px;cursor:pointer}.anonimbiri-color-preview{width:40px;height:24px;border:1px solid #ff0080;border-radius:4px;pointer-events:none;transition:all .3s ease}.anonimbiri-menu-item:hover .anonimbiri-color-preview{transform:scale(1.1);box-shadow:0 0 10px rgba(255,0,128,.7)}.anonimbiri-hotkey{background:rgba(255,0,128,.2);color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;border:1px solid #ff0080;pointer-events:none;min-width:40px;text-align:center}.anonimbiri-menu-item:hover .anonimbiri-hotkey{background:#ff0080;transform:scale(1.05)}.anonimbiri-tab-content::-webkit-scrollbar{width:8px}.anonimbiri-tab-content::-webkit-scrollbar-track{background:rgba(20,20,20,.5);border-radius:4px}.anonimbiri-tab-content::-webkit-scrollbar-thumb{background:#ff0080;border-radius:4px}.anonimbiri-tab-content::-webkit-scrollbar-thumb:hover{background:#ff4da6}.anonimbiri-close-btn{position:absolute;top:10px;right:15px;color:#fff;font-size:20px;cursor:pointer;z-index:4;width:25px;height:25px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);border-radius:50%;transition:all .3s ease}.anonimbiri-close-btn svg{width:16px;height:16px;fill:#fff}.anonimbiri-close-btn:hover{background:#ff0080;transform:rotate(90deg) scale(1.1)}.anonimbiri-hotkey-modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);display:none;align-items:center;justify-content:center;z-index:2000;animation:anonimbiri-fadeIn .3s ease}.anonimbiri-hotkey-modal.active{display:flex}.anonimbiri-hotkey-content{background:linear-gradient(135deg,#1a1a1a,#2a1a2a);padding:40px;border-radius:15px;border:2px solid #ff0080;box-shadow:0 0 50px rgba(255,0,128,.7);text-align:center;animation:anonimbiri-modalPulse .5s ease-out}@keyframes anonimbiri-modalPulse{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}.anonimbiri-hotkey-content h2{color:#ff0080;font-size:24px;margin-bottom:20px;letter-spacing:2px}.anonimbiri-hotkey-content p{color:#fff;font-size:16px;margin-bottom:30px}.anonimbiri-hotkey-content p span{color:#ff4da6;font-weight:700}#shiro-menu-button{height:80px;background-color:rgba(255,0,128,.05);border:1px solid rgba(255,0,128,.5);cursor:pointer;background-image:url('https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png');background-size:contain;background-position:center;background-repeat:no-repeat;transition:all .3s ease}#shiro-menu-button:hover{background-color:rgba(255,0,128,.2);border-color:#ff0080;transform:scale(1.03);box-shadow:0 0 15px rgba(255,0,128,.5)}`;
            const style = document.createElement('style');
            style.textContent = menuCSS;
            document.head.appendChild(style);

            const miscTabItems =
                  this.createMenuItemHTML('toggle', 'wireframeEnabled', 'Wireframe', '<path d="M12,2L2,7L12,12L22,7L12,2M2,17L12,22L22,17L12,12L2,17Z"/>') +
                  this.createMenuItemHTML('toggle', 'unlockSkins', 'Unlock All Skins', '<path d="M16.5,4.5L19,2L21.5,4.5L19,7L16.5,4.5M19,10.33C20.66,10.33 22,8.91 22,7.33V2H16V7.33C16,8.91 17.34,10.33 19,10.33M5,10.33C6.66,10.33 8,8.91 8,7.33V2H2V7.33C2,8.91 3.34,10.33 5,10.33M18,12H13.67C13.5,12.59 13.19,13.11 12.76,13.54L12,14.3L11.24,13.54C10.81,13.11 10.5,12.59 10.33,12H6C5.45,12 5,12.45 5,13V22H19V13C19,12.45 18.55,12 18,12Z"/>') +
                  this.createMenuItemHTML('toggle', 'bhopEnabled', 'Bunny Hop', '<path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M7,9L12,14L17,9H7Z"/>') +
                  this.createMenuItemHTML('toggle', 'autoNuke', 'Auto Nuke', '<path d="M12,2C12,2 11.5,6.5 9.5,8.5C7.5,10.5 2,11 2,11C2,11 6.5,11.5 8.5,13.5C10.5,15.5 11,20 11,20C11,20 11.5,15.5 13.5,13.5C15.5,11.5 20,11 20,11C20,11 15.5,10.5 13.5,8.5C11.5,6.5 11,2 11,2H12Z"/>') +
                  this.createMenuItemHTML('toggle', 'antikick', 'Anti Kick', '<path d="M15,4C15.9,4 16.75,4.4 17.4,5.05L19.95,2.5C18.33,1 16.2,0 13.5,0C8.6,0 4.2,3.33 2.5,7.75L5.45,9.5C6.4,5.93 9.63,4 13.5,4H15M19.95,21.5L17.4,18.95C16.75,19.6 15.9,20 15,20H13.5C9.63,20 6.4,18.07 5.45,14.5L2.5,16.25C4.2,20.67 8.6,24 13.5,24C16.2,24 18.33,23 19.95,21.5M22,12C22,11.45 21.93,10.9 21.82,10.38L24,8.2L21.8,6L19.65,8.15C19.1,7.25 18.28,6.5 17.28,6.05L16.5,2H10.5L9.73,6.05C8.73,6.5 7.9,7.25 7.35,8.15L5.2,6L3,8.2L5.18,10.38C5.07,10.9 5,11.45 5,12C5,12.55 5.07,13.1 5.18,13.62L3,15.8L5.2,18L7.35,15.85C7.9,16.75 8.73,17.5 9.73,17.95L10.5,22H16.5L17.28,17.95C18.28,17.5 19.1,16.75 19.65,15.85L21.8,18L24,15.8L21.82,13.62C21.93,13.1 22,12.55 22,12Z"/>') +
                  this.createMenuItemHTML('toggle', 'autoReload', 'Auto Reload', '<path d="M12,4V1L8,5L12,9V6C15.31,6 18,8.69 18,12C18,13.01 17.74,13.97 17.29,14.83L18.74,16.28C19.54,15.03 20,13.57 20,12C20,7.58 16.42,4 12,4M6,12C6,10.99 6.26,10.03 6.71,9.17L5.26,7.72C4.46,8.97 4,10.43 4,12C4,16.42 7.58,20 12,20V23L16,19L12,15V18C8.69,18 6,15.31 6,12Z"/>');

            const menuHTML = `<div class="anonimbiri-menu-container" id="anonimbiri-cheatMenu"><div class="anonimbiri-menu-header" id="anonimbiri-menuHeader"><div class="anonimbiri-close-btn" id="anonimbiri-closeBtn"><svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg></div></div><div class="anonimbiri-tab-container"><div class="anonimbiri-tab active" data-tab="aimbot">AIMBOT</div><div class="anonimbiri-tab" data-tab="esp">ESP</div><div class="anonimbiri-tab" data-tab="misc">MISC</div><div class="anonimbiri-tab" data-tab="hotkeys">HOTKEYS</div></div><div class="anonimbiri-tab-content"><div class="anonimbiri-tab-pane active" id="anonimbiri-tab-aimbot">${this.createMenuItemHTML('toggle','aimbotEnabled','Aimbot Enabled','<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z"/>')}${this.createMenuItemHTML('toggle','aimbotOnRightMouse','Right Mouse Trigger','<path d="M11,1.07C7.05,1.56 4,4.92 4,9H7L12,4L17,9H20C20,4.92 16.95,1.56 13,1.07V1A1,1 0 0,0 11,1V1.07M18,10H6A2,2 0 0,0 4,12V22A2,2 0 0,0 6,24H18A2,2 0 0,0 20,22V12A2,2 0 0,0 18,10M16,12V14H8V12H16Z"/>')}${this.createMenuItemHTML('toggle','aimbotWallCheck','Wall Check','<path d="M2,2V22H4V20H20V22H22V2H20V4H4V2H2M6,6H18V18H6V6M8,8V16H16V8H8M10,10H14V14H10V10Z"/>')}${this.createMenuItemHTML('toggle','aimbotTeamCheck','Team Check','<path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,6A1.5,1.5 0 0,1 13.5,7.5A1.5,1.5 0 0,1 12,9A1.5,1.5 0 0,1 10.5,7.5A1.5,1.5 0 0,1 12,6M17,11.5C17,14.08 15.03,16.44 12.44,17.06C12.3,17.03 11.7,17 11,17C9.33,17 7.79,16.5 6.67,15.67C6.15,15.25 5.75,14.77 5.5,14.25C5.5,14.25 5,11.5 5,11.5C5,11.5 8,13 11,13C12,13 14,12.5 14,12.5C14,12.5 14,11.25 14,11C14,10.29 12.5,9.5 12.5,9.5L13.5,8.5C13.5,8.5 17,10 17,11.5Z"/>')}${this.createMenuItemHTML('toggle','autoFireEnabled','Auto Fire','<path d="M21.71,5.29L18.71,2.29A1,1 0 0,0 17.29,2.29L16,3.59L11.71,7.88C11.69,7.88 11.68,7.89 11.66,7.89L8.34,11.21C8.32,11.23 8.31,11.24 8.29,11.26L2.29,17.26A1,1 0 0,0 2.29,18.68L5.29,21.68A1,1 0 0,0 6.71,21.68L12.71,15.68C12.73,15.66 12.74,15.65 12.76,15.63L16.08,12.31C16.1,12.29 16.11,12.28 16.13,12.26L20.42,8L21.71,6.71A1,1 0 0,0 21.71,5.29M6,20.27L3.73,18L8.66,13.07L10.93,15.34L6,20.27M12.34,14.93L9.07,11.66L11.66,9.07L14.93,12.34L12.34,14.93M16.34,11.93L12.07,7.66L17.29,2.44L21.56,6.71L16.34,11.93Z"/>')}</div><div class="anonimbiri-tab-pane" id="anonimbiri-tab-esp">${this.createMenuItemHTML('toggle','espTeamCheck','Team Check','<path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,6A1.5,1.5 0 0,1 13.5,7.5A1.5,1.5 0 0,1 12,9A1.5,1.5 0 0,1 10.5,7.5A1.5,1.5 0 0,1 12,6M17,11.5C17,14.08 15.03,16.44 12.44,17.06C12.3,17.03 11.7,17 11,17C9.33,17 7.79,16.5 6.67,15.67C6.15,15.25 5.75,14.77 5.5,14.25C5.5,14.25 5,11.5 5,11.5C5,11.5 8,13 11,13C12,13 14,12.5 14,12.5C14,12.5 14,11.25 14,11C14,10.29 12.5,9.5 12.5,9.5L13.5,8.5C13.5,8.5 17,10 17,11.5Z"/>')}${this.createMenuItemHTML('toggle','espLines','Energy Trail ESP','<path d="M15,3V7.59L7.59,15H3V21H9V16.42L16.42,9H21V3M17,5H19V7H17M5,17H7V19H5"/>')}${this.createMenuItemHTML('toggle','espSquare','Glowing Box ESP','<path d="M3,3V21H21V3H3M5,5H19V19H5V5Z"/>')}${this.createMenuItemHTML('toggle','espNameTags','Full Info (Name/HP/Wpn)','<path d="M20,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6A2,2 0 0,0 20,4M12,6A2,2 0 0,1 14,8A2,2 0 0,1 12,10A2,2 0 0,1 10,8A2,2 0 0,1 12,6M18,18H6V17C6,15.67 10,14.5 12,14.5C14,14.5 18,15.67 18,17V18Z"/>')}${this.createMenuItemHTML('toggle','espWeaponIcons','Show Weapon (in Full Info)','<path d="M16,13V21H12V13H16M17.8,7.4L16.4,6L15,7.4L13.6,6L12.2,7.4L10.8,6L9.4,7.4L8,6L6.6,7.4L5.2,6L3.8,7.4L2.4,6L1,7.4V21H11V12H7V10H11V2H23V7.4H17.8Z"/>')}${this.createMenuItemHTML('color','espColor','Trail Color','<path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A8.5,8.5 0 0,0 20.5,12.5A8.5,8.5 0 0,0 12,3Z"/>')}${this.createMenuItemHTML('color','boxColor','Box & Info Color','<path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A8.5,8.5 0 0,0 20.5,12.5A8.5,8.5 0 0,0 12,3Z"/>')}</div><div class="anonimbiri-tab-pane" id="anonimbiri-tab-misc">${miscTabItems}</div><div class="anonimbiri-tab-pane" id="anonimbiri-tab-hotkeys">${this.createMenuItemHTML('hotkey','toggleMenu','Toggle Menu','<path d="M6,2A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6M6,4H13V9H18V20H6V4Z"/>')}${this.createMenuItemHTML('hotkey','aimbotEnabled','Toggle Aimbot','<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z"/>')}${this.createMenuItemHTML('hotkey','aimbotWallCheck','Toggle Wall Check','<path d="M2,2V22H4V20H20V22H22V2H20V4H4V2H2M6,6H18V18H6V6M8,8V16H16V8H8M10,10H14V14H10V10Z"/>')}${this.createMenuItemHTML('hotkey','aimbotTeamCheck','Toggle Aimbot Team','<path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,6A1.5,1.5 0 0,1 13.5,7.5A1.5,1.5 0 0,1 12,9A1.5,1.5 0 0,1 10.5,7.5A1.5,1.5 0 0,1 12,6M17,11.5C17,14.08 15.03,16.44 12.44,17.06C12.3,17.03 11.7,17 11,17C9.33,17 7.79,16.5 6.67,15.67C6.15,15.25 5.75,14.77 5.5,14.25C5.5,14.25 5,11.5 5,11.5C5,11.5 8,13 11,13C12,13 14,12.5 14,12.5C14,12.5 14,11.25 14,11C14,10.29 12.5,9.5 12.5,9.5L13.5,8.5C13.5,8.5 17,10 17,11.5Z"/>')}${this.createMenuItemHTML('hotkey','espTeamCheck','Toggle ESP Team','<path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,6A1.5,1.5 0 0,1 13.5,7.5A1.5,1.5 0 0,1 12,9A1.5,1.5 0 0,1 10.5,7.5A1.5,1.5 0 0,1 12,6M17,11.5C17,14.08 15.03,16.44 12.44,17.06C12.3,17.03 11.7,17 11,17C9.33,17 7.79,16.5 6.67,15.67C6.15,15.25 5.75,14.77 5.5,14.25C5.5,14.25 5,11.5 5,11.5C5,11.5 8,13 11,13C12,13 14,12.5 14,12.5C14,12.5 14,11.25 14,11C14,10.29 12.5,9.5 12.5,9.5L13.5,8.5C13.5,8.5 17,10 17,11.5Z"/>')}${this.createMenuItemHTML('hotkey','espNameTags','Toggle Full Info','<path d="M20,4H4A2,2 0 0,0 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6A2,2 0 0,0 20,4M12,6A2,2 0 0,1 14,8A2,2 0 0,1 12,10A2,2 0 0,1 10,8A2,2 0 0,1 12,6M18,18H6V17C6,15.67 10,14.5 12,14.5C14,14.5 18,15.67 18,17V18Z"/>')}${this.createMenuItemHTML('hotkey','espWeaponIcons','Toggle Weapon Icon','<path d="M16,13V21H12V13H16M17.8,7.4L16.4,6L15,7.4L13.6,6L12.2,7.4L10.8,6L9.4,7.4L8,6L6.6,7.4L5.2,6L3.8,7.4L2.4,6L1,7.4V21H11V12H7V10H11V2H23V7.4H17.8Z"/>')}${this.createMenuItemHTML('hotkey','autoFireEnabled','Toggle Auto Fire','<path d="M21.71,5.29L18.71,2.29A1,1 0 0,0 17.29,2.29L16,3.59L11.71,7.88C11.69,7.88 11.68,7.89 11.66,7.89L8.34,11.21C8.32,11.23 8.31,11.24 8.29,11.26L2.29,17.26A1,1 0 0,0 2.29,18.68L5.29,21.68A1,1 0 0,0 6.71,21.68L12.71,15.68C12.73,15.66 12.74,15.65 12.76,15.63L16.08,12.31C16.1,12.29 16.11,12.28 16.13,12.26L20.42,8L21.71,6.71A1,1 0 0,0 21.71,5.29M6,20.27L3.73,18L8.66,13.07L10.93,15.34L6,20.27M12.34,14.93L9.07,11.66L11.66,9.07L14.93,12.34L12.34,14.93M16.34,11.93L12.07,7.66L17.29,2.44L21.56,6.71L16.34,11.93Z"/>')}${this.createMenuItemHTML('hotkey','espLines','Toggle Energy Trail','<path d="M15,3V7.59L7.59,15H3V21H9V16.42L16.42,9H21V3M17,5H19V7H17M5,17H7V19H5"/>')}${this.createMenuItemHTML('hotkey','espSquare','Toggle Glowing Box','<path d="M3,3V21H21V3H3M5,5H19V19H5V5Z"/>')}${this.createMenuItemHTML('hotkey','wireframeEnabled','Toggle Wireframe','<path d="M12,2L2,7L12,12L22,7L12,2M2,17L12,22L22,17L12,12L2,17Z"/>')}${this.createMenuItemHTML('hotkey','unlockSkins','Toggle Unlock Skins','<path d="M16.5,4.5L19,2L21.5,4.5L19,7L16.5,4.5M19,10.33C20.66,10.33 22,8.91 22,7.33V2H16V7.33C16,8.91 17.34,10.33 19,10.33M5,10.33C6.66,10.33 8,8.91 8,7.33V2H2V7.33C2,8.91 3.34,10.33 5,10.33M18,12H13.67C13.5,12.59 13.19,13.11 12.76,13.54L12,14.3L11.24,13.54C10.81,13.11 10.5,12.59 10.33,12H6C5.45,12 5,12.45 5,13V22H19V13C19,12.45 18.55,12 18,12Z"/>')}${this.createMenuItemHTML('hotkey','bhopEnabled','Toggle Bunny Hop','<path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M7,9L12,14L17,9H7Z"/>')}</div></div></div><div class="anonimbiri-hotkey-modal" id="anonimbiri-hotkeyModal"><div class="anonimbiri-hotkey-content"><h2>SET HOTKEY</h2><p>Press any key for <span id="anonimbiri-hotkeyFeatureName"></span></p><p style="font-size:12px;opacity:.7">(Press Escape to cancel)</p></div></div>`;
            const container = document.createElement('div');
            container.innerHTML = menuHTML;
            document.body.appendChild(container);
            this.espCanvas = document.createElement('canvas');
            this.espCanvas.style.position = 'fixed'; this.espCanvas.style.left = '0'; this.espCanvas.style.top = '0'; this.espCanvas.style.width = '100%'; this.espCanvas.style.height = '100%'; this.espCanvas.style.pointerEvents = 'none'; this.espCanvas.style.zIndex = '1001';
            document.body.appendChild(this.espCanvas);
            this.ctx = this.espCanvas.getContext('2d');
            this.gui = document.getElementById('anonimbiri-cheatMenu');
            this.hotkeyModal = document.getElementById('anonimbiri-hotkeyModal');
            if (this.settings.menuLeftPx !== null && this.settings.menuTopPx !== null) { this.gui.style.left = `${this.settings.menuLeftPx}px`; this.gui.style.top = `${this.settings.menuTopPx}px`;
                                                                                       } else { setTimeout(() => { const rect = this.gui.getBoundingClientRect(); this.gui.style.left = `calc(50% - ${rect.width / 2}px)`; this.gui.style.top = `calc(50% - ${rect.height / 2}px)`; const newRect = this.gui.getBoundingClientRect(); this.settings.menuLeftPx = newRect.left; this.settings.menuTopPx = newRect.top; this.saveSettings('aimbaeshiro_settings', this.settings); }, 100); }
            if (this.settings.menuVisible) this.gui.classList.add('visible');
            this.updateAllGUIElements();
            this.makeMenuDraggable();
        }

        createMenuItemHTML(type, setting, label, iconPath) {
            let controlHTML = '';
            switch (type) {
                case 'toggle': controlHTML = `<div class="anonimbiri-toggle-switch"></div>`; break;
                case 'color': controlHTML = `<div class="anonimbiri-color-container"><input type="color" class="anonimbiri-color-picker-input" data-setting="${setting}"><div class="anonimbiri-color-preview" data-setting="${setting}"></div></div>`; break;
                case 'hotkey': controlHTML = `<div class="anonimbiri-hotkey" data-hotkey="${setting}"></div>`; break;
            }
            return `<div class="anonimbiri-menu-item" data-setting="${setting}"><div class="anonimbiri-menu-item-content"><svg class="anonimbiri-menu-item-icon" viewBox="0 0 24 24">${iconPath}</svg><label>${label}</label></div><div class="anonimbiri-controls">${controlHTML}</div></div>`;
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
                if (window.SOUND) window.SOUND.play('select_0', 0.1);
                const setting = menuItem.dataset.setting;
                if (!setting) return;
                if (menuItem.querySelector('.anonimbiri-toggle-switch')) { this.settings[setting] = !this.settings[setting]; this.saveSettings('aimbaeshiro_settings', this.settings); this.updateGUIToggle(setting);
                                                                         } else if (menuItem.querySelector('.anonimbiri-color-picker-input')) { menuItem.querySelector('.anonimbiri-color-picker-input').click();
                                                                                                                                              } else if (menuItem.querySelector('.anonimbiri-hotkey')) { this.showHotkeyModal(setting); }
            });
            this.gui.querySelectorAll('.anonimbiri-menu-item, .anonimbiri-tab, .anonimbiri-close-btn').forEach(el => { el.addEventListener('mouseenter', () => { if (window.SOUND) window.SOUND.play('hover_0', 0.1); }); });
            this.gui.querySelectorAll('.anonimbiri-color-picker-input').forEach(cp => cp.addEventListener('input', (e) => { this.settings[e.target.dataset.setting] = e.target.value; this.saveSettings('aimbaeshiro_settings', this.settings); this.updateGUIPicker(e.target.dataset.setting); }));
        }

        updateAllGUIElements() {
            Object.keys(this.settings).forEach(s => { if (s.toLowerCase().includes('color')) this.updateGUIPicker(s); else if (typeof this.settings[s] === 'boolean') this.updateGUIToggle(s); });
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
            this.isBindingHotkey = true; this.currentBindingSetting = settingName; const labelEl = this.gui.querySelector(`.anonimbiri-menu-item[data-setting="${settingName}"] label`); document.getElementById('anonimbiri-hotkeyFeatureName').textContent = labelEl ? labelEl.textContent : settingName; this.hotkeyModal.classList.add('active');
        }

        hideHotkeyModal() { this.isBindingHotkey = false; this.currentBindingSetting = null; this.hotkeyModal.classList.remove('active'); }

        makeMenuDraggable() {
            const header = document.getElementById("anonimbiri-menuHeader"); let isDragging = !1, offsetX, offsetY;
            const startDragging = e => { isDragging = !0; const t = this.gui.getBoundingClientRect(), o = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX, i = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY; offsetX = o - t.left, offsetY = i - t.top, document.addEventListener("mousemove", updatePosition), document.addEventListener("mouseup", stopDragging), document.addEventListener("touchmove", updatePosition, { passive: !1 }), document.addEventListener("touchend", stopDragging) }, updatePosition = e => { if (!isDragging) return; const t = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX, o = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY; let i = t - offsetX, n = o - offsetY; const s = 5, a = this.gui.offsetWidth, r = this.gui.offsetHeight; i = Math.max(s, Math.min(i, window.innerWidth - a - s)), n = Math.max(s, Math.min(n, window.innerHeight - r - s)), this.gui.style.left = `${i}px`, this.gui.style.top = `${n}px` }, stopDragging = () => { isDragging = !1, document.removeEventListener("mousemove", updatePosition), document.removeEventListener("mouseup", stopDragging), document.removeEventListener("touchmove", updatePosition), document.removeEventListener("touchend", stopDragging); const e = this.gui.getBoundingClientRect(); this.settings.menuLeftPx = e.left, this.settings.menuTopPx = e.top, this.saveSettings("aimbaeshiro_settings", this.settings) };
            header.addEventListener("mousedown", startDragging), header.addEventListener("touchstart", startDragging, { passive: !1 });
        }

        isDefined(val) { return val !== undefined && val !== null; }
        isTeam(player) { return this.me && this.me.team ? this.me.team === player.team : false; }
        getDistance(p1, p2) { return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2)); }
        getDirection(z1, x1, z2, x2) { return Math.atan2(x1 - x2, z1 - z2); }
        getXDirection(t,e,o,i,s,n){const r=s-e,a=this.getDistance({x:t,y:e,z:o},{x:i,y:s,z:n});return Math.asin(r/a)}
        getTargetPosition(t){const e=this.PLAYER_HEIGHT/5.5;return{x:t.x,y:t.y-t.crouchVal*this.CROUCH_FACTOR+e,z:t.z}}
        isPlayerVisible(player) { if (!this.game?.map?.manager?.canSee) return true; return this.game.map.manager.canSee(this.me, player.x, player.y, player.z); }
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

        world2Screen(worldPosition) {
            if (!this.renderer?.camera) return null;
            const pos = worldPosition.clone(); pos.project(this.renderer.camera);
            if (pos.z > 1) return null;
            return { x: (pos.x + 1) / 2 * this.espCanvas.width, y: (-pos.y + 1) / 2 * this.espCanvas.height, };
        }

        drawCanvasESP(player) {
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
            if (!onScreen) return;
            const boxWidth = xmax - xmin, boxHeight = ymax - ymin;
            this.ctx.save();
            if (this.settings.espLines) {
                const startX = this.espCanvas.width / 2, startY = this.espCanvas.height, endX = xmin + boxWidth / 2, endY = ymax, gradient = this.ctx.createLinearGradient(startX, startY, endX, endY), trailColor = this.settings.espColor;
                const hexToRgba = (hex, alpha) => { let r=0,g=0,b=0; if (hex.length == 7) { r=parseInt(hex.slice(1,3),16); g=parseInt(hex.slice(3,5),16); b=parseInt(hex.slice(5,7),16); } return `rgba(${r},${g},${b},${alpha})`; };
                gradient.addColorStop(0, hexToRgba(trailColor, 0.7)); gradient.addColorStop(1, hexToRgba(trailColor, 0));
                this.ctx.lineWidth = 3; this.ctx.strokeStyle = gradient; this.ctx.shadowColor = trailColor; this.ctx.shadowBlur = 15;
                this.ctx.beginPath(); this.ctx.moveTo(startX, startY); this.ctx.lineTo(endX, endY); this.ctx.stroke();
            }
            if (this.settings.espSquare) { this.ctx.shadowColor = this.settings.boxColor; this.ctx.shadowBlur = 10; this.ctx.lineWidth = 2; this.ctx.strokeStyle = this.settings.boxColor; this.ctx.strokeRect(xmin, ymin, boxWidth, boxHeight); }
            this.ctx.restore();
            if (this.settings.espNameTags) {
                this.ctx.save();
                if (player.health && player.maxHealth) {
                    const healthPercentage = Math.max(0, player.health / player.maxHealth);
                    this.ctx.fillStyle = "rgba(0,0,0,0.5)"; this.ctx.fillRect(xmin-8, ymin, -6, boxHeight);
                    this.ctx.fillStyle = healthPercentage > 0.75 ? "#43A047" : healthPercentage > 0.4 ? "#FDD835" : "#E53935"; this.ctx.fillRect(xmin-8, ymin + boxHeight * (1-healthPercentage), -6, boxHeight * healthPercentage);
                }
                this.ctx.font = "bold 14px Rajdhani, sans-serif";
                this.ctx.fillStyle = "#FFFFFF";
                this.ctx.strokeStyle = "#000000"; this.ctx.lineWidth = 2.5; this.ctx.textAlign = "left";
                let textY = ymin + 1, lineSpacing = 16;
                this.ctx.strokeText(player.name || 'Player', xmax + 5, textY); this.ctx.fillText(player.name || 'Player', xmax + 5, textY); textY += lineSpacing;
                if (player.health) { const healthText = `♥ ${player.health}`; this.ctx.strokeText(healthText, xmax+5, textY); this.ctx.fillText(healthText, xmax+5, textY); textY += lineSpacing; }
                if (player.weapon && this.settings.espWeaponIcons) { const weaponText = `❖ ${player.weapon.name}`; this.ctx.strokeText(weaponText, xmax + 5, textY); this.ctx.fillText(weaponText, xmax + 5, textY); }
                this.ctx.restore();
            }
        }
    }

    new AimbaeShiro();
};

let tokenPromiseResolve;
const tokenPromise = new Promise((resolve) => (tokenPromiseResolve = resolve));
const ifr = document.createElement('iframe');
ifr.src = location.origin + '/';
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
                    const modifiedGameScript = downloadFileSync('https://raw.githubusercontent.com/GameSketchers/AimbaeShiro/refs/heads/main/GameSource/game.js');
                    if (modifiedGameScript) { window.addEventListener('load', () => { Function(cheatInstanceId + '();\n\n' + modifiedGameScript)(); });
                                            } else { console.error("🌸 AimbaeShiro: Failed to download modified game script."); }
                    return;
                }
            }
        }
    }
});
observer.observe(document, { childList: true, subtree: true });
