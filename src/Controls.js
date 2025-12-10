export class Controls {
    constructor() {
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            w: false,
            a: false,
            s: false,
            d: false,
            q: false,
            e: false,
            z: false,
            x: false,
            Shift: false,
            " ": false // Space
        };

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(event) {
        let key = event.key;
        if (key.length === 1) {
            key = key.toLowerCase();
        }

        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = true;
        }
        // Map W/S/A/D if user prefers
        if (key === 'w') this.keys.ArrowUp = true;
        if (key === 's') this.keys.ArrowDown = true;
        if (key === 'a') this.keys.ArrowLeft = true;
        if (key === 'd') this.keys.ArrowRight = true;
    }

    onKeyUp(event) {
        let key = event.key;
        if (key.length === 1) {
            key = key.toLowerCase();
        }

        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = false;
        }
        if (key === 'w') this.keys.ArrowUp = false;
        if (key === 's') this.keys.ArrowDown = false;
        if (key === 'a') this.keys.ArrowLeft = false;
        if (key === 'd') this.keys.ArrowRight = false;
    }

    getState() {
        // 1. Start with Keyboard state
        // Mapping:
        // Pitch: Down/S (+1) is Pull Back (Up), Up/W (-1) is Push Forward (Down)
        // Roll: Left/A (+1), Right/D (-1)
        // Yaw: Q (+1), E (-1)
        const state = {
            pitch: (this.keys.ArrowDown || this.keys.s ? 1 : 0) - (this.keys.ArrowUp || this.keys.w ? 1 : 0),
            roll: (this.keys.ArrowLeft || this.keys.a ? 1 : 0) - (this.keys.ArrowRight || this.keys.d ? 1 : 0),
            yaw: (this.keys.q ? 1 : 0) - (this.keys.e ? 1 : 0),
            throttle: this.keys.z ? 1 : 0,
            brake: (this.keys.x || this.keys[" "]) ? 1 : 0
        };

        // 2. Poll Gamepad
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0]; // Support first controller

        if (gp) {
            const deadzone = 0.15;
            const applyDeadzone = (val) => Math.abs(val) < deadzone ? 0 : val;

            // Xbox / Standard Gamepad Mapping
            // Axis 0: Left Stick X (Left -1, Right +1)
            // Axis 1: Left Stick Y (Up -1, Down +1)
            // Axis 2: Right Stick X
            // Axis 3: Right Stick Y

            // ROLL (Left Stick X)
            // Keyboard Left is +1. Gamepad Left is -1. negate it.
            const gpRoll = applyDeadzone(gp.axes[0]);
            if (gpRoll !== 0) state.roll = -gpRoll;

            // PITCH (Left Stick Y)
            // Keyboard Down (Pull back) is +1. Gamepad Down is +1.
            const gpPitch = applyDeadzone(gp.axes[1]);
            if (gpPitch !== 0) state.pitch = gpPitch;

            // YAW (Bumpers or Right Stick X)
            // LB (Button 4) -> Yaw Left (+)
            // RB (Button 5) -> Yaw Right (-)
            if (gp.buttons[4] && gp.buttons[4].pressed) state.yaw = 1;
            if (gp.buttons[5] && gp.buttons[5].pressed) state.yaw = -1;

            // Alternative Yaw: Right Stick X
            const gpYaw = applyDeadzone(gp.axes[2]);
            if (gpYaw !== 0) state.yaw = -gpYaw; // Left is -1, need +1

            // THROTTLE (A Button or Right Trigger)
            // Button 0 (A) or Button 7 (RT - often analog)
            if ((gp.buttons[0] && gp.buttons[0].pressed) || (gp.buttons[7] && gp.buttons[7].pressed) || (gp.buttons[7] && gp.buttons[7].value > 0.1)) {
                state.throttle = gp.buttons[7].value || 1;
            }

            // BRAKE (B Button or Left Trigger)
            // Button 1 (B) or Button 6 (LT)
            if ((gp.buttons[1] && gp.buttons[1].pressed) || (gp.buttons[6] && gp.buttons[6].pressed) || (gp.buttons[6] && gp.buttons[6].value > 0.1)) {
                state.brake = gp.buttons[6].value || 1;
            }
        }

        return state;
    }
}
