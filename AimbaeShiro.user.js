// ==UserScript==
// @name         AimbaeShiro – Krunker.IO Cheat
// @name:tr      AimbaeShiro – Krunker.IO Hilesi
// @name:ja      AimbaeShiro – Krunker.IO チート
// @name:az      AimbaeShiro – Krunker.IO Hilesi
// @namespace    https://github.com/GameSketchers/AimbaeShiro
// @version      1.1.4
// @description  A powerful anime-themed cheat suite with Aimbot, Wall-Check, Bhop, Skeleton & Box ESP.
// @description:tr  Aimbot, duvar arkası kontrol, Bhop, iskelet ve kutu ESP içeren anime temalı güçlü bir hile aracı.
// @description:ja  エイムボット、ウォールチェック、バニーホップ、スケルトン＆ボックスESPを備えたアニメ風の高機能チートツール。
// @description:az  Aimbot, divar arxası yoxlama, Bhop, skelet və qutu ESP ilə anime tərzli güclü bir hile vasitəsidir.
// @author       anonimbiri
// @match        *://krunker.io/*
// @match        *://browserfps.com/*
// @exclude      *://krunker.io/social*
// @exclude      *://krunker.io/editor*
// @icon         https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/logo.png
// @grant        GM_setValue
// @grant        GM_getValue
// @supportURL   https://github.com/GameSketchers/AimbaeShiro/issues/new?labels=bug&type=bug&template=bug_report.md&title=Bug+Report
// @homepage     https://github.com/GameSketchers/AimbaeShiro
// @run-at       document-start
// @tag          games
// @license      MIT
// @noframes
// @require      https://unpkg.com/three@0.150.0/build/three.min.js
// ==/UserScript==

(function() {
    'use strict';

    class KrunkerCheats {
        constructor() {
            this.THREE = window.THREE;
            if (!this.THREE) {
                console.error("🌸 Anime Cheats: THREE.js not loaded! Waiting...");
                setTimeout(() => this.initializeCheats(), 1000);
                return;
            }
            this.initializeCheats();
        }

        initializeCheats() {
            this.THREE = window.THREE;
            if (!this.THREE) {
                console.error("🌸 Anime Cheats: THREE.js failed to load after retry.");
                return;
            }
            console.log("🌸 Anime Cheats: Initializing with THREE.js v" + this.THREE.REVISION);

            this.defaultSettings = {
                aimbotEnabled: true,
                aimbotOnRightMouse: false,
                aimbotWallCheck: true,
                autoFireEnabled: false,
                espLines: true,
                espSkeleton: true,
                espSquare: true,
                wireframeEnabled: false,
                bhopEnabled: false,
                menuVisible: true,
                espColor: "#ff0080",
                skeletonColor: "#ff0080",
                boxColor: "#ff0080",
                menuTopPx: null,
                menuLeftPx: null,
            };
            this.defaultHotkeys = {
                toggleMenu: 'F2',
                aimbotEnabled: 'F3',
                espLines: 'F4',
                espSkeleton: 'F5',
                espSquare: 'F6',
                wireframeEnabled: 'F7',
                bhopEnabled: 'F8',
                autoFireEnabled: 'F9',
                aimbotWallCheck: 'F10',
            };
            this.settings = this.loadSettings('anonimbiri_settings', this.defaultSettings);
            this.hotkeys = this.loadSettings('anonimbiri_hotkeys', this.defaultHotkeys);

            this.scene = null;
            this.myPlayer = null;
            this.players = [];
            this.rightMouseDown = false;
            this.spacebarDown = false;
            this.isBindingHotkey = false;
            this.currentBindingSetting = null;
            this.injectTimer = null;
            this.originalArrayPush = Array.prototype.push;
            this.tempVector = new this.THREE.Vector3();
            this.tempObject = new this.THREE.Object3D();
            this.tempObject.rotation.order = 'YXZ';
            this.cameraPos = new this.THREE.Vector3();
            this.managedESP = new Map();
            this.raycaster = new this.THREE.Raycaster();
            this.bhopLoopTimeout = null;
            this.bhopIsCrouching = false;
            this.autoFireTimer = null;

            this.createGeometries();
            this.createMaterials();
            this.createGUI();
            this.addEventListeners();
            this.animate();
        }

        loadSettings(key, defaults) {
            let loaded = GM_getValue(key, null);
            if (loaded) {
                try {
                    return { ...defaults, ...JSON.parse(loaded) };
                } catch (e) { console.error("🌸 Anime Cheats: Error parsing settings:", e); }
            }
            return defaults;
        }

        saveSettings(key, value) { GM_setValue(key, JSON.stringify(value)); }

        attemptInjection() {
            if (this.scene) return;
            const loadingBg = document.getElementById('loadingBg');
            if (loadingBg && loadingBg.style.display === 'none' && !this.injectTimer) {
                this.injectTimer = setTimeout(() => {
                    console.log("🌸 Anime Cheats: Attempting to inject Array.prototype.push proxy...");
                    Array.prototype.push = this.proxiedArrayPush.bind(this);
                }, 2000);
            }
            requestAnimationFrame(() => this.attemptInjection());
        }

        proxiedArrayPush(object) {
            try {
                if (object?.parent?.type === 'Scene' && object.parent.name === 'Main') {
                    console.log('🌸 Anime Cheats: Main Scene found!');
                    this.scene = object.parent;
                    Array.prototype.push = this.originalArrayPush;
                    clearTimeout(this.injectTimer);
                    this.injectTimer = null;
                }
            } catch (error) {}
            return this.originalArrayPush.apply(this, arguments);
        }

        // ISTENEN SIMULASYON YÖNTEMİ
        simulateKey(keyCode, eventType = 'keypress') {
            const oEvent = document.createEvent('KeyboardEvent');
            Object.defineProperty(oEvent, 'keyCode', { get: function() { return this.keyCodeVal; } });
            Object.defineProperty(oEvent, 'which', { get: function() { return this.keyCodeVal; } });

            if (oEvent.initKeyboardEvent) {
                oEvent.initKeyboardEvent(eventType, true, true, document.defaultView, false, false, false, false, keyCode, 0);
            } else {
                oEvent.initKeyEvent(eventType, true, true, document.defaultView, false, false, false, false, keyCode, 0);
            }
            oEvent.keyCodeVal = keyCode;
            document.dispatchEvent(oEvent);
        }

        simulateMouse(eventType, button) {
            const oEvent = document.createEvent('MouseEvent');
            oEvent.initMouseEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, button, null);
            document.dispatchEvent(oEvent);
        }

        createGeometries() {
            const squareVertices = [-2.5, -5.5, 0, 2.5, -5.5, 0, 2.5, 5.5, 0, -2.5, 5.5, 0];
            this.squareGeometry = new this.THREE.BufferGeometry();
            this.squareGeometry.setAttribute('position', new this.THREE.Float32BufferAttribute(squareVertices, 3));
            this.espLineGeometry = new this.THREE.BufferGeometry();
            this.espLinePositionsAttribute = new this.THREE.Float32BufferAttribute(new Float32Array(100 * 6), 3);
            this.espLineGeometry.setAttribute('position', this.espLinePositionsAttribute);
        }

        createShaderMaterial(color) {
            return new this.THREE.ShaderMaterial({
                uniforms: { u_color: { value: new this.THREE.Color(color) }, u_time: { value: 0.0 } },
                vertexShader: `uniform float u_time; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = 0.999; }`,
                fragmentShader: `uniform vec3 u_color; uniform float u_time; void main() { float pulse = 0.8 + 0.2 * sin(u_time * 5.0); gl_FragColor = vec4(u_color * pulse, 1.0); }`,
                depthTest: false, depthWrite: false, transparent: true, blending: this.THREE.AdditiveBlending
            });
        }

        createMaterials() {
            this.lineMaterial = this.createShaderMaterial(this.settings.espColor);
            this.skeletonMaterial = this.createShaderMaterial(this.settings.skeletonColor);
            this.squareMaterial = this.createShaderMaterial(this.settings.boxColor);
            this.materials = [this.lineMaterial, this.skeletonMaterial, this.squareMaterial];
        }

        createGUI() {
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap';
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);

            const menuCSS = `
                .anonimbiri-menu-container { font-family: 'Orbitron', monospace; position: fixed; width: 420px; background: rgba(10, 10, 10, 0.95); border: 2px solid #ff0080; border-radius: 15px; box-shadow: 0 0 30px rgba(255, 0, 128, 0.5), inset 0 0 20px rgba(255, 0, 128, 0.1); backdrop-filter: blur(10px); animation: anonimbiri-menuGlow 2s ease-in-out infinite alternate, anonimbiri-slideIn 0.5s ease-out; user-select: none; z-index: 1000; display: none; opacity: 0; transition: opacity 0.3s ease-out, transform 0.3s ease-out; }
                .anonimbiri-menu-container.visible { display: block; opacity: 1; }
                @keyframes anonimbiri-menuGlow { from { box-shadow: 0 0 30px rgba(255, 0, 128, 0.3), inset 0 0 20px rgba(255, 0, 128, 0.1); } to { box-shadow: 0 0 50px rgba(255, 0, 128, 0.6), inset 0 0 30px rgba(255, 0, 128, 0.2); } }
                @keyframes anonimbiri-slideIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .anonimbiri-menu-header { height: 100px; background: linear-gradient(45deg, #ff0080, #ff4da6); border-radius: 13px 13px 0 0; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; cursor: grab; }
                .anonimbiri-menu-header:active { cursor: grabbing; }
                .anonimbiri-menu-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('https://cdn.jsdelivr.net/gh/GameSketchers/AimbaeShiro@main/Assets/banner.jpeg'); background-size: cover; background-position: center; opacity: 0.8; z-index: 1; animation: anonimbiri-bannerShift 10s ease-in-out infinite; }
                @keyframes anonimbiri-bannerShift { 0%, 100% { transform: scale(1.1) rotate(-1deg); } 50% { transform: scale(1.15) rotate(1deg); } }
                .anonimbiri-menu-header::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(255, 0, 128, 0.3), rgba(255, 77, 166, 0.3)); z-index: 2; }
                .anonimbiri-tab-container { display: flex; background: rgba(20, 20, 20, 0.9); border-bottom: 1px solid #ff0080; }
                .anonimbiri-tab { flex: 1; padding: 12px; background: rgba(30, 30, 30, 0.8); color: #ff0080; text-align: center; cursor: pointer; transition: all 0.3s ease; font-weight: 700; font-size: 12px; letter-spacing: 1px; border-right: 1px solid rgba(255, 0, 128, 0.3); position: relative; overflow: hidden; }
                .anonimbiri-tab::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); transition: left 0.5s ease; }
                .anonimbiri-tab:hover::before { left: 100%; }
                .anonimbiri-tab:last-child { border-right: none; }
                .anonimbiri-tab:hover { background: rgba(255, 0, 128, 0.2); color: white; transform: translateY(-2px); }
                .anonimbiri-tab.active { background: linear-gradient(45deg, #ff0080, #ff4da6); color: white; box-shadow: 0 2px 10px rgba(255, 0, 128, 0.5); }
                .anonimbiri-tab-content { padding: 15px; max-height: 350px; overflow-y: auto; }
                .anonimbiri-tab-pane { display: none; }
                .anonimbiri-tab-pane.active { display: block; animation: anonimbiri-fadeIn 0.3s ease; }
                @keyframes anonimbiri-fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .anonimbiri-menu-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; margin: 8px 0; background: rgba(30, 30, 30, 0.8); border: 1px solid rgba(255, 0, 128, 0.3); border-radius: 8px; transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden; }
                .anonimbiri-menu-item::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 0, 128, 0.1), transparent); transition: left 0.5s ease; }
                .anonimbiri-menu-item:hover::before { left: 100%; }
                .anonimbiri-menu-item:hover { background: rgba(255, 0, 128, 0.1); border-color: #ff0080; transform: translateX(5px) scale(1.02); box-shadow: 0 5px 15px rgba(255, 0, 128, 0.3); }
                .anonimbiri-menu-item.active { background: rgba(255, 0, 128, 0.2); border-color: #ff0080; }
                .anonimbiri-menu-item-content { display: flex; align-items: center; gap: 12px; }
                .anonimbiri-menu-item-icon { width: 20px; height: 20px; fill: #ff4da6; transition: all 0.3s ease; }
                .anonimbiri-menu-item:hover .anonimbiri-menu-item-icon { fill: #ff0080; transform: scale(1.1); }
                .anonimbiri-menu-item label { color: #ff4da6; font-weight: 700; font-size: 14px; letter-spacing: 1px; cursor: pointer; transition: color 0.3s ease; }
                .anonimbiri-menu-item:hover label { color: #ff0080; }
                .anonimbiri-controls { display: flex; align-items: center; gap: 10px; }
                .anonimbiri-toggle-switch { position: relative; width: 50px; height: 24px; background: rgba(40, 40, 40, 0.8); border-radius: 12px; pointer-events: none; transition: all 0.3s ease; border: 1px solid rgba(255, 0, 128, 0.3); }
                .anonimbiri-toggle-switch::before { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: #666; border-radius: 50%; transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); }
                .anonimbiri-toggle-switch.active { background: linear-gradient(45deg, #ff0080, #ff4da6); box-shadow: 0 0 15px rgba(255, 0, 128, 0.5); }
                .anonimbiri-toggle-switch.active::before { left: 28px; background: white; }
                .anonimbiri-color-container { position: relative; }
                .anonimbiri-color-picker-input { opacity: 0; position: absolute; width: 40px; height: 24px; cursor: pointer; }
                .anonimbiri-color-preview { width: 40px; height: 24px; border: 1px solid #ff0080; border-radius: 4px; pointer-events: none; transition: all 0.3s ease; }
                .anonimbiri-menu-item:hover .anonimbiri-color-preview { transform: scale(1.1); box-shadow: 0 0 10px rgba(255, 0, 128, 0.7); }
                .anonimbiri-hotkey { background: rgba(255, 0, 128, 0.2); color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; border: 1px solid #ff0080; pointer-events: none; min-width: 40px; text-align: center; }
                .anonimbiri-menu-item:hover .anonimbiri-hotkey { background: #ff0080; transform: scale(1.05); }
                .anonimbiri-tab-content::-webkit-scrollbar { width: 8px; }
                .anonimbiri-tab-content::-webkit-scrollbar-track { background: rgba(20, 20, 20, 0.5); border-radius: 4px; }
                .anonimbiri-tab-content::-webkit-scrollbar-thumb { background: #ff0080; border-radius: 4px; }
                .anonimbiri-tab-content::-webkit-scrollbar-thumb:hover { background: #ff4da6; }
                .anonimbiri-close-btn { position: absolute; top: 10px; right: 15px; color: white; font-size: 20px; cursor: pointer; z-index: 4; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.5); border-radius: 50%; transition: all 0.3s ease; }
                .anonimbiri-close-btn svg { width: 16px; height: 16px; fill: white; }
                .anonimbiri-close-btn:hover { background: #ff0080; transform: rotate(90deg) scale(1.1); }
                .anonimbiri-hotkey-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); display: none; align-items: center; justify-content: center; z-index: 2000; animation: anonimbiri-fadeIn 0.3s ease; }
                .anonimbiri-hotkey-modal.active { display: flex; }
                .anonimbiri-hotkey-content { background: linear-gradient(135deg, #1a1a1a, #2a1a2a); padding: 40px; border-radius: 15px; border: 2px solid #ff0080; box-shadow: 0 0 50px rgba(255, 0, 128, 0.7); text-align: center; animation: anonimbiri-modalPulse 0.5s ease-out; }
                @keyframes anonimbiri-modalPulse { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .anonimbiri-hotkey-content h2 { color: #ff0080; font-size: 24px; margin-bottom: 20px; letter-spacing: 2px; }
                .anonimbiri-hotkey-content p { color: white; font-size: 16px; margin-bottom: 30px; }
                .anonimbiri-hotkey-content p span { color: #ff4da6; font-weight: bold; }
            `;

            const style = document.createElement('style');
            style.textContent = menuCSS;
            document.head.appendChild(style);

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
                            ${this.createMenuItemHTML('toggle', 'aimbotEnabled', 'Aimbot Enabled', '<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z"/>')}
                            ${this.createMenuItemHTML('toggle', 'aimbotOnRightMouse', 'Right Mouse Trigger', '<path d="M11,1.07C7.05,1.56 4,4.92 4,9H7L12,4L17,9H20C20,4.92 16.95,1.56 13,1.07V1A1,1 0 0,0 11,1V1.07M18,10H6A2,2 0 0,0 4,12V22A2,2 0 0,0 6,24H18A2,2 0 0,0 20,22V12A2,2 0 0,0 18,10M16,12V14H8V12H16Z"/>')}
                            ${this.createMenuItemHTML('toggle', 'aimbotWallCheck', 'Wall Check', '<path d="M2,2V22H4V20H20V22H22V2H20V4H4V2H2M6,6H18V18H6V6M8,8V16H16V8H8M10,10H14V14H10V10Z"/>')}
                            ${this.createMenuItemHTML('toggle', 'autoFireEnabled', 'Auto Fire', '<path d="M21.71,5.29L18.71,2.29A1,1 0 0,0 17.29,2.29L16,3.59L11.71,7.88C11.69,7.88 11.68,7.89 11.66,7.89L8.34,11.21C8.32,11.23 8.31,11.24 8.29,11.26L2.29,17.26A1,1 0 0,0 2.29,18.68L5.29,21.68A1,1 0 0,0 6.71,21.68L12.71,15.68C12.73,15.66 12.74,15.65 12.76,15.63L16.08,12.31C16.1,12.29 16.11,12.28 16.13,12.26L20.42,8L21.71,6.71A1,1 0 0,0 21.71,5.29M6,20.27L3.73,18L8.66,13.07L10.93,15.34L6,20.27M12.34,14.93L9.07,11.66L11.66,9.07L14.93,12.34L12.34,14.93M16.34,11.93L12.07,7.66L17.29,2.44L21.56,6.71L16.34,11.93Z"/>')}
                        </div>
                        <div class="anonimbiri-tab-pane" id="anonimbiri-tab-esp">
                            ${this.createMenuItemHTML('toggle', 'espLines', 'ESP Lines', '<path d="M15,3V7.59L7.59,15H3V21H9V16.42L16.42,9H21V3M17,5H19V7H17M5,17H7V19H5"/>')}
                            ${this.createMenuItemHTML('toggle', 'espSkeleton', 'ESP Skeleton', '<path d="M12,2A3,3 0 0,1 15,5A3,3 0 0,1 12,8A3,3 0 0,1 9,5A3,3 0 0,1 12,2M21,9V7H15L13.5,7.5C13.1,7.4 12.6,7.5 12.1,7.8L10.5,9L12,10.5L13.5,9H15V15L13.5,17H10.5L9,15V9L7.5,7.5C7.1,7.4 6.6,7.5 6.1,7.8L4.5,9L6,10.5L7.5,9H9V15L10.5,17H13.5L15,15V9H21M12,17.5C11.2,17.5 10.5,18.2 10.5,19S11.2,20.5 12,20.5 13.5,19.8 13.5,19 12.8,17.5 12,17.5Z"/>')}
                            ${this.createMenuItemHTML('toggle', 'espSquare', 'Box ESP', '<path d="M3,3V21H21V3H3M5,5H19V19H5V5Z"/>')}
                            ${this.createMenuItemHTML('color', 'espColor', 'Lines Color', '<path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A8.5,8.5 0 0,0 20.5,12.5A8.5,8.5 0 0,0 12,3Z"/>')}
                            ${this.createMenuItemHTML('color', 'skeletonColor', 'Skeleton Color', '<path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A8.5,8.5 0 0,0 20.5,12.5A8.5,8.5 0 0,0 12,3Z"/>')}
                            ${this.createMenuItemHTML('color', 'boxColor', 'Box Color', '<path d="M17.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,9A1.5,1.5 0 0,1 19,10.5A1.5,1.5 0 0,1 17.5,12M14.5,8A1.5,1.5 0 0,1 13,6.5A1.5,1.5 0 0,1 14.5,5A1.5,1.5 0 0,1 16,6.5A1.5,1.5 0 0,1 14.5,8M9.5,8A1.5,1.5 0 0,1 8,6.5A1.5,1.5 0 0,1 9.5,5A1.5,1.5 0 0,1 11,6.5A1.5,1.5 0 0,1 9.5,8M6.5,12A1.5,1.5 0 0,1 5,10.5A1.5,1.5 0 0,1 6.5,9A1.5,1.5 0 0,1 8,10.5A1.5,1.5 0 0,1 6.5,12M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A8.5,8.5 0 0,0 20.5,12.5A8.5,8.5 0 0,0 12,3Z"/>')}
                        </div>
                        <div class="anonimbiri-tab-pane" id="anonimbiri-tab-misc">
                            ${this.createMenuItemHTML('toggle', 'wireframeEnabled', 'Wireframe', '<path d="M12,2L2,7L12,12L22,7L12,2M2,17L12,22L22,17L12,12L2,17Z"/>')}
                            ${this.createMenuItemHTML('toggle', 'bhopEnabled', 'Bunny Hop', '<path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M7,9L12,14L17,9H7Z"/>')}
                        </div>
                        <div class="anonimbiri-tab-pane" id="anonimbiri-tab-hotkeys">
                            ${this.createMenuItemHTML('hotkey', 'toggleMenu', 'Toggle Menu', '<path d="M6,2A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6M6,4H13V9H18V20H6V4Z"/>')}
                            ${this.createMenuItemHTML('hotkey', 'aimbotEnabled', 'Toggle Aimbot', '<path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z"/>')}
                            ${this.createMenuItemHTML('hotkey', 'aimbotWallCheck', 'Toggle Wall Check', '<path d="M2,2V22H4V20H20V22H22V2H20V4H4V2H2M6,6H18V18H6V6M8,8V16H16V8H8M10,10H14V14H10V10Z"/>')}
                            ${this.createMenuItemHTML('hotkey', 'autoFireEnabled', 'Toggle Auto Fire', '<path d="M21.71,5.29L18.71,2.29A1,1 0 0,0 17.29,2.29L16,3.59L11.71,7.88C11.69,7.88 11.68,7.89 11.66,7.89L8.34,11.21C8.32,11.23 8.31,11.24 8.29,11.26L2.29,17.26A1,1 0 0,0 2.29,18.68L5.29,21.68A1,1 0 0,0 6.71,21.68L12.71,15.68C12.73,15.66 12.74,15.65 12.76,15.63L16.08,12.31C16.1,12.29 16.11,12.28 16.13,12.26L20.42,8L21.71,6.71A1,1 0 0,0 21.71,5.29M6,20.27L3.73,18L8.66,13.07L10.93,15.34L6,20.27M12.34,14.93L9.07,11.66L11.66,9.07L14.93,12.34L12.34,14.93M16.34,11.93L12.07,7.66L17.29,2.44L21.56,6.71L16.34,11.93Z"/>')}
                            ${this.createMenuItemHTML('hotkey', 'espLines', 'Toggle ESP Lines', '<path d="M15,3V7.59L7.59,15H3V21H9V16.42L16.42,9H21V3M17,5H19V7H17M5,17H7V19H5"/>')}
                            ${this.createMenuItemHTML('hotkey', 'espSkeleton', 'Toggle ESP Skeleton', '<path d="M12,2A3,3 0 0,1 15,5A3,3 0 0,1 12,8A3,3 0 0,1 9,5A3,3 0 0,1 12,2M21,9V7H15L13.5,7.5C13.1,7.4 12.6,7.5 12.1,7.8L10.5,9L12,10.5L13.5,9H15V15L13.5,17H10.5L9,15V9L7.5,7.5C7.1,7.4 6.6,7.5 6.1,7.8L4.5,9L6,10.5L7.5,9H9V15L10.5,17H13.5L15,15V9H21M12,17.5C11.2,17.5 10.5,18.2 10.5,19S11.2,20.5 12,20.5 13.5,19.8 13.5,19 12.8,17.5 12,17.5Z"/>')}
                            ${this.createMenuItemHTML('hotkey', 'espSquare', 'Toggle Box ESP', '<path d="M3,3V21H21V3H3M5,5H19V19H5V5Z"/>')}
                            ${this.createMenuItemHTML('hotkey', 'wireframeEnabled', 'Toggle Wireframe', '<path d="M12,2L2,7L12,12L22,7L12,2M2,17L12,22L22,17L12,12L2,17Z"/>')}
                            ${this.createMenuItemHTML('hotkey', 'bhopEnabled', 'Toggle Bunny Hop', '<path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M7,9L12,14L17,9H7Z"/>')}
                        </div>
                    </div>
                </div>
                <div class="anonimbiri-hotkey-modal" id="anonimbiri-hotkeyModal">
                    <div class="anonimbiri-hotkey-content">
                        <h2>SET HOTKEY</h2>
                        <p>Press any key for <span id="anonimbiri-hotkeyFeatureName"></span></p>
                        <p style="font-size: 12px; opacity: 0.7;">(Press Escape to cancel)</p>
                    </div>
                </div>
            `;

            const container = document.createElement('div');
            container.innerHTML = menuHTML;
            document.body.appendChild(container);
            this.gui = document.getElementById('anonimbiri-cheatMenu');
            this.hotkeyModal = document.getElementById('anonimbiri-hotkeyModal');

            if (this.settings.menuLeftPx !== null && this.settings.menuTopPx !== null) {
                this.gui.style.left = `${this.settings.menuLeftPx}px`;
                this.gui.style.top = `${this.settings.menuTopPx}px`;
            } else {
                setTimeout(() => {
                    const rect = this.gui.getBoundingClientRect();
                    this.gui.style.left = `calc(50% - ${rect.width / 2}px)`;
                    this.gui.style.top = `calc(50% - ${rect.height / 2}px)`;
                    const newRect = this.gui.getBoundingClientRect();
                    this.settings.menuLeftPx = newRect.left;
                    this.settings.menuTopPx = newRect.top;
                    this.saveSettings('anonimbiri_settings', this.settings);
                }, 100);
            }

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


        addEventListeners() {
            window.addEventListener('pointerdown', (e) => { if (e.button === 2) this.rightMouseDown = true; });
            window.addEventListener('pointerup', (e) => { if (e.button === 2) this.rightMouseDown = false; });
            window.addEventListener('keydown', (e) => {
                if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
                if (this.isBindingHotkey) {
                    e.preventDefault(); e.stopPropagation();
                    if (e.code === 'Escape') { this.hideHotkeyModal(); return; }
                    if (Object.values(this.hotkeys).includes(e.code)) { console.warn("🌸 Anime Cheats: Key already assigned!"); return; }
                    this.hotkeys[this.currentBindingSetting] = e.code;
                    this.saveSettings('anonimbiri_hotkeys', this.hotkeys);
                    this.updateHotkeyButton(this.currentBindingSetting);
                    this.hideHotkeyModal();
                    return;
                }
                if (e.code === 'Space' && this.settings.bhopEnabled) {
                    e.preventDefault(); e.stopPropagation();
                    if (!this.spacebarDown) { this.spacebarDown = true; this.bhopSequence(); }
                }
                if (Object.values(this.hotkeys).includes(e.code)) { e.preventDefault(); e.stopPropagation(); }
                const action = Object.keys(this.hotkeys).find(key => this.hotkeys[key] === e.code);
                if (action) {
                    if (action === 'toggleMenu') { this.toggleMenuVisibility(); }
                    else if (this.settings.hasOwnProperty(action)) {
                        this.settings[action] = !this.settings[action];
                        this.saveSettings('anonimbiri_settings', this.settings);
                        this.updateGUIToggle(action);
                    }
                }
            }, { capture: true });
            window.addEventListener('keyup', (e) => {
                if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
                if (e.code === 'Space' && this.settings.bhopEnabled) {
                    e.preventDefault(); e.stopPropagation();
                    this.spacebarDown = false;
                    clearTimeout(this.bhopLoopTimeout);
                    this.bhopIsCrouching = false;
                    this.simulateKey(32, 'keyup');
                }
                if (Object.values(this.hotkeys).includes(e.code)) { e.preventDefault(); e.stopPropagation(); }
            }, { capture: true });

            document.getElementById('anonimbiri-closeBtn').addEventListener('click', () => this.toggleMenuVisibility());
            this.gui.querySelector('.anonimbiri-tab-container').addEventListener('click', (e) => {
                if (e.target.classList.contains('anonimbiri-tab')) {
                    if(window.SOUND) window.SOUND.play('select_0', 0.1);
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
                if(window.SOUND) window.SOUND.play('select_0', 0.1);
                const setting = menuItem.dataset.setting;
                if (!setting) return;
                if (menuItem.querySelector('.anonimbiri-toggle-switch')) {
                    this.settings[setting] = !this.settings[setting];
                    this.saveSettings('anonimbiri_settings', this.settings);
                    this.updateGUIToggle(setting);
                } else if (menuItem.querySelector('.anonimbiri-color-picker-input')) {
                    menuItem.querySelector('.anonimbiri-color-picker-input').click();
                } else if (menuItem.querySelector('.anonimbiri-hotkey')) {
                    this.showHotkeyModal(setting);
                }
            });
            this.gui.querySelectorAll('.anonimbiri-menu-item, .anonimbiri-tab, .anonimbiri-close-btn').forEach(el => {
                el.addEventListener('mouseenter', () => {
                    if (window.SOUND) window.SOUND.play('hover_0', 0.1);
                });
            });
            this.gui.querySelectorAll('.anonimbiri-color-picker-input').forEach(cp => cp.addEventListener('input', (e) => {
                this.settings[e.target.dataset.setting] = e.target.value;
                this.saveSettings('anonimbiri_settings', this.settings);
                this.updateGUIPicker(e.target.dataset.setting);
            }));
        }

        updateAllGUIElements() {
            Object.keys(this.settings).forEach(s => {
                if (s.toLowerCase().includes('color')) this.updateGUIPicker(s);
                else if (typeof this.settings[s] === 'boolean') this.updateGUIToggle(s);
            });
            Object.keys(this.hotkeys).forEach(h => this.updateHotkeyButton(h));
        }

        updateGUIToggle(settingName) {
            const item = this.gui.querySelector(`.anonimbiri-menu-item[data-setting="${settingName}"]`);
            if (!item) return;
            const toggle = item.querySelector('.anonimbiri-toggle-switch');
            const isActive = this.settings[settingName];
            item.classList.toggle('active', isActive);
            if (toggle) toggle.classList.toggle('active', isActive);
        }

        updateGUIPicker(settingName) {
            if (!settingName.toLowerCase().includes('color')) return;
            const picker = this.gui.querySelector(`input[type="color"][data-setting="${settingName}"]`);
            const preview = this.gui.querySelector(`.anonimbiri-color-preview[data-setting="${settingName}"]`);
            if (picker) picker.value = this.settings[settingName];
            if (preview) preview.style.backgroundColor = this.settings[settingName];
            const material = { espColor: this.lineMaterial, skeletonColor: this.skeletonMaterial, boxColor: this.squareMaterial }[settingName];
            if (material) material.uniforms.u_color.value.set(this.settings[settingName]);
        }

        updateHotkeyButton(settingName) {
            const b = this.gui.querySelector(`.anonimbiri-hotkey[data-hotkey="${settingName}"]`);
            if (b) b.textContent = this.hotkeys[settingName]?.replace('Key', '').replace('Digit', '') || 'N/A';
        }

        toggleMenuVisibility() {
            this.settings.menuVisible = !this.settings.menuVisible;
            this.gui.classList.toggle('visible', this.settings.menuVisible);
            this.saveSettings('anonimbiri_settings', this.settings);
            if (this.settings.menuVisible) {
                if (window.SOUND) window.SOUND.play('tick_0', 0.1);
                let lock = document.pointerLockElement || document.mozPointerLockElement;
                if (lock) {
                    document.exitPointerLock();
                }
            }
        }

        showHotkeyModal(settingName) {
            this.isBindingHotkey = true;
            this.currentBindingSetting = settingName;
            const labelEl = this.gui.querySelector(`.anonimbiri-menu-item[data-setting="${settingName}"] label`);
            document.getElementById('anonimbiri-hotkeyFeatureName').textContent = labelEl ? labelEl.textContent : settingName;
            this.hotkeyModal.classList.add('active');
        }

        hideHotkeyModal() {
            this.isBindingHotkey = false;
            this.currentBindingSetting = null;
            this.hotkeyModal.classList.remove('active');
        }

        makeMenuDraggable() {
            const header = document.getElementById('anonimbiri-menuHeader');
            let isDragging = false, offsetX, offsetY;
            const startDragging = (e) => {
                isDragging = true;
                const rect = this.gui.getBoundingClientRect();
                const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
                offsetX = clientX - rect.left;
                offsetY = clientY - rect.top;
                document.addEventListener('mousemove', updatePosition); document.addEventListener('mouseup', stopDragging);
                document.addEventListener('touchmove', updatePosition, { passive: false }); document.addEventListener('touchend', stopDragging);
            };
            const updatePosition = (e) => {
                if (!isDragging) return;
                const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
                const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
                let newLeft = clientX - offsetX, newTop = clientY - offsetY;
                const margin = 5, menuWidth = this.gui.offsetWidth, menuHeight = this.gui.offsetHeight;
                newLeft = Math.max(margin, Math.min(newLeft, window.innerWidth - menuWidth - margin));
                newTop = Math.max(margin, Math.min(newTop, window.innerHeight - menuHeight - margin));
                this.gui.style.left = `${newLeft}px`; this.gui.style.top = `${newTop}px`;
            };
            const stopDragging = () => {
                isDragging = false;
                document.removeEventListener('mousemove', updatePosition); document.removeEventListener('mouseup', stopDragging);
                document.removeEventListener('touchmove', updatePosition); document.removeEventListener('touchend', stopDragging);
                const rect = this.gui.getBoundingClientRect();
                this.settings.menuLeftPx = rect.left; this.settings.menuTopPx = rect.top;
                this.saveSettings('anonimbiri_settings', this.settings);
            };
            header.addEventListener('mousedown', startDragging); header.addEventListener('touchstart', startDragging, { passive: false });
        }

        isPlayerVisible(player) {
            if (!this.settings.aimbotWallCheck) return true;
            if (!player.bodyParts?.head) return false;

            const targetPos = new this.THREE.Vector3();
            this.getPartCenter(player.bodyParts.head, targetPos);
            if (!this.myPlayer.children[0]?.children[0]) return false;
            this.myPlayer.children[0].children[0].getWorldPosition(this.cameraPos);
            const direction = targetPos.clone().sub(this.cameraPos).normalize();
            this.raycaster.set(this.cameraPos, direction);

            const objectsToIntersect = this.scene.children.filter(obj => obj.type === 'Mesh' && obj.visible && obj.id !== player.id);
            const intersects = this.raycaster.intersectObjects(objectsToIntersect, false);

            if (intersects.length > 0) {
                const distanceToPlayer = this.cameraPos.distanceTo(targetPos);
                if (intersects[0].distance < distanceToPlayer - 1) {
                    // YENİ DUVAR BOYUT KONTROLÜ
                    const hitObject = intersects[0].object;
                    if (hitObject.geometry) {
                        if (!hitObject.geometry.boundingBox) hitObject.geometry.computeBoundingBox();
                        const size = hitObject.geometry.boundingBox.getSize(new this.THREE.Vector3());
                        // Eğer nesne bir oyuncudan belirgin şekilde büyükse, duvar olarak kabul et
                        if (size.y > 15 && (size.x > 15 || size.z > 15)) {
                            return false; // Bu bir duvar, oyuncu görünmez.
                        }
                    }
                    // Eğer boyut kontrolü geçilirse (küçük nesne), yine de mesafeyi kontrol et.
                    return false;
                }
            }
            return true;
        }

        findBodyParts(player) {
            const parts = { head: null, body: null, arms: [], legs: [] };
            const tempLimbs = [];
            if (!player.children[0]?.children) return parts;
            for (const child of player.children[0].children) {
                if (child.name === 'leg') tempLimbs.push(child);
                else if (child.type === 'Object3D' && child.children.length > 0) {
                    for (const part of child.children) {
                        if (part.name === 'head') parts.head = part;
                        if (part.name === 'body') parts.body = part;
                    }
                }
            }
            if (tempLimbs.length >= 4) {
                tempLimbs.sort((a, b) => b.position.y - a.position.y);
                parts.arms = tempLimbs.slice(0, 2);
                parts.legs = tempLimbs.slice(2, 4);
                parts.arms.sort((a, b) => a.position.x - b.position.x);
                parts.legs.sort((a, b) => a.position.x - b.position.x);
            }
            return parts;
        }

        getPartCenter(part, targetVector) {
            if (!part?.geometry) return part.getWorldPosition(targetVector);
            const geometry = part.geometry;
            if (!geometry.boundingBox) geometry.computeBoundingBox();
            geometry.boundingBox.getCenter(targetVector);
            targetVector.applyMatrix4(part.matrixWorld);
        }

        createPlayerESP(player) {
            const esp = { skeleton: null, box: null };
            const boneGeo = new this.THREE.BufferGeometry();
            boneGeo.setAttribute('position', new this.THREE.BufferAttribute(new Float32Array(12 * 3), 3));
            const bones = new this.THREE.LineSegments(boneGeo, this.skeletonMaterial);
            const headGeo = new this.THREE.RingGeometry(0.7, 0.9, 16);
            const head = new this.THREE.Mesh(headGeo, this.skeletonMaterial);
            esp.skeleton = new this.THREE.Group();
            esp.skeleton.add(bones, head);
            this.scene.add(esp.skeleton);
            esp.box = new this.THREE.LineLoop(this.squareGeometry, this.squareMaterial);
            this.scene.add(esp.box);
            this.managedESP.set(player.id, { player, esp });
        }

        removePlayerESP(playerId) {
            if (this.managedESP.has(playerId)) {
                const { esp } = this.managedESP.get(playerId);
                if (esp.skeleton) this.scene.remove(esp.skeleton);
                if (esp.box) this.scene.remove(esp.box);
                this.managedESP.delete(playerId);
            }
        }

        updatePlayerESP(player) {
            if (!this.managedESP.has(player.id) || !player.bodyParts) return;
            const { esp } = this.managedESP.get(player.id);
            const parts = player.bodyParts;
            if (esp.skeleton) {
                esp.skeleton.visible = this.settings.espSkeleton;
                if (this.settings.espSkeleton) {
                    const [bones, head] = esp.skeleton.children;
                    const headPos = new this.THREE.Vector3(), bodyPos = new this.THREE.Vector3();
                    const arm1Pos = new this.THREE.Vector3(), arm2Pos = new this.THREE.Vector3();
                    const leg1Pos = new this.THREE.Vector3(), leg2Pos = new this.THREE.Vector3();
                    this.getPartCenter(parts.head, headPos); this.getPartCenter(parts.body, bodyPos);
                    if (parts.arms[0]) this.getPartCenter(parts.arms[0], arm1Pos);
                    if (parts.arms[1]) this.getPartCenter(parts.arms[1], arm2Pos);
                    if (parts.legs[0]) this.getPartCenter(parts.legs[0], leg1Pos);
                    if (parts.legs[1]) this.getPartCenter(parts.legs[1], leg2Pos);
                    esp.skeleton.position.copy(bodyPos);
                    headPos.sub(esp.skeleton.position);
                    if (parts.arms[0]) arm1Pos.sub(esp.skeleton.position);
                    if (parts.arms[1]) arm2Pos.sub(esp.skeleton.position);
                    if (parts.legs[0]) leg1Pos.sub(esp.skeleton.position);
                    if (parts.legs[1]) leg2Pos.sub(esp.skeleton.position);
                    head.position.copy(headPos);
                    head.lookAt(this.cameraPos);
                    const positions = bones.geometry.attributes.position.array;
                    let i = 0;
                    const setLocalPos = (p) => { positions[i++] = p.x; positions[i++] = p.y; positions[i++] = p.z; };
                    setLocalPos(headPos); setLocalPos(new this.THREE.Vector3(0,0,0));
                    if (parts.arms[0]) { setLocalPos(new this.THREE.Vector3(0,0,0)); setLocalPos(arm1Pos); }
                    if (parts.arms[1]) { setLocalPos(new this.THREE.Vector3(0,0,0)); setLocalPos(arm2Pos); }
                    if (parts.legs[0]) { setLocalPos(new this.THREE.Vector3(0,0,0)); setLocalPos(leg1Pos); }
                    if (parts.legs[1]) { setLocalPos(new this.THREE.Vector3(0,0,0)); setLocalPos(leg2Pos); }
                    bones.geometry.attributes.position.needsUpdate = true;
                    bones.geometry.setDrawRange(0, i / 3);
                    bones.geometry.computeBoundingSphere();
                }
            }
            if (esp.box) {
                esp.box.visible = this.settings.espSquare;
                if (this.settings.espSquare) {
                    this.getPartCenter(parts.body, esp.box.position);
                    esp.box.lookAt(this.cameraPos);
                }
            }
        }

        bhopSequence() {
            if (!this.myPlayer || !this.settings.bhopEnabled || !this.spacebarDown) {
                this.bhopIsCrouching = false;
                clearTimeout(this.bhopLoopTimeout);
                return;
            }
            clearTimeout(this.bhopLoopTimeout);

            if (this.myPlayer.onGround) {
                this.simulateKey(32); // Jump
                this.bhopIsCrouching = true;
                this.bhopLoopTimeout = setTimeout(() => this.bhopSequence(), 30);
            } else if (this.bhopIsCrouching) {
                this.simulateKey(16); // Slide
                this.bhopIsCrouching = false;
                this.bhopLoopTimeout = setTimeout(() => this.bhopSequence(), 30);
            } else {
                this.bhopLoopTimeout = setTimeout(() => this.bhopSequence(), 10);
            }
        }

        handleAutoFire(targetPlayer) {
            clearInterval(this.autoFireTimer);
            const shouldFire = this.settings.autoFireEnabled && (!this.settings.aimbotEnabled || (this.settings.aimbotEnabled && targetPlayer));
            if (shouldFire) {
                this.autoFireTimer = setInterval(() => {
                    this.simulateMouse('mousedown', 0);
                    setTimeout(() => this.simulateMouse('mouseup', 0), 20);
                }, 100);
            }
        }

        stopAutoFire() {
            clearInterval(this.autoFireTimer);
            this.simulateMouse('mouseup', 0);
        }

        animate() {
            requestAnimationFrame(() => this.animate());
            this.materials.forEach(m => { if (m?.uniforms.u_time) m.uniforms.u_time.value += 0.016; });

            if (this.scene && this.myPlayer && !this.scene.children.includes(this.myPlayer)) {
                console.log("🌸 Anime Cheats: Scene reset detected! Re-initializing...");
                for (const playerId of this.managedESP.keys()) this.removePlayerESP(playerId);
                this.scene = null; this.myPlayer = null; this.players = []; this.stopAutoFire();
                clearTimeout(this.bhopLoopTimeout);
                return;
            }
            if (!this.scene) { this.attemptInjection(); return; }
            const players = []; let myPlayer = null;
            try {
                for (const child of this.scene.children) {
                    if (!child) continue;
                    if (child.type === 'Object3D') {
                        if (child.children[0]?.children[0]?.type === 'PerspectiveCamera') myPlayer = child;
                        else if (child.position.x !== 0 || child.position.z !== 0) {
                            if (!child.bodyParts) child.bodyParts = this.findBodyParts(child);
                            if (child.bodyParts.head && child.bodyParts.body && child.bodyParts.legs.length >= 2) players.push(child);
                        }
                    } else if (child.material) {
                        if (Array.isArray(child.material)) {
                            for (const material of child.material) {
                                material.wireframe = this.settings.wireframeEnabled;
                            }
                        } else {
                            child.material.wireframe = this.settings.wireframeEnabled;
                        }
                    }
                }
            } catch (err) { console.error("🌸 Anime Cheats: Error processing scene children:", err); }
            this.myPlayer = myPlayer; this.players = players;
            if (!this.myPlayer) return;
            const currentPlayerIds = new Set(this.players.map(p => p.id));
            for (const playerId of this.managedESP.keys()) { if (!currentPlayerIds.has(playerId)) this.removePlayerESP(playerId); }
            let espLineCounter = 0;
            if (!this.espLine && this.settings.espLines) {
                this.espLine = new this.THREE.LineSegments(this.espLineGeometry, this.lineMaterial);
                this.espLine.frustumCulled = false; this.myPlayer.add(this.espLine);
            }
            if (this.myPlayer.children[0]?.children[0]) this.myPlayer.children[0].children[0].getWorldPosition(this.cameraPos);
            const linePositions = this.espLinePositionsAttribute?.array;
            for (const player of this.players) {
                if (player.id === this.myPlayer.id) continue;
                if (!this.managedESP.has(player.id)) this.createPlayerESP(player);
                this.updatePlayerESP(player);
                if (this.settings.espLines && linePositions) {
                    this.getPartCenter(player.bodyParts.body, this.tempVector);
                    this.tempObject.matrix.copy(this.myPlayer.matrixWorld).invert();
                    this.tempVector.applyMatrix4(this.tempObject.matrix);
                    linePositions[espLineCounter++] = 0; linePositions[espLineCounter++] = -5; linePositions[espLineCounter++] = 0;
                    linePositions[espLineCounter++] = this.tempVector.x; linePositions[espLineCounter++] = this.tempVector.y; linePositions[espLineCounter++] = this.tempVector.z;
                }
            }
            if (this.settings.espLines && this.espLine) {
                this.espLinePositionsAttribute.needsUpdate = true;
                this.espLine.geometry.setDrawRange(0, espLineCounter / 3);
                this.espLine.visible = espLineCounter > 0;
            } else if (this.espLine) { this.espLine.visible = false; }
            let targetPlayer = null;
            if (this.settings.aimbotEnabled) {
                const sortedPlayers = [...this.players].sort((a, b) => this.myPlayer.position.distanceTo(a.position) - this.myPlayer.position.distanceTo(b.position));
                for (const player of sortedPlayers) {
                    if (player.id === this.myPlayer.id) continue;
                    if (this.isPlayerVisible(player)) { targetPlayer = player; break; }
                }
            }
            this.handleAutoFire(targetPlayer);
            if (!targetPlayer || (this.settings.aimbotOnRightMouse && !this.rightMouseDown)) return;
            try {
                this.getPartCenter(targetPlayer.bodyParts.head, this.tempVector);
                this.tempVector.y -= 2;
            } catch (e) { targetPlayer.getWorldPosition(this.tempVector); this.tempVector.y += 5; }
            if (this.tempVector.lengthSq() < 0.01) return;
            const lookAtOrigin = new this.THREE.Vector3();
            this.myPlayer.children[0].children[0].getWorldPosition(lookAtOrigin);
            this.tempObject.position.copy(lookAtOrigin);
            this.tempObject.lookAt(this.tempVector);
            const lerpFactor = 0.7;
            this.myPlayer.rotation.y = this.lerpAngle(this.myPlayer.rotation.y, this.tempObject.rotation.y + Math.PI, lerpFactor);
            this.myPlayer.children[0].rotation.x = this.lerpAngle(this.myPlayer.children[0].rotation.x, -this.tempObject.rotation.x, lerpFactor);
        }

        lerpAngle(start, end, t) {
            let d = (end - start) % (2 * Math.PI);
            return start + (d > Math.PI ? d - 2 * Math.PI : d < -Math.PI ? d + 2 * Math.PI : d) * t;
        }
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => new KrunkerCheats());
    } else {
        new KrunkerCheats();
    }
})();
