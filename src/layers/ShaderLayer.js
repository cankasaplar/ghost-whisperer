import * as THREE from "three";
export class ShaderLayer {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.mesh = null;
        this.opacity = 0;
        this.init();
    }

    init() {
        // Placeholder plane to visualize shader
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
    }

    setActive(active) {
        this.isActive = active;
    }

    update(delta) {
        if (!this.mesh) return;
        const target = this.isActive ? 1 : 0;
        this.opacity += (target - this.opacity) * 5 * delta;
        this.mesh.material.opacity = this.opacity;
    }
}
