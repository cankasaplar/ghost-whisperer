import * as THREE from 'three';

class ModelManager {
    constructor() {
        this.model = null;
    }

    async loadModel(scene, url) {
        // Placeholder for loading a glb model
        // In a real project, use GLTFLoader
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color: 0x5555ff });
        this.model = new THREE.Mesh(geometry, material);
        scene.add(this.model);
    }

    update(delta) {
        if (this.model) {
            this.model.rotation.y += delta * 0.5;
        }
    }
}

export const modelManager = new ModelManager();
