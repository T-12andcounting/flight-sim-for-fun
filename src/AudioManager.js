export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;

        // Engine sound nodes
        this.engineOscillator = null;
        this.engineGain = null;
        this.engineFilter = null;

        // Wind sound nodes
        this.windBuffer = null;
        this.windSource = null;
        this.windGain = null;

        // Applause
        this.applauseSource = null;

        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3; // Master volume
            this.masterGain.connect(this.audioContext.destination);

            this.createEngineSound();
            await this.createWindSound();

            this.initialized = true;
        } catch (error) {
            console.error('Audio initialization failed:', error);
        }
    }

    createEngineSound() {
        // Sawtooth wave for engine-like rumble
        this.engineOscillator = this.audioContext.createOscillator();
        this.engineOscillator.type = 'sawtooth';
        this.engineOscillator.frequency.value = 80; // Idle frequency

        // Add slight detune for realism
        this.engineOscillator.detune.value = -5;

        // Filter for low-pass (remove harsh highs)
        this.engineFilter = this.audioContext.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 400;
        this.engineFilter.Q.value = 1;

        // Gain control
        this.engineGain = this.audioContext.createGain();
        this.engineGain.gain.value = 0;

        // Connect: oscillator -> filter -> gain -> master
        this.engineOscillator.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.masterGain);

        // Start oscillator
        this.engineOscillator.start();
    }

    async createWindSound() {
        // Create pink noise for wind
        const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
        this.windBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = this.windBuffer.getChannelData(0);

        // Generate pink noise (more natural than white noise)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            data[i] *= 0.11; // Reduce volume
            b6 = white * 0.115926;
        }

        this.windGain = this.audioContext.createGain();
        this.windGain.gain.value = 0;
        this.windGain.connect(this.masterGain);
    }

    updateEngine(speed, isAccelerating) {
        if (!this.initialized || !this.engineOscillator) return;

        // Map speed (0-200) to frequency (80-300 Hz)
        const minFreq = 80;
        const maxFreq = 300;
        const targetFreq = minFreq + (speed / 200) * (maxFreq - minFreq);

        // Smooth frequency change
        this.engineOscillator.frequency.exponentialRampToValueAtTime(
            Math.max(20, targetFreq),
            this.audioContext.currentTime + 0.1
        );

        // Volume based on speed and acceleration - SILENT when speed is 0
        let targetVolume = 0;
        if (speed > 0) {
            targetVolume = 0.1 + (speed / 200) * 0.2; // 0.1 to 0.3
            if (isAccelerating) {
                targetVolume *= 1.5; // Louder when accelerating
            }
        }

        this.engineGain.gain.linearRampToValueAtTime(
            targetVolume,
            this.audioContext.currentTime + 0.1
        );
    }

    stopEngine() {
        if (!this.initialized) return;

        // Immediately silence engine
        if (this.engineGain) {
            this.engineGain.gain.cancelScheduledValues(this.audioContext.currentTime);
            this.engineGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        }

        // Immediately silence wind
        if (this.windGain) {
            this.windGain.gain.cancelScheduledValues(this.audioContext.currentTime);
            this.windGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        }
        this.stopWind();
    }

    updateWind(speed, isAccelerating) {
        if (!this.initialized || !this.windGain) return;

        // Wind louder when coasting at speed
        let targetVolume = 0;
        if (!isAccelerating && speed > 20) {
            targetVolume = Math.min(0.15, (speed / 200) * 0.15);
        }

        this.windGain.gain.linearRampToValueAtTime(
            targetVolume,
            this.audioContext.currentTime + 0.2
        );

        // Start/stop wind source as needed
        if (targetVolume > 0 && !this.windSource) {
            this.startWind();
        } else if (targetVolume === 0 && this.windSource) {
            this.stopWind();
        }
    }

    startWind() {
        if (!this.windBuffer || this.windSource) return;

        this.windSource = this.audioContext.createBufferSource();
        this.windSource.buffer = this.windBuffer;
        this.windSource.loop = true;
        this.windSource.connect(this.windGain);
        this.windSource.start();
    }

    stopWind() {
        if (!this.windSource) return;

        this.windSource.stop();
        this.windSource.disconnect();
        this.windSource = null;
    }

    playApplause() {
        if (!this.initialized) return;

        // Create applause using multiple burst of noise
        const duration = 3.5;
        const now = this.audioContext.currentTime;

        // Create buffer for applause
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);

            for (let i = 0; i < bufferSize; i++) {
                const t = i / this.audioContext.sampleRate;

                // Random claps with varying intensity
                let sample = 0;
                const clapDensity = Math.min(1, t / 0.5); // Build up
                const decay = Math.max(0, 1 - (t - 2) / 1.5); // Fade out

                if (Math.random() < clapDensity * 0.02) {
                    sample = (Math.random() * 2 - 1) * decay;
                }

                // Add random variations for crowd noise
                sample += (Math.random() * 2 - 1) * 0.05 * clapDensity * decay;

                data[i] = sample;
            }
        }

        // Play the applause
        this.applauseSource = this.audioContext.createBufferSource();
        this.applauseSource.buffer = buffer;

        const applauseGain = this.audioContext.createGain();
        applauseGain.gain.value = 1.0;

        this.applauseSource.connect(applauseGain);
        applauseGain.connect(this.masterGain);
        this.applauseSource.start(now);

        // Cleanup after done
        setTimeout(() => {
            this.applauseSource = null;
        }, duration * 1000);
    }

    playExplosion() {
        if (!this.initialized) return;

        const now = this.audioContext.currentTime;
        const duration = 2.5;

        // Low frequency rumble
        const rumbleOsc = this.audioContext.createOscillator();
        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.setValueAtTime(60, now);
        rumbleOsc.frequency.exponentialRampToValueAtTime(20, now + duration);

        const rumbleGain = this.audioContext.createGain();
        rumbleGain.gain.setValueAtTime(0.8, now);
        rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        rumbleOsc.connect(rumbleGain);
        rumbleGain.connect(this.masterGain);
        rumbleOsc.start(now);
        rumbleOsc.stop(now + duration);

        // White noise burst for explosion crack
        const bufferSize = this.audioContext.sampleRate * duration;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(200, now + duration);
        noiseFilter.Q.value = 0.5;

        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.setValueAtTime(0.6, now + 0.05);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noiseSource.start(now);
        noiseSource.stop(now + duration);

        // Mid-frequency crunch
        const crunchOsc = this.audioContext.createOscillator();
        crunchOsc.type = 'square';
        crunchOsc.frequency.setValueAtTime(150, now);
        crunchOsc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

        const crunchGain = this.audioContext.createGain();
        crunchGain.gain.setValueAtTime(0.4, now);
        crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        crunchOsc.connect(crunchGain);
        crunchGain.connect(this.masterGain);
        crunchOsc.start(now);
        crunchOsc.stop(now + 0.3);
    }

    // User interaction required to start audio
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}
