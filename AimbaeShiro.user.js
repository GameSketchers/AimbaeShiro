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
            const gameInputIndices = { frame: 0, slowMotion: 1, pitch: 2, yaw: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponMelee: 10, weaponSecondary: 11 };

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
            }

            this.controls.target = null;

            if (target && this.me.weapon.secondary !== undefined && this.me.weapon.secondary !== null && !this.me.weapon.melee) {

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
            } else if (target && this.me.weapon.melee) {

                const targetPos = this.getTargetPosition(target);

                target.isTarget = this.settings.markTarget;
                const yaw = this.getDirection(this.me.z, this.me.x, targetPos.z, targetPos.x);
                const pitch = this.getXDirection(this.me.x, this.me.y, this.me.z, targetPos.x, targetPos.y, targetPos.z);
                const compensatedPitch = pitch - (0.3 * this.me.recoilAnimY);

                const distance = this.getDistance(this.me, target);

                const closeRange = 17.610595881164134;
                const throwRange = 65.24113971486675;

                if (distance <= closeRange) {
                    this.controls.target = {
                        xD: compensatedPitch,
                        yD: yaw,
                    };
                    this.controls.update(400);

                    if (this.settings.autoFireEnabled && this.me.reloadTimer === 0 && !this.me.didShoot && this.me.aimVal > 0) {
                        inputPacket[gameInputIndices.shoot] = 1;
                    }
                } else if (distance <= throwRange && this.me.weapon.canThrow) {
                    this.controls.target = {
                        xD: compensatedPitch,
                        yD: yaw,
                    };
                    this.controls.update(400);
                    if (this.settings.autoFireEnabled) {
                        inputPacket[gameInputIndices.scope] = 1;
                        if(this.me.aimVal && this.me.reloadTimer === 0 && !this.me.didShoot){console.log("ateş");inputPacket[gameInputIndices.shoot] = 1;}
                    }
                }
            }
        }

        createGUI() {
            const fontLink = document.createElement('link'); fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap'; fontLink.rel = 'stylesheet'; document.head.appendChild(fontLink);
            const animeFontLink = document.createElement('link'); animeFontLink.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&display=swap'; animeFontLink.rel = 'stylesheet'; document.head.appendChild(animeFontLink);

            const menuCSS = `.anonimbiri-menu-container{font-family:'Orbitron',monospace;position:fixed;width:90vw;max-width:500px;background:rgba(10,10,10,.95);border:2px solid #ff0080;border-radius:15px;box-shadow:0 0 30px rgba(255,0,128,.5),inset 0 0 20px rgba(255,0,128,.1);backdrop-filter:blur(10px);animation:anonimbiri-menuGlow 2s ease-in-out infinite alternate,anonimbiri-slideIn .5s ease-out;user-select:none;z-index:1000;display:none;opacity:0;transition:opacity .3s ease-out,transform .3s ease-out}.anonimbiri-menu-container.visible{display:block;opacity:1}@keyframes anonimbiri-menuGlow{from{box-shadow:0 0 30px rgba(255,0,128,.3),inset 0 0 20px rgba(255,0,128,.1)}to{box-shadow:0 0 50px rgba(255,0,128,.6),inset 0 0 30px rgba(255,0,128,.2)}}@keyframes anonimbiri-slideIn{from{opacity:0;transform:translateY(-20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}.anonimbiri-menu-header{height:250px;background:linear-gradient(45deg,#ff0080,#ff4da6);border-radius:13px 13px 0 0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;cursor:grab}.anonimbiri-menu-header:active{cursor:grabbing}.anonimbiri-menu-header::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background-image:url(https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/banner.jpeg);background-size:cover;background-position:center;opacity:.8;z-index:1;animation:anonimbiri-bannerShift 10s ease-in-out infinite}@keyframes anonimbiri-bannerShift{0%,100%{transform:scale(1.05) rotate(-1deg)}50%{transform:scale(1.1) rotate(1deg)}}.anonimbiri-menu-header::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(45deg,rgba(255,0,128,.3),rgba(255,77,166,.3));z-index:2}.anonimbiri-tab-container{display:flex;background:rgba(20,20,20,.9);border-bottom:1px solid #ff0080}.anonimbiri-tab{flex:1;padding:12px;background:rgba(30,30,30,.8);color:#ff0080;text-align:center;cursor:pointer;transition:all .3s ease;font-weight:700;font-size:12px;letter-spacing:1px;border-right:1px solid rgba(255,0,128,.3);position:relative;overflow:hidden}.anonimbiri-tab::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);transition:left .5s ease}.anonimbiri-tab:hover::before{left:100%}.anonimbiri-tab:last-child{border-right:none}.anonimbiri-tab:hover{background:rgba(255,0,128,.2);color:#fff;transform:translateY(-2px)}.anonimbiri-tab.active{background:linear-gradient(45deg,#ff0080,#ff4da6);color:#fff;box-shadow:0 2px 10px rgba(255,0,128,.5)}.anonimbiri-tab-content{padding:15px;max-height:calc(100vh - 350px);min-height:150px;overflow-y:auto}.anonimbiri-tab-pane{display:none}.anonimbiri-tab-pane.active{display:block;animation:anonimbiri-fadeIn .3s ease}@keyframes anonimbiri-fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.anonimbiri-menu-item{display:flex;justify-content:space-between;align-items:center;padding:10px 15px;margin:8px 0;background:rgba(30,30,30,.8);border:1px solid rgba(255,0,128,.3);border-radius:8px;transition:all .3s ease;cursor:pointer;position:relative;overflow:hidden}.anonimbiri-menu-item::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,0,128,.1),transparent);transition:left .5s ease}.anonimbiri-menu-item:hover::before{left:100%}.anonimbiri-menu-item:hover{background:rgba(255,0,128,.1);border-color:#ff0080;transform:translateX(5px) scale(1.02);box-shadow:0 5px 15px rgba(255,0,128,.3)}.anonimbiri-menu-item.active{background:rgba(255,0,128,.2);border-color:#ff0080}.anonimbiri-menu-item-content{display:flex;align-items:center;gap:12px}.anonimbiri-menu-item-icon{width:20px;height:20px;fill:#ff4da6;transition:all .3s ease}.anonimbiri-menu-item:hover .anonimbiri-menu-item-icon{fill:#ff0080;transform:scale(1.1)}.anonimbiri-menu-item label{color:#ff4da6;font-weight:700;font-size:14px;letter-spacing:1px;cursor:pointer;transition:color .3s ease}.anonimbiri-menu-item:hover label{color:#ff0080}.anonimbiri-controls{display:flex;align-items:center;gap:10px}.anonimbiri-toggle-switch{position:relative;width:50px;height:24px;background:rgba(40,40,40,.8);border-radius:12px;pointer-events:none;transition:all .3s ease;border:1px solid rgba(255,0,128,.3)}.anonimbiri-toggle-switch::before{content:'';position:absolute;top:2px;left:2px;width:18px;height:18px;background:#666;border-radius:50%;transition:all .3s cubic-bezier(.68,-.55,.265,1.55);box-shadow:0 2px 5px rgba(0,0,0,.3)}.anonimbiri-toggle-switch.active{background:linear-gradient(45deg,#ff0080,#ff4da6);box-shadow:0 0 15px rgba(255,0,128,.5)}.anonimbiri-toggle-switch.active::before{left:28px;background:#fff}.anonimbiri-color-container{position:relative}.anonimbiri-color-picker-input{opacity:0;position:absolute;width:40px;height:24px;cursor:pointer}.anonimbiri-color-preview{width:40px;height:24px;border:1px solid #ff0080;border-radius:4px;pointer-events:none;transition:all .3s ease}.anonimbiri-menu-item:hover .anonimbiri-color-preview{transform:scale(1.1);box-shadow:0 0 10px rgba(255,0,128,.7)}.anonimbiri-hotkey{background:rgba(255,0,128,.2);color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;border:1px solid #ff0080;pointer-events:none;min-width:40px;text-align:center}.anonimbiri-menu-item:hover .anonimbiri-hotkey{background:#ff0080;transform:scale(1.05)}.anonimbiri-tab-content::-webkit-scrollbar{width:8px}.anonimbiri-tab-content::-webkit-scrollbar-track{background:rgba(20,20,20,.5);border-radius:4px}.anonimbiri-tab-content::-webkit-scrollbar-thumb{background:#ff0080;border-radius:4px}.anonimbiri-tab-content::-webkit-scrollbar-thumb:hover{background:#ff4da6}.anonimbiri-close-btn{position:absolute;top:10px;right:15px;color:#fff;font-size:20px;cursor:pointer;z-index:4;width:25px;height:25px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);border-radius:50%;transition:all .3s ease}.anonimbiri-close-btn svg{width:16px;height:16px;fill:#fff}.anonimbiri-close-btn:hover{background:#ff0080;transform:rotate(90deg) scale(1.1)}.anonimbiri-hotkey-modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.9);display:none;align-items:center;justify-content:center;z-index:2000;animation:anonimbiri-fadeIn .3s ease}.anonimbiri-hotkey-modal.active{display:flex}.anonimbiri-hotkey-content{background:linear-gradient(135deg,#1a1a1a,#2a1a2a);padding:40px;border-radius:15px;border:2px solid #ff0080;box-shadow:0 0 50px rgba(255,0,128,.7);text-align:center;animation:anonimbiri-modalPulse .5s ease-out}@keyframes anonimbiri-modalPulse{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}.anonimbiri-hotkey-content h2{color:#ff0080;font-size:24px;margin-bottom:20px;letter-spacing:2px}.anonimbiri-hotkey-content p{color:#fff;font-size:16px;margin-bottom:30px}.anonimbiri-hotkey-content p span{color:#ff4da6;font-weight:700}#shiro-menu-button{height:80px;background-color:rgba(255,0,128,.05);border:1px solid rgba(255,0,128,.5);cursor:pointer;background-image:url('https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png');background-size:contain;background-position:center;background-repeat:no-repeat;transition:all .3s ease}#shiro-menu-button:hover{background-color:rgba(255,0,128,.2);border-color:#ff0080;transform:scale(1.03);box-shadow:0 0 15px rgba(255,0,128,.5)}`;
            const style = document.createElement('style'); style.textContent = menuCSS; document.head.appendChild(style);

            const animeIcons = {aimbot:'<path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M4,10C5.1,10 6,10.9 6,12C6,13.1 5.1,14 4,14C2.9,14 2,13.1 2,12C2,10.9 2.9,10 4,10M20,10C21.1,10 22,10.9 22,12C22,13.1 21.1,14 20,14C18.9,14 18,13.1 18,12C18,10.9 18.9,10 20,10M12,18C13.1,18 14,18.9 14,20C14,21.1 13.1,22 12,22C10.9,22 10,21.1 10,20C10,18.9 10.9,18 12,18M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z"/>',rightMouse:'<path d="M7,2A3,3 0 0,0 4,5V19A3,3 0 0,0 7,22H17A3,3 0 0,0 20,19V5A3,3 0 0,0 17,2H7M7,4H11V10H6V5A1,1 0 0,1 7,4M13,4H17A1,1 0 0,1 18,5V10H13V4M6,12H18V19A1,1 0 0,1 17,20H7A1,1 0 0,1 6,19V12M14,6L16,8L14,10V9H15V7H14V6Z"/>',wallCheck:'<path d="M2,2H8V4H4V8H2V2M16,2H22V8H20V4H16V2M2,16V22H8V20H4V16H2M20,16V20H16V22H22V16H20M6,6H18V8H6V6M6,10H10V12H6V10M14,10H18V12H14V10M6,14H10V16H6V14M14,14H18V16H14V14M6,18H18V20H6V18M11,7L13,9L11,11V10H12V8H11V7Z"/>',teamCheck:'<path d="M12,1L21,5V11C21,16.55 17.16,21.74 12,23C6.84,21.74 3,16.55 3,11V5L12,1M12,3.18L5,6.3V11C5,15.92 8.05,20.44 12,21.54C15.95,20.44 19,15.92 19,11V6.3L12,3.18M10,8L11.5,10.5L15,7L16.5,8.5L11.5,13.5L8.5,10.5L10,8Z"/>',autoFire:'<path d="M20,2H4A2,2 0 0,0 2,4V16A2,2 0 0,0 4,18H11V20H8V22H16V20H13V18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M20,16H4V4H20V16M6,6H8V8H6V6M10,6H12V8H10V6M14,6H16V8H14V6M18,6H20V8H18V6M6,10H8V12H6V10M10,10H12V12H10V10M14,10H16V12H14V10M18,10H20V12H18V10M6,14H18V16H6V14Z"/>',espLines:'<path d="M2,12C2,17.52 6.48,22 12,22C13.57,22 15.04,21.62 16.34,20.94L14.93,19.53C14.03,19.82 13.04,20 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C13.04,4 14.03,4.18 14.93,4.47L16.34,3.06C15.04,2.38 13.57,2 12,2C6.48,2 2,6.48 2,12M19,12C19,10.96 18.82,9.97 18.53,9.07L20.94,7.66C21.62,8.96 22,10.43 22,12C22,17.52 17.52,22 12,22C10.43,22 8.96,21.62 7.66,20.94L9.07,19.53C9.97,19.82 10.96,20 12,20A7,7 0 0,0 19,12M8,8L12,12L16,8L14,6L12,8L10,6L8,8Z"/>',espSquare:'<path d="M3,3V7H5V5H7V3H3M17,3V5H19V7H21V3H17M21,17V21H17V19H19V17H21M7,19V21H3V17H5V19H7M9,5H15V7H9V5M5,9H7V15H5V9M17,9H19V15H17V9M9,17H15V19H9V17M11,8V10H13V8H11M8,11V13H10V11H8M14,11V13H16V11H14M11,14V16H13V14H11Z"/>',nameTags:'<path d="M2,4A2,2 0 0,0 0,6V18A2,2 0 0,0 2,20H22A2,2 0 0,0 24,18V6A2,2 0 0,0 22,4H2M2,6H22V18H2V6M4,8V10H6V8H4M8,8V10H20V8H8M4,12V14H6V12H4M8,12V14H12V12H8M14,12V14H20V12H14M4,16V18H6V16H4M8,16V18H16V16H8M18,16V18H20V16H18Z"/>',weaponIcons:'<path d="M20,2H18V4H17V6H15V4H13V2H11V4H9V6H7V4H5V2H3V4H2V6H4V8H2V10H4V12H6V14H4V16H2V18H4V20H6V18H8V20H10V18H12V20H14V18H16V20H18V18H20V20H22V18H20V16H22V14H20V12H22V10H20V8H22V6H20V4H22V2H20M18,6V8H16V10H14V8H12V10H10V8H8V10H6V8H4V16H6V14H8V16H10V14H12V16H14V14H16V16H18V8Z"/>',colorPicker:'<path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A8.5,8.5 0 0,0 20.5,12.5A8.5,8.5 0 0,0 12,3Z"/>',wireframe:'<path d="M2,2V6H6V2H2M8,2V6H12V2H8M14,2V6H18V2H14M20,2V6H24V2H20M2,8V12H6V8H2M8,8V12H12V8H8M14,8V12H18V8H14M20,8V12H24V8H20M2,14V18H6V14H2M8,14V18H12V14H8M14,14V18H18V14H14M20,14V18H24V14H20M2,20V24H6V20H2M8,20V24H12V20H8M14,20V24H18V20H14M20,20V24H24V20H20Z"/>',unlockSkins:'<path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>',bunnyHop:'<path d="M12,2A3,3 0 0,1 15,5V8A1,1 0 0,1 14,9H13V11H16A1,1 0 0,1 17,12V15A3,3 0 0,1 14,18H13V20A1,1 0 0,1 12,21A1,1 0 0,1 11,20V18H10A3,3 0 0,1 7,15V12A1,1 0 0,1 8,11H11V9H10A1,1 0 0,1 9,8V5A3,3 0 0,1 12,2M12,4A1,1 0 0,0 11,5V7H13V5A1,1 0 0,0 12,4M9,13V15A1,1 0 0,0 10,16H14A1,1 0 0,0 15,15V13H9Z"/>',autoNuke:'<path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2M12,6.5L11.5,8.5L9.5,8.75L11.5,9L12,11L12.5,9L14.5,8.75L12.5,8.5L12,6.5M7,12L8,15L12,16L8,17L7,20L6,17L2,16L6,15L7,12M17,12L18,15L22,16L18,17L17,20L16,17L12,16L16,15L17,12Z"/>',antiKick:'<path d="M12,1L21,5V11C21,16.55 17.16,21.74 12,23C6.84,21.74 3,16.55 3,11V5L12,1M12,3.18L5,6.3V11C5,15.92 8.05,20.44 12,21.54C15.95,20.44 19,15.92 19,11V6.3L12,3.18M9,9L7.5,10.5L11,14L16.5,8.5L15,7L11,11L9,9Z"/>',autoReload:'<path d="M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,13.57 4.46,15.03 5.24,16.26L6.7,14.8C6.25,13.97 6,13 6,12A6,6 0 0,1 12,6M18.76,7.74L17.3,9.2C17.74,10.04 18,11 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.43 19.54,8.97 18.76,7.74Z"/>',hotkeys:'<path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V5H19V19M6,7H8V9H6V7M9,7H11V9H9V7M12,7H14V9H12V7M15,7H17V9H15V7M6,10H8V12H6V10M9,10H11V12H9V10M12,10H14V12H12V10M15,10H17V12H15V10M6,13H8V15H6V13M9,13H11V15H9V13M12,13H14V15H12V13M15,13H17V15H15V13M7,16H16V18H7V16Z"/>'};

            const menuHTML = `<div class="anonimbiri-menu-container" id="anonimbiri-cheatMenu"><div class="anonimbiri-menu-header" id="anonimbiri-menuHeader"><div class="anonimbiri-close-btn" id="anonimbiri-closeBtn"><svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg></div></div><div class="anonimbiri-tab-container"><div class="anonimbiri-tab active" data-tab="aimbot">AIMBOT</div><div class="anonimbiri-tab" data-tab="esp">ESP</div><div class="anonimbiri-tab" data-tab="misc">MISC</div><div class="anonimbiri-tab" data-tab="hotkeys">HOTKEYS</div></div><div class="anonimbiri-tab-content"><div class="anonimbiri-tab-pane active" id="anonimbiri-tab-aimbot">${this.createMenuItemHTML('toggle','aimbotEnabled','Aimbot Enabled',animeIcons.aimbot)}${this.createMenuItemHTML('toggle','aimbotOnRightMouse','Right Mouse Trigger',animeIcons.rightMouse)}${this.createMenuItemHTML('toggle','aimbotWallCheck','Wall Check',animeIcons.wallCheck)}${this.createMenuItemHTML('toggle','aimbotTeamCheck','Team Check',animeIcons.teamCheck)}${this.createMenuItemHTML('toggle','autoFireEnabled','Auto Fire',animeIcons.autoFire)}</div><div class="anonimbiri-tab-pane" id="anonimbiri-tab-esp">${this.createMenuItemHTML('toggle','espTeamCheck','Team Check',animeIcons.teamCheck)}${this.createMenuItemHTML('toggle','espLines','Energy Trail ESP',animeIcons.espLines)}${this.createMenuItemHTML('toggle','espSquare','Glowing Box ESP',animeIcons.espSquare)}${this.createMenuItemHTML('toggle','espNameTags','Full Info (Name/HP/Wpn)',animeIcons.nameTags)}${this.createMenuItemHTML('toggle','espWeaponIcons','Show Weapon (in Full Info)',animeIcons.weaponIcons)}${this.createMenuItemHTML('color','espColor','Trail Color',animeIcons.colorPicker)}${this.createMenuItemHTML('color','boxColor','Box & Info Color',animeIcons.colorPicker)}</div><div class="anonimbiri-tab-pane" id="anonimbiri-tab-misc">${this.createMenuItemHTML('toggle','wireframeEnabled','Wireframe',animeIcons.wireframe)}${this.createMenuItemHTML('toggle','unlockSkins','Unlock All Skins',animeIcons.unlockSkins)}${this.createMenuItemHTML('toggle','bhopEnabled','Bunny Hop',animeIcons.bunnyHop)}${this.createMenuItemHTML('toggle','autoNuke','Auto Nuke',animeIcons.autoNuke)}${this.createMenuItemHTML('toggle','antikick','Anti Kick',animeIcons.antiKick)}${this.createMenuItemHTML('toggle','autoReload','Auto Reload',animeIcons.autoReload)}</div><div class="anonimbiri-tab-pane" id="anonimbiri-tab-hotkeys">${this.createMenuItemHTML('hotkey','toggleMenu','Toggle Menu',animeIcons.hotkeys)}${this.createMenuItemHTML('hotkey','aimbotEnabled','Toggle Aimbot',animeIcons.aimbot)}${this.createMenuItemHTML('hotkey','aimbotWallCheck','Toggle Wall Check',animeIcons.wallCheck)}${this.createMenuItemHTML('hotkey','aimbotTeamCheck','Toggle Aimbot Team',animeIcons.teamCheck)}${this.createMenuItemHTML('hotkey','espTeamCheck','Toggle ESP Team',animeIcons.teamCheck)}${this.createMenuItemHTML('hotkey','espNameTags','Toggle Full Info',animeIcons.nameTags)}${this.createMenuItemHTML('hotkey','espWeaponIcons','Toggle Weapon Icon',animeIcons.weaponIcons)}${this.createMenuItemHTML('hotkey','autoFireEnabled','Toggle Auto Fire',animeIcons.autoFire)}${this.createMenuItemHTML('hotkey','espLines','Toggle Energy Trail',animeIcons.espLines)}${this.createMenuItemHTML('hotkey','espSquare','Toggle Glowing Box',animeIcons.espSquare)}${this.createMenuItemHTML('hotkey','wireframeEnabled','Toggle Wireframe',animeIcons.wireframe)}${this.createMenuItemHTML('hotkey','unlockSkins','Toggle Unlock Skins',animeIcons.unlockSkins)}${this.createMenuItemHTML('hotkey','bhopEnabled','Toggle Bunny Hop',animeIcons.bunnyHop)}</div></div></div>`;

            const container = document.createElement('div'); container.innerHTML = menuHTML; document.body.appendChild(container);
            this.espCanvas = document.createElement('canvas'); this.espCanvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1001;'; document.body.appendChild(this.espCanvas);
            this.ctx = this.espCanvas.getContext('2d');
            this.gui = document.getElementById('anonimbiri-cheatMenu');
            this.hotkeyModal = document.getElementById('anonimbiri-hotkeyModal');
            if (this.settings.menuLeftPx !== null && this.settings.menuTopPx !== null) { this.gui.style.left = `${this.settings.menuLeftPx}px`; this.gui.style.top = `${this.settings.menuTopPx}px`; } else { setTimeout(() => { const t = this.gui.getBoundingClientRect(); this.gui.style.left = `calc(50% - ${t.width / 2}px)`; this.gui.style.top = `calc(50% - ${t.height / 2}px)`; const e = this.gui.getBoundingClientRect(); this.settings.menuLeftPx = e.left; this.settings.menuTopPx = e.top; this.saveSettings('aimbaeshiro_settings', this.settings); }, 100); }
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
