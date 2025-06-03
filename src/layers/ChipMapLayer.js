import * as THREE from 'three';

export class ChipMapLayer {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.group = new THREE.Group();
        this.opacity = 0;
        this.materials = [];
        this.init();
        scene.add(this.group);
    }

    init() {
        const zoneSize = 1;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                const geometry = new THREE.PlaneGeometry(zoneSize, zoneSize);
                const colorValue = Math.random();
                const material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(colorValue, 0, 1 - colorValue),
                    transparent: true,
                    opacity: 0
                });
                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(i - 0.5 + zoneSize / 2, j - 0.5 + zoneSize / 2, 0.01);
                this.group.add(mesh);
                this.materials.push(material);
            }
        }
    }

    setActive(active) {
        this.isActive = active;
    }

    update(delta) {
        const target = this.isActive ? 1 : 0;
        this.opacity += (target - this.opacity) * 5 * delta;
        this.materials.forEach((mat, idx) => {
            if (this.isActive) {
                const t = (Math.sin(Date.now() * 0.001 + idx) + 1) / 2;
                mat.color.setRGB(t, 0, 1 - t);
            }
            mat.opacity = 0.5 * this.opacity;
        });
    }
}
