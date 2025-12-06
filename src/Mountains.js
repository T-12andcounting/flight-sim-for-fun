import * as THREE from 'three';

export class Mountains {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.distance = 10000;
        this.createMountains();
    }

    createMountains() {
        // North - White (Ice)
        this.createMountainRange(0, -this.distance, 0xffffff, 20);

        // South - Red (Desert)
        this.createMountainRange(0, this.distance, 0xff4500, 20);

        // East - Green (Forest)
        this.createMountainRange(this.distance, 0, 0x228b22, 20);

        // West - Blue (Mist)
        this.createMountainRange(-this.distance, 0, 0x4682b4, 20);
    }

    createMountainRange(xOffset, zOffset, color, count) {
        const rangeGroup = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.9,
            flatShading: true
        });

        for (let i = 0; i < count; i++) {
            const height = 250 + Math.random() * 500;
            const radius = 200 + Math.random() * 200;
            const geometry = new THREE.ConeGeometry(radius, height, 4); // Low poly look
            const mesh = new THREE.Mesh(geometry, material);

            // Randomize position slightly around the center point
            const spread = 1500;
            const x = xOffset + (Math.random() - 0.5) * spread;
            const z = zOffset + (Math.random() - 0.5) * spread;

            mesh.position.set(x, height / 2, z);
            mesh.rotation.y = Math.random() * Math.PI;

            rangeGroup.add(mesh);
        }
        this.group.add(rangeGroup);
    }

    // Mountains are now stationary - removed update method
}
