
import * as THREE from 'three';

// Mock Plane class behavior - UPDATED with FIX
class PlanePhysics {
    constructor() {
        this.quaternion = new THREE.Quaternion();
        this.bankingTurnSpeed = 0; // As per user
    }

    update(dt, pitchInput) {
        // Apply pitch
        const pitchSpeed = 1.5;
        const pitchDelta = pitchInput * pitchSpeed * dt;

        if (pitchDelta !== 0) {
            this.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchDelta));
        }

        // Vector-based Roll Calculation (The Fix)
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.quaternion);

        const currentRoll = Math.asin(Math.max(-1, Math.min(1, right.y)));

        // Check verticality for logging
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.quaternion);
        const verticalFactor = Math.abs(forward.y);

        console.log(`Pitch: ${(Math.asin(verticalFactor) * 180 / Math.PI).toFixed(2)}°, VerticalFactor: ${verticalFactor.toFixed(4)}`);
        console.log(`  -> Vector Roll: ${currentRoll.toFixed(4)} rad`);

        // Auto-leveling logic
        if (Math.abs(currentRoll) > 0.01) {
            const correction = -currentRoll * 1.0 * dt;
            console.log(`  -> Applying Correction: ${correction.toFixed(4)}`);
            this.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), correction));
        }

        // Check for unwanted Yaw
        const yaw = Math.atan2(forward.x, forward.z) + Math.PI;
        console.log(`  -> Yaw: ${(yaw * 180 / Math.PI).toFixed(2)}°`);
    }
}

// Simulation
const plane = new PlanePhysics();
const dt = 0.016;

console.log("Simulating Pitch Up to 90 degrees...");
for (let i = 0; i < 110; i++) { // Go a bit past 90 to check inverted behavior
    plane.update(dt, 1.0); // Pitch up
}
