import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { modelManager } from './modelManager.js';
import { apiService } from './api.js';
import { ThermalLayer } from './layers/ThermalLayer.js';
import { ShaderLayer } from './layers/ShaderLayer.js';
import { NodeGraphLayer } from './layers/NodeGraphLayer.js';
import { ChipMapLayer } from './layers/ChipMapLayer.js';

class App {
    constructor() {
        this.clock = new THREE.Clock();
        this.init();
    }

    async init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        this.addLights();

        this.thermalLayer = new ThermalLayer(this.scene);
        this.shaderLayer = new ShaderLayer(this.scene);
        this.nodeGraphLayer = new NodeGraphLayer(this.scene);
        this.chipMapLayer = new ChipMapLayer(this.scene);

        this.activeLayers = { thermal: false, shader: false, nodeGraph: false, chipMap: false };

        try {
            await modelManager.loadModel(this.scene, 'models/chip.glb');
            this.hideLoadingScreen();
        } catch (err) {
            console.error(err);
            this.showError('Failed to load model');
        }

        apiService.startSimulation();
        this.addEventListeners();
        this.animate();
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
    }

    addEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.getElementById('toggleThermal').addEventListener('click', () => {
            this.activeLayers.thermal = !this.activeLayers.thermal;
            this.thermalLayer.setActive(this.activeLayers.thermal);
        });
        document.getElementById('toggleShader').addEventListener('click', () => {
            this.activeLayers.shader = !this.activeLayers.shader;
            this.shaderLayer.setActive(this.activeLayers.shader);
        });
        document.getElementById('toggleNodeGraph').addEventListener('click', () => {
            this.activeLayers.nodeGraph = !this.activeLayers.nodeGraph;
            this.nodeGraphLayer.setActive(this.activeLayers.nodeGraph);
        });
        document.getElementById('toggleChipMap').addEventListener('click', () => {
            this.activeLayers.chipMap = !this.activeLayers.chipMap;
            this.chipMapLayer.setActive(this.activeLayers.chipMap);
        });
        document.getElementById('exportPng').addEventListener('click', () => {
            const dataURL = this.renderer.domElement.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = 'thermal-snapshot.png';
            a.click();
        });
        this.renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    }

    onPointerMove(event) {
        if (!this.activeLayers.thermal) return;
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        const mouse = new THREE.Vector2(x, y);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObject(this.thermalLayer.mesh);
        const tooltip = document.getElementById('tooltip');
        if (intersects.length > 0) {
            const uv = intersects[0].uv;
            const peaks = this.thermalLayer.getPeaks();
            const threshold = 0.05;
            for (const p of peaks) {
                if (Math.abs(p.x - uv.x) < threshold && Math.abs(p.y - uv.y) < threshold) {
                    tooltip.textContent = `Heat: ${(p.value * 100).toFixed(1)}%`;
                    tooltip.style.left = `${event.clientX + 10}px`;
                    tooltip.style.top = `${event.clientY + 10}px`;
                    tooltip.classList.remove('hidden');
                    return;
                }
            }
        }
        tooltip.classList.add('hidden');
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.style.display = 'none', 500);
    }

    showError(msg) {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.innerHTML = `<div class="error-message">${msg}</div>`;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        const delta = this.clock.getDelta();
        this.controls.update();
        modelManager.update(delta);
        if (this.activeLayers.thermal) this.thermalLayer.update(delta);
        if (this.activeLayers.shader) this.shaderLayer.update(delta);
        if (this.activeLayers.nodeGraph) this.nodeGraphLayer.update(delta);
        if (this.activeLayers.chipMap) this.chipMapLayer.update(delta);
        this.renderer.render(this.scene, this.camera);
    }
}

new App();
