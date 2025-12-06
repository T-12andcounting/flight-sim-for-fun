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
}
