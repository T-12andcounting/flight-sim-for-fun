import * as THREE from 'three';

export class Collectibles {
    constructor(scene) {
        this.scene = scene;
        this.cubes = [];
        this.spawnCubes();
    }

    spawnCubes() {
        // Random count between 5 and 20
        const count = Math.floor(Math.random() * 16) + 5; // 5 to 20

        const geometry = new THREE.BoxGeometry(10, 10, 10);

        // Fluorescent red and royal blue colors
        const colors = [
            0xFF0040,  // Bright fluorescent red
            0x4169E1   // Royal blue
        ];

        for (let i = 0; i < count; i++) {
            // Randomly pick red or blue
            const color = colors[Math.floor(Math.random() * 2)];

            const material = new THREE.MeshPhongMaterial({
                color: color,
                shininess: 100,
                specular: 0xffffff,
                emissive: color,
                emissiveIntensity: 0.3
            });

            const cube = new THREE.Mesh(geometry, material);

            // Random position
            // X/Z range: -2000 to 2000 (around the airport area)
            // Y range: 50 to 100 (as requested)
            cube.position.set(
                (Math.random() - 0.5) * 4000,
                50 + Math.random() * 50,
                (Math.random() - 0.5) * 4000
            );

            // Random rotation speed
            cube.userData = {
                rotSpeedX: (Math.random() - 0.5) * 2,
                rotSpeedY: (Math.random() - 0.5) * 2,
                rotSpeedZ: (Math.random() - 0.5) * 2
            };

            this.scene.add(cube);
            this.cubes.push(cube);
        }
    }

    update(dt, planePosition) {
        let pointsEarned = 0;
        const collisionDistance = 12; // Increased for bigger cubes (10x10x10)

        for (let i = this.cubes.length - 1; i >= 0; i--) {
            const cube = this.cubes[i];

            // Rotate cube
            cube.rotation.x += cube.userData.rotSpeedX * dt;
            cube.rotation.y += cube.userData.rotSpeedY * dt;
            cube.rotation.z += cube.userData.rotSpeedZ * dt;

            // Check collision
            if (cube.position.distanceTo(planePosition) < collisionDistance) {
                // Collision detected!
                this.scene.remove(cube);
                this.cubes.splice(i, 1);

                // Award random points 1-100
                pointsEarned += Math.floor(Math.random() * 100) + 1;
            }
        }

        return pointsEarned;
    }

    reset() {
        // Remove existing cubes
        this.cubes.forEach(cube => this.scene.remove(cube));
        this.cubes = [];
        // Respawn
        this.spawnCubes();
    }

    getCubes() {
        return this.cubes;
    }
}
