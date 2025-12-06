import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.setupLights();
        this.setupEnvironment();
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    setupEnvironment() {
        // Sky color - more magical!
        this.scene.background = new THREE.Color(0xFFB3E6); // Pink-purple sky
        this.scene.fog = new THREE.Fog(0xFFB3E6, 5000, 15000);

        // Create rolling hills with rainbow colors
        const size = 200;
        const divisions = 150;
        const groundGeometry = new THREE.PlaneGeometry(20000, 20000, divisions, divisions);

        // Add hills using sine waves
        const vertices = groundGeometry.attributes.position.array;
        const colors = [];

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];

            // Flatten area around runway (center zone)
            const distFromCenter = Math.sqrt(x * x + z * z);
            const runwayZone = 750; // Radius of flat area

            let heightMultiplier = 1.0;
            if (distFromCenter < runwayZone) {
                // Completely flat in the center
                heightMultiplier = 0;
            } else if (distFromCenter < runwayZone + 500) {
                // Smooth transition from flat to hills
                heightMultiplier = (distFromCenter - runwayZone) / 500;
            }

            // Create rolling hills with multiple sine waves (reduced to 50% height)
            const hill1 = Math.sin(x * 0.003) * 100 * heightMultiplier;  // was 200
            const hill2 = Math.cos(z * 0.004) * 75 * heightMultiplier;   // was 150
            const hill3 = Math.sin((x + z) * 0.002) * 50 * heightMultiplier; // was 100
            vertices[i + 2] = hill1 + hill2 + hill3; // y coordinate

            // Rainbow vertex colors based on position
            const rainbow = (x + z + 10000) / 20000;
            const hue = (rainbow + Math.sin(x * 0.01) * 0.2) % 1.0;
            const color = new THREE.Color();
            color.setHSL(hue, 0.8, 0.6);
            colors.push(color.r, color.g, color.b);
        }

        groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        groundGeometry.computeVertexNormals();

        const groundMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.ground.castShadow = true;
        this.scene.add(this.ground);

        // Store geometry for collision detection
        this.terrainGeometry = groundGeometry;
    }
}
