import * as THREE from 'three';

export class NodeGraphLayer {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.group = new THREE.Group();
        this.opacity = 0;
        scene.add(this.group);
    }

    setActive(active) {
        this.isActive = active;
    }

    update(delta) {
        const target = this.isActive ? 1 : 0;
        this.opacity += (target - this.opacity) * 5 * delta;
        this.group.children.forEach(child => {
            if (child.material) child.material.opacity = this.opacity;
        });
    }
}
