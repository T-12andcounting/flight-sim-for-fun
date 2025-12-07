import * as THREE from 'three';
import { World } from './World.js';
import { Plane } from './Plane.js';
import { Controls } from './Controls.js';
import { Mountains } from './Mountains.js';
import { Airport } from './Airport.js';
import { Explosion } from './Explosion.js';
import { AudioManager } from './AudioManager.js';
import { Collectibles } from './Collectibles.js';
import { scoreManager } from './ScoreManager.js';
import { authManager } from './auth/AuthManager.js';

export class Game {
    constructor(container) {
        this.container = container;
        this.animationId = null;
        this.initialize();
    }

    initialize() {
        // Setup canvas and renderer
        const canvas = document.createElement('canvas');
        canvas.id = 'game-canvas';
        this.container.appendChild(canvas);

        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
        this.camera.position.set(0, 10, 20);

        // Components
        this.world = new World(this.scene);
        this.plane = new Plane(this.scene);
        this.plane.setTerrain(this.world.terrainGeometry);
        this.mountains = new Mountains(this.scene);
        this.airport = new Airport(this.scene);
        this.controls = new Controls();

        this.explosion = null;
        this.cameraMode = 'third-person';
        this.starfield = null;
        this.audioManager = new AudioManager();
        this.hasPlayedApplause = false;
        this.hasPlayedExplosion = false;
        this.collectibles = new Collectibles(this.scene);
        this.score = 0;

        this.createStarfield();
        this.createUI();
        this.setupEventListeners();
        this.audioManager.init();

        this.clock = new THREE.Clock();
        this.animate();
    }

    createStarfield() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 5000; i++) {
            const x = (Math.random() - 0.5) * 20000;
            const y = (Math.random() - 0.5) * 20000;
            const z = (Math.random() - 0.5) * 20000;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
        const stars = new THREE.Points(geometry, material);
        stars.visible = false;
        this.scene.add(stars);
        this.starfield = stars;
    }

    createUI() {
        // Create UI container
        const ui = document.createElement('div');
        ui.id = 'game-ui';
        ui.innerHTML = `
            <div id="ui">
                <div class="hud-panel">
                    <h1>Flight Sim</h1>
                    <p>Speed: <span id="speed">0</span></p>
                    <p>Altitude: <span id="altitude">0</span></p>
                    <p>AGL: <span id="agl">0</span></p>
                    <p>Pitch: <span id="pitch">0</span>°</p>
                    <p>Roll: <span id="roll">0</span>°</p>
                    <p>Score: <span id="score">0</span></p>
                </div>
                <div class="controls-panel">
                    <p>Z: Throttle Up</p>
                    <p>X / SPACE: Brake</p>
                    <p>Arrows/WASD: Pitch/Roll</p>
                    <p>Q/E: Yaw</p>
                    <p>C: Toggle View</p>
                    <button id="toggle-view-btn"
                        style="pointer-events: auto; margin-top: 10px; padding: 8px; background: #9933ff; color: #fff; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">Toggle View (C)</button>
                    <button id="practice-landing-btn"
                        style="pointer-events: auto; margin-top: 10px; padding: 8px; background: #0f0; color: #000; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">Practice Landing</button>
                    <button id="exit-game-btn"
                        style="pointer-events: auto; margin-top: 10px; padding: 8px; background: #f00; color: #fff; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">Exit to Dashboard</button>
                </div>
                <div id="cockpit-overlay" class="cockpit-overlay"></div>
                <div class="navigation-panel">
                    <div class="compass" id="compass">
                        <div class="compass-needle" id="compass-needle">▲</div>
                        <div class="compass-label">N</div>
                    </div>
                    <canvas id="minimap" width="150" height="150"></canvas>
                </div>
            </div>
        `;
        this.container.appendChild(ui);

        // Crash message
        this.crashMessage = document.createElement('div');
        this.crashMessage.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:red;font-size:48px;font-family:Arial,sans-serif;font-weight:bold;text-shadow:2px 2px 0 #000;display:none;';
        this.crashMessage.innerText = 'CRASHED! Press R to Reset';
        this.container.appendChild(this.crashMessage);

        // Success message
        this.successMessage = document.createElement('div');
        this.successMessage.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#00ff00;font-size:48px;font-family:Arial,sans-serif;font-weight:bold;text-shadow:2px 2px 0 #000;display:none;';
        this.successMessage.innerText = 'SUCCESSFUL LANDING! Way to go Captain Capable!!';
        this.container.appendChild(this.successMessage);

        // Points message
        this.pointsMessage = document.createElement('div');
        this.pointsMessage.style.cssText = 'position:absolute;top:30%;left:50%;transform:translate(-50%,-50%);color:#FFD700;font-size:64px;font-family:Arial,sans-serif;font-weight:bold;text-shadow:3px 3px 0 #000;display:none;';
        this.container.appendChild(this.pointsMessage);

        // Stall warning message
        this.stallWarning = document.createElement('div');
        this.stallWarning.style.cssText = 'position:absolute;top:20%;left:50%;transform:translate(-50%,-50%);color:#FF0000;font-size:48px;font-family:Arial,sans-serif;font-weight:bold;text-shadow:2px 2px 0 #000;display:none;animation:blink 0.5s infinite;';
        this.stallWarning.innerText = '⚠️ STALL WARNING ⚠️';
        this.container.appendChild(this.stallWarning);

        // Get UI elements
        this.speedEl = document.getElementById('speed');
        this.altEl = document.getElementById('altitude');
        this.aglEl = document.getElementById('agl');
        this.pitchEl = document.getElementById('pitch');
        this.rollEl = document.getElementById('roll');
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas?.getContext('2d');
        this.compassNeedle = document.getElementById('compass-needle');
        this.cockpitOverlay = document.getElementById('cockpit-overlay');
        this.scoreEl = document.getElementById('score');
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.audioManager.resume();

            if (e.key.toLowerCase() === 'r' && (this.plane.crashed || this.plane.successfulLanding)) {
                this.plane.reset();
                this.crashMessage.style.display = 'none';
                this.successMessage.style.display = 'none';
                this.hasPlayedApplause = false;
                this.hasPlayedExplosion = false;
                if (this.explosion) {
                    this.scene.remove(this.explosion.group);
                    this.explosion = null;
                }
                // Reset collectibles and score
                if (this.collectibles) {
                    this.collectibles.reset();
                }
                this.score = 0;
            }

            if (e.key.toLowerCase() === 'c') {
                this.toggleView();
            }
        });

        const toggleViewBtn = document.getElementById('toggle-view-btn');
        if (toggleViewBtn) {
            toggleViewBtn.addEventListener('click', () => {
                toggleViewBtn.blur(); // Remove focus so spacebar doesn't trigger it again
                this.toggleView();
            });
        }

        const practiceLandingBtn = document.getElementById('practice-landing-btn');
        if (practiceLandingBtn) {
            practiceLandingBtn.addEventListener('click', () => {
                practiceLandingBtn.blur();
                this.audioManager.resume();
                this.plane.setupPracticeLanding();
                this.successMessage.style.display = 'none';
                this.crashMessage.style.display = 'none';
                if (this.explosion) {
                    this.scene.remove(this.explosion.group);
                    this.explosion = null;
                }
                this.hasPlayedApplause = false;
                this.hasPlayedExplosion = false;
            });
        }

        const exitBtn = document.getElementById('exit-game-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                window.location.hash = 'dashboard';
            });
        }

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const dt = this.clock.getDelta();

        this.plane.update(dt, this.controls);

        // Update collectibles and check for points
        if (this.collectibles) {
            const pointsEarned = this.collectibles.update(dt, this.plane.position);
            if (pointsEarned > 0) {
                this.score += pointsEarned;
                this.showPointsMessage(pointsEarned);
            }
        }

        if (!this.plane.crashed) {
            this.plane.checkCollisions(this.airport.buildings);
        }

        // Handle Crash State
        if (this.plane.crashed) {
            if (this.crashMessage.style.display === 'none') {
                this.crashMessage.style.display = 'block';

                if (!this.explosion) {
                    this.explosion = new Explosion(this.scene, this.plane.position);
                }

                if (!this.hasPlayedExplosion) {
                    this.audioManager.playExplosion();
                    this.audioManager.stopEngine();
                    this.hasPlayedExplosion = true;

                    const user = authManager.getUser();
                    if (user) {
                        scoreManager.saveScore(this.score, user.id);
                    }
                }
            }
        }

        // Handle Success State
        if (this.plane.successfulLanding && this.successMessage.style.display === 'none') {
            this.successMessage.style.display = 'block';

            if (!this.hasPlayedApplause) {
                this.audioManager.playApplause();
                this.hasPlayedApplause = true;

                const user = authManager.getUser();
                if (user) {
                    scoreManager.saveScore(this.score, user.id);
                }
            }

            setTimeout(() => {
                this.successMessage.style.display = 'none';
                this.plane.successfulLanding = false;
                this.plane.wasFlying = false;
                this.hasPlayedApplause = false;
            }, 5000);
        }

        if (this.explosion) {
            this.explosion.update(dt);
            if (this.explosion.isFinished) {
                this.explosion = null;
            }
        }

        // Camera follow
        if (this.cameraMode === 'first-person') {
            this.plane.mesh.visible = false;
            const cockpitOffset = new THREE.Vector3(0, 1.2, 1.5);
            const worldOffset = cockpitOffset.applyMatrix4(this.plane.mesh.matrixWorld);
            this.camera.position.copy(worldOffset);
            this.camera.quaternion.copy(this.plane.mesh.quaternion);
        } else {
            this.plane.mesh.visible = true;
            const relativeCameraOffset = new THREE.Vector3(0, 5, 15);
            const cameraOffset = relativeCameraOffset.applyMatrix4(this.plane.mesh.matrixWorld);
            this.camera.position.lerp(cameraOffset, 0.1);
            this.camera.lookAt(this.plane.mesh.position);
        }

        // Space boundary
        const distToCenter = Math.sqrt(this.plane.position.x ** 2 + this.plane.position.z ** 2);
        if (distToCenter > 8000) {
            this.scene.background = new THREE.Color(0x000000);
            this.scene.fog = null;
            if (this.starfield) this.starfield.visible = true;
            if (distToCenter > 8500) {
                if (this.crashMessage) {
                    this.crashMessage.innerText = '⚠️ TURN AROUND BEFORE BEING SUCKED OUT INTO SPACE!! ⚠️';
                    this.crashMessage.style.display = 'block';
                    this.crashMessage.style.color = 'yellow';
                }
            }
        } else {
            this.scene.background = new THREE.Color(0xFFB3E6);
            this.scene.fog = new THREE.Fog(0xFFB3E6, 5000, 15000);
            if (this.starfield) this.starfield.visible = false;
            if (this.crashMessage && this.crashMessage.innerText.includes('SPACE')) {
                this.crashMessage.style.display = 'none';
            }
        }

        // Update UI
        if (this.speedEl) this.speedEl.innerText = Math.round(this.plane.speed);
        if (this.altEl) this.altEl.innerText = Math.round(this.plane.position.y);

        const terrainHeight = this.plane.getTerrainHeight(this.plane.position.x, this.plane.position.z);
        const agl = this.plane.position.y - terrainHeight;
        if (this.aglEl) this.aglEl.innerText = Math.round(agl);

        if (this.pitchEl) this.pitchEl.innerText = Math.round(this.plane.rotation.x * (180 / Math.PI));
        if (this.rollEl) this.rollEl.innerText = Math.round(this.plane.rotation.z * (180 / Math.PI));
        if (this.scoreEl) this.scoreEl.innerText = this.score;

        // Update stall warning
        if (this.stallWarning) {
            this.stallWarning.style.display = this.plane.isStalled ? 'block' : 'none';
        }

        this.updateMinimap(this.plane.position);
        this.updateCompass(this.plane.rotation.y);

        if (!this.plane.crashed) {
            const isAccelerating = this.controls.keys.z;
            this.audioManager.updateEngine(this.plane.speed, isAccelerating);
            this.audioManager.updateWind(this.plane.speed, isAccelerating);
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateMinimap(planePos) {
        if (!this.minimapCtx) return;

        const ctx = this.minimapCtx;
        const size = 150;
        const worldSize = 20000;
        const scale = size / worldSize;

        ctx.fillStyle = '#001100';
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = '#003300';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const pos = (i / 10) * size;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(size, pos);
            ctx.stroke();
        }

        ctx.fillStyle = '#00ff00';
        ctx.fillRect(size / 2 - 3, size / 2 - 3, 6, 6);

        ctx.fillStyle = '#666666';
        const mountainDist = 10000 * scale;
        const centerX = size / 2;
        const centerY = size / 2;

        [[0, -mountainDist], [0, mountainDist], [mountainDist, 0], [-mountainDist, 0]].forEach(([x, z]) => {
            ctx.fillRect(centerX + x - 2, centerY + z - 2, 4, 4);
        });

        // Draw collectible cubes
        if (this.collectibles) {
            const cubes = this.collectibles.getCubes();
            cubes.forEach(cube => {
                const cubeX = centerX + (cube.position.x * scale);
                const cubeZ = centerY + (cube.position.z * scale);
                // Use cube's color
                const color = cube.material.color;
                ctx.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
                ctx.fillRect(cubeX - 2, cubeZ - 2, 4, 4);
            });
        }

        const planeX = centerX + (planePos.x * scale);
        const planeZ = centerY + (planePos.z * scale);
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(planeX, planeZ, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    toggleView() {
        this.cameraMode = this.cameraMode === 'third-person' ? 'first-person' : 'third-person';
        const isCockpit = this.cameraMode === 'first-person';

        this.cockpitOverlay.classList.toggle('active', isCockpit);

        // Toggle class on main UI container for HUD movement
        const uiContainer = document.getElementById('ui');
        if (uiContainer) {
            uiContainer.classList.toggle('cockpit-mode', isCockpit);
        }

        // Update button text if needed, or keep it generic "Toggle View"
    }

    updateCompass(yaw) {
        if (!this.compassNeedle) return;
        const degrees = yaw * (180 / Math.PI);
        this.compassNeedle.style.transform = `rotate(${degrees}deg)`;
    }

    showPointsMessage(points) {
        if (!this.pointsMessage) return;

        this.pointsMessage.innerText = `Yayy ${points} points!!`;
        this.pointsMessage.style.display = 'block';

        setTimeout(() => {
            this.pointsMessage.style.display = 'none';
        }, 2000);
    }

    destroy() {
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Cleanup
        this.scene.clear();
        this.container.innerHTML = '';
    }
}
