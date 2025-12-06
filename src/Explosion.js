import * as THREE from 'three';

export class Explosion {
    constructor(scene, position) {
        this.scene = scene;
        this.isFinished = false;
        this.age = 0;
        this.maxAge = 2.0; // Seconds

        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.scene.add(this.group);

        this.createMushroomCloud();
    }

    createMushroomCloud() {
        const material = new THREE.MeshStandardMaterial({
            color: 0xff4500, // Orange-red
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            roughness: 0.5
        });

        // Stem
        const stemGeo = new THREE.CylinderGeometry(2, 5, 10, 8);
        this.stem = new THREE.Mesh(stemGeo, material);
        this.stem.position.y = 5;
        this.group.add(this.stem);

        // Cap (Mushroom top)
        const capGeo = new THREE.SphereGeometry(8, 16, 16);
        this.cap = new THREE.Mesh(capGeo, material);
        this.cap.position.y = 12;
        this.cap.scale.set(1, 0.5, 1);
        this.group.add(this.cap);

        // Add a light
        this.light = new THREE.PointLight(0xffaa00, 5, 50);
        this.light.position.y = 10;
        this.group.add(this.light);
    }

    update(dt) {
        this.age += dt;

        if (this.age >= this.maxAge) {
            this.isFinished = true;
            this.scene.remove(this.group);
            return;
        }

        const progress = this.age / this.maxAge;

        // Expand
        const scale = 1 + progress * 2;
        this.group.scale.set(scale, scale, scale);

        // Rise
        this.group.position.y += 10 * dt;

        // Fade / Darken (simulate cooling smoke)
        if (progress > 0.5) {
            this.stem.material.color.setHex(0x555555); // Turn grey
            this.cap.material.color.setHex(0x333333);
            this.stem.material.emissiveIntensity = Math.max(0, 1 - progress * 2);
            this.cap.material.emissiveIntensity = Math.max(0, 1 - progress * 2);
            this.light.intensity = Math.max(0, 5 * (1 - progress));
        }
    }
}
