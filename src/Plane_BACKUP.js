import * as THREE from 'three';

export class Plane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = this.createMesh();
        this.scene.add(this.mesh);

        this.position = new THREE.Vector3(0, 50, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.speed = 0;
        this.maxSpeed = 200;
        this.minSpeed = 0;
        this.acceleration = 50;
        this.deceleration = 20;

        this.pitchSpeed = 1.5;
        this.rollSpeed = 2.0;
        this.yawSpeed = 0.5;
        this.bankingTurnSpeed = 0.5;
        this.liftFactor = 0.05;
        this.gravity = 9.8;

        this.crashed = false;
        this.successfulLanding = false;
        this.wasFlying = false;
        this.landingSpeed = 80;

        this.terrainGeometry = null;
    }

    setTerrain(terrainGeometry) {
        this.terrainGeometry = terrainGeometry;
    }

    getTerrainHeight(x, z) {
        if (!this.terrainGeometry) return 0;

        const terrainSize = 20000;
        const divisions = 150;

        const gridX = Math.floor(((x + terrainSize / 2) / terrainSize) * divisions);
        const gridZ = Math.floor(((z + terrainSize / 2) / terrainSize) * divisions);

        if (gridX < 0 || gridX >= divisions || gridZ < 0 || gridZ >= divisions) {
            return 0;
        }

        const vertexIndex = (gridZ * (divisions + 1) + gridX) * 3;
        const vertices = this.terrainGeometry.attributes.position.array;

        return vertices[vertexIndex + 2] || 0;
    }

    createMesh() {
        const group = new THREE.Group();

        const fuselageGeo = new THREE.ConeGeometry(1, 10, 32);
        fuselageGeo.rotateX(Math.PI / 2);
        const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        group.add(fuselage);

        const wingGeo = new THREE.BoxGeometry(10, 0.2, 2);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, 1);
        group.add(wings);

        const tailGeo = new THREE.BoxGeometry(3, 0.2, 1.5);
        const tail = new THREE.Mesh(tailGeo, wingMat);
        tail.position.set(0, 0.5, 4);
        group.add(tail);

        const rudderGeo = new THREE.BoxGeometry(0.2, 1.5, 1);
        const rudder = new THREE.Mesh(rudderGeo, wingMat);
        rudder.position.set(0, 1, 4);
        group.add(rudder);

        group.castShadow = true;
        return group;
    }

    update(dt, controls) {
        if (this.crashed) return;

        if (controls.keys.Shift) {
            this.speed += this.acceleration * dt;
        } else if (controls.keys[" "]) {
            this.speed -= this.acceleration * dt;
        } else {
            this.speed -= (this.speed * 0.1) * dt;
        }
        this.speed = Math.max(this.minSpeed, Math.min(this.speed, this.maxSpeed));

        const pitchInput = (controls.keys.ArrowDown ? 1 : 0) - (controls.keys.ArrowUp ? 1 : 0);
        const rollInput = (controls.keys.ArrowLeft ? 1 : 0) - (controls.keys.ArrowRight ? 1 : 0);
        const yawInput = (controls.keys.q ? 1 : 0) - (controls.keys.e ? 1 : 0);

        const pitchDelta = pitchInput * this.pitchSpeed * dt;
        const rollDelta = rollInput * this.rollSpeed * dt;
        const yawDelta = yawInput * this.yawSpeed * dt;

        const currentQ = this.mesh.quaternion;

        if (pitchDelta !== 0) {
            currentQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchDelta));
        }
        if (yawDelta !== 0) {
            currentQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawDelta));
        }
        if (rollDelta !== 0) {
            currentQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollDelta));
        }

        // Check verticality - completely skip banking if vertical
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(currentQ);
        const verticalFactor = Math.abs(forward.y);

        let currentRoll = 0;
        if (verticalFactor < 0.85) {
            const currentEuler = new THREE.Euler().setFromQuaternion(currentQ, 'YXZ');
            currentRoll = currentEuler.z;

            let bankingInfluence = 1.0;
            if (verticalFactor > 0.7) {
                bankingInfluence = 1.0 - ((verticalFactor - 0.7) / 0.15);
            }

            const turnRate = currentRoll * this.bankingTurnSpeed * bankingInfluence;
            if (Math.abs(turnRate) > 0.001) {
                currentQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turnRate * dt));
            }

            if (rollInput === 0 && Math.abs(currentRoll) > 0.01) {
                const correction = -currentRoll * 1.0 * dt;
                currentQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), correction));
            }
        }

        this.rotation.setFromQuaternion(currentQ, 'YXZ');
        this.velocity.copy(forward).multiplyScalar(this.speed);

        const lift = (this.speed / 50) * this.gravity;
        const bankFactor = Math.cos(currentRoll);
        const verticalLift = lift * bankFactor;
        this.velocity.y -= (this.gravity - verticalLift) * dt;

        this.position.addScaledVector(this.velocity, dt);

        const distFromCenter = Math.sqrt(this.position.x ** 2 + this.position.z ** 2);
        if (distFromCenter > 750) {
            const terrainHeight = this.getTerrainHeight(this.position.x, this.position.z);
            if (terrainHeight > 0 && this.position.y < terrainHeight + 2) {
                this.crashed = true;
                this.speed = 0;
                return;
            }
        }

        if (this.position.y > 5) {
            this.wasFlying = true;
        }

        if (this.position.y < 1) {
            this.position.y = 1;

            if (this.wasFlying && !this.successfulLanding && !this.crashed) {
                const onRunway = Math.abs(this.position.x) < 50 && Math.abs(this.position.z) < 500;
                const pitchDegrees = this.rotation.x * (180 / Math.PI);
                const rollDegrees = Math.abs(this.rotation.z * (180 / Math.PI));

                const speedOk = this.speed >= 40 && this.speed <= 90;
                const descentOk = pitchDegrees >= -10 && pitchDegrees <= -1;
                const levelOk = rollDegrees <= 5;

                if (onRunway && speedOk && descentOk && levelOk) {
                    this.successfulLanding = true;
                    this.velocity.y = 0;
                } else if (onRunway && this.speed < 80 && Math.abs(this.rotation.x) < 0.2 && Math.abs(this.rotation.z) < 0.2) {
                    this.velocity.y = 0;
                    this.rotation.x = 0;
                    this.rotation.z = 0;
                } else {
                    this.crashed = true;
                }
            }

            if (!this.crashed) {
                this.velocity.y = 0;
                this.speed -= this.speed * 0.5 * dt;
                if (this.speed < 0.1) this.speed = 0;
            }
        }

        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(currentQ);
    }

    checkCollisions(buildings) {
        if (this.crashed) return false;

        for (const building of buildings) {
            const dx = this.position.x - building.position.x;
            const dz = this.position.z - building.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < building.radius && this.position.y < building.position.y + 10) {
                this.crashed = true;
                this.speed = 0;
                return true;
            }
        }
        return false;
    }

    setupPracticeLanding() {
        this.position.set(0, 150, -1000);
        this.mesh.quaternion.identity();
        this.mesh.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
        this.mesh.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -5 * Math.PI / 180));
        this.rotation.setFromQuaternion(this.mesh.quaternion, 'YXZ');
        this.velocity.set(0, 0, 0);
        this.speed = 60;
        this.crashed = false;
        this.successfulLanding = false;
        this.wasFlying = true;
        this.mesh.position.copy(this.position);
    }

    reset() {
        this.position.set(0, 1, 0);
        this.rotation.set(0, 0, 0);
        this.velocity.set(0, 0, 0);
        this.speed = 0;
        this.crashed = false;
        this.successfulLanding = false;
        this.wasFlying = false;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
    }
}
