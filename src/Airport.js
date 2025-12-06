import * as THREE from 'three';

export class Airport {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.buildings = []; // For collision detection

        this.createRunway();
        this.createTerminals();
    }

    createRunway() {
        // Load asphalt texture
        const textureLoader = new THREE.TextureLoader();
        const asphaltTexture = textureLoader.load('/textures/asphalt.png');
        asphaltTexture.wrapS = THREE.RepeatWrapping;
        asphaltTexture.wrapT = THREE.RepeatWrapping;
        asphaltTexture.repeat.set(8, 80); // Repeat for detail

        // Runway dimensions
        const width = 100;
        const length = 1000;

        // Asphalt with texture
        const geometry = new THREE.PlaneGeometry(width, length);
        const material = new THREE.MeshStandardMaterial({
            map: asphaltTexture,
            roughness: 0.9
        });
        const runway = new THREE.Mesh(geometry, material);
        runway.rotation.x = -Math.PI / 2;
        runway.position.y = 0.1;
        runway.receiveShadow = true;
        this.group.add(runway);

        // Center line (dashed)
        const lineCount = 20;
        const lineLen = length / (lineCount * 2);
        const lineGeo = new THREE.PlaneGeometry(2, lineLen);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        for (let i = 0; i < lineCount; i++) {
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.y = 0.2;
            line.position.z = -length / 2 + lineLen + i * (lineLen * 2);
            this.group.add(line);
        }

        // Threshold stripes (piano keys)
        const stripeGeo = new THREE.PlaneGeometry(4, 30);
        for (let i = 0; i < 8; i++) {
            const stripe = new THREE.Mesh(stripeGeo, lineMat);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.y = 0.2;
            stripe.position.z = -length / 2 + 20;
            stripe.position.x = -width / 2 + 10 + i * 11;
            this.group.add(stripe);

            const stripeEnd = stripe.clone();
            stripeEnd.position.z = length / 2 - 20;
            this.group.add(stripeEnd);
        }

        // Approach lights removed
    }



    createTerminals() {
        const hutCount = 5;
        const startZ = -300;
        const spacing = 150;
        const xOffset = 120;

        for (let i = 0; i < hutCount; i++) {
            this.createHut(xOffset, startZ + i * spacing);
        }
        this.createTower(xOffset + 50, 0);
    }

    createHut(x, z) {
        const hutGroup = new THREE.Group();
        hutGroup.position.set(x, 0, z);

        // Platform
        const baseGeo = new THREE.BoxGeometry(45, 2, 45);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 1;
        hutGroup.add(base);

        // Pillars (more of them)
        const pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, 12);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
        const positions = [
            [-18, 6, -18], [18, 6, -18],
            [-18, 6, 18], [18, 6, 18],
            [0, 6, -18], [0, 6, 18],
            [-18, 6, 0], [18, 6, 0]
        ];
        positions.forEach(pos => {
            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(...pos);
            hutGroup.add(pillar);
        });

        // Roof Structure (Rafters)
        const rafterGeo = new THREE.BoxGeometry(42, 1, 1);
        const rafterMat = new THREE.MeshStandardMaterial({ color: 0x4a3c31 });
        for (let i = 0; i < 5; i++) {
            const rafter = new THREE.Mesh(rafterGeo, rafterMat);
            rafter.position.y = 12;
            rafter.position.z = -18 + i * 9;
            hutGroup.add(rafter);
        }

        // Main Roof (Double pitched for Polynesian look)
        const roofGeo1 = new THREE.ConeGeometry(35, 10, 4);
        const roofMat = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 1.0,
            flatShading: true
        });
        const roof1 = new THREE.Mesh(roofGeo1, roofMat);
        roof1.position.y = 16;
        roof1.rotation.y = Math.PI / 4;
        hutGroup.add(roof1);

        // Upper roof cupola
        const roofGeo2 = new THREE.ConeGeometry(15, 8, 4);
        const roof2 = new THREE.Mesh(roofGeo2, roofMat);
        roof2.position.y = 22;
        roof2.rotation.y = Math.PI / 4;
        hutGroup.add(roof2);

        this.group.add(hutGroup);

        this.buildings.push({
            position: new THREE.Vector3(x, 10, z),
            radius: 30
        });
    }

    createTower(x, z) {
        const towerGroup = new THREE.Group();
        towerGroup.position.set(x, 0, z);

        // Main structure (lattice work)
        const legGeo = new THREE.CylinderGeometry(1, 2, 40);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x888888 });

        const legPositions = [[-8, 0, -8], [8, 0, -8], [8, 0, 8], [-8, 0, 8]];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(pos[0], 20, pos[2]);
            leg.lookAt(0, 60, 0);
            towerGroup.add(leg);
        });

        // Cross braces
        const braceGeo = new THREE.BoxGeometry(18, 1, 1);
        for (let i = 1; i < 4; i++) {
            const brace = new THREE.Mesh(braceGeo, legMat);
            brace.position.y = i * 10;
            towerGroup.add(brace);
            const braceZ = brace.clone();
            braceZ.rotation.y = Math.PI / 2;
            towerGroup.add(braceZ);
        }

        // Control Cab
        const cabGeo = new THREE.CylinderGeometry(12, 10, 10, 8);
        const cabMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.y = 45;
        towerGroup.add(cab);

        // Windows
        const winGeo = new THREE.CylinderGeometry(12.2, 10.2, 4, 8);
        const winMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.1,
            metalness: 0.9
        });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.y = 46;
        towerGroup.add(win);

        // Roof
        const roofGeo = new THREE.ConeGeometry(14, 4, 8);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 52;
        towerGroup.add(roof);

        this.group.add(towerGroup);

        this.buildings.push({
            position: new THREE.Vector3(x, 20, z),
            radius: 20
        });
    }
}
