import * as THREE from 'three';

export class ThermalLayer {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.opacity = 0;
        this.heatMap = null;
        this.material = null;
        this.mesh = null;
        this.peaks = [];
        this.init();
    }

    init() {
        const size = 256;
        const data = new Uint8Array(size * size * 4);
        for (let i = 0; i < size * size; i++) {
            data[i * 4] = 255;
            data[i * 4 + 1] = 0;
            data[i * 4 + 2] = 0;
            data[i * 4 + 3] = 128;
        }
        this.heatMap = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
        this.heatMap.needsUpdate = true;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                heatMap: { value: this.heatMap },
                time: { value: 0 },
                opacity: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D heatMap;
                uniform float time;
                uniform float opacity;
                varying vec2 vUv;

                float rand(vec2 co) {
                    return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
                }

                void main() {
                    vec4 heat = texture2D(heatMap, vUv);
                    float intensity = heat.r;
                    float n = rand(vUv * 256.0 + time);
                    intensity += n * 0.05;
                    intensity = clamp(intensity, 0.0, 1.0);

                    float t;
                    vec3 color;
                    if (intensity < 0.3) {
                        t = smoothstep(0.0, 0.3, intensity);
                        color = mix(vec3(0.0,0.0,1.0), vec3(0.0,1.0,0.0), t);
                    } else if (intensity < 0.6) {
                        t = smoothstep(0.3, 0.6, intensity);
                        color = mix(vec3(0.0,1.0,0.0), vec3(1.0,1.0,0.0), t);
                    } else {
                        t = smoothstep(0.6, 1.0, intensity);
                        color = mix(vec3(1.0,1.0,0.0), vec3(1.0,0.0,0.0), t);
                    }

                    gl_FragColor = vec4(color, intensity * 0.8 * opacity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }

    setActive(active) {
        this.isActive = active;
        this.mesh.visible = true; // to allow fade out
    }

    updateHeatMap(delta) {
        const data = this.heatMap.image.data;
        const size = this.heatMap.image.width;
        let maxHeat = -1;
        let maxX = 0;
        let maxY = 0;
        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);
            const distance = Math.sqrt(Math.pow(x - size/2,2) + Math.pow(y - size/2,2))/ (size/2);
            const heat = Math.max(0, Math.min(1, 0.5 + 0.5 * Math.sin(distance * 10 + delta * 2)));
            data[i] = heat * 255;
            data[i+1] = 0;
            data[i+2] = (1 - heat) * 255;
            data[i+3] = 255;
            if (heat > maxHeat) {
                maxHeat = heat;
                maxX = x;
                maxY = y;
            }
        }
        this.peaks = [{ x: maxX / size, y: 1 - maxY / size, value: maxHeat }];
        this.heatMap.needsUpdate = true;
    }

    update(delta) {
        this.material.uniforms.time.value += delta;
        this.updateHeatMap(delta);
        const target = this.isActive ? 1 : 0;
        this.material.uniforms.opacity.value += (target - this.material.uniforms.opacity.value) * 5 * delta;
        if (this.material.uniforms.opacity.value < 0.01 && !this.isActive) {
            this.mesh.visible = false;
        }
    }

    getPeaks() {
        return this.peaks;
    }
}
