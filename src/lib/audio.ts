// Web Audio API Synthesizer for The Mystery of the Moonlight Garden

class AudioSystem {
  private ctx: AudioContext | null = null;
  private musicInterval: any = null;
  private ambienceNode: GainNode | null = null;
  private cricketNode: GainNode | null = null;
  private windNode: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  
  private musicEnabled = true;
  private soundEnabled = true;

  constructor() {
    if (typeof window !== "undefined") {
      this.musicEnabled = localStorage.getItem("moonlight_music") !== "false";
      this.soundEnabled = localStorage.getItem("moonlight_sound") !== "false";
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  isMusicEnabled() { return this.musicEnabled; }
  isSoundEnabled() { return this.soundEnabled; }

  setMusicEnabled(val: boolean) {
    this.musicEnabled = val;
    localStorage.setItem("moonlight_music", String(val));
    if (!val) {
      this.stopMusic();
      this.stopAmbience();
    } else {
      this.startMusic();
      this.startAmbience();
    }
  }

  setSoundEnabled(val: boolean) {
    this.soundEnabled = val;
    localStorage.setItem("moonlight_sound", String(val));
  }

  // Generate pink/brownish noise for wind rustling
  private createNoiseNode(): AudioNode | null {
    if (!this.ctx) return null;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise filter approximation
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Amplify
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    return whiteNoise;
  }

  startAmbience() {
    if (!this.musicEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    if (this.ambienceNode) return; // Already playing

    try {
      this.ambienceNode = this.ctx.createGain();
      this.ambienceNode.gain.setValueAtTime(0.04, this.ctx.currentTime);
      this.ambienceNode.connect(this.ctx.destination);

      // Create wind node
      const windSource = this.createNoiseNode() as AudioBufferSourceNode;
      if (windSource) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);

        this.windNode = this.ctx.createGain();
        this.windNode.gain.setValueAtTime(0.3, this.ctx.currentTime);

        windSource.connect(filter);
        filter.connect(this.windNode);
        this.windNode.connect(this.ambienceNode);
        windSource.start(0);

        // Wind LFO to simulate gusts
        const windLfo = this.ctx.createOscillator();
        windLfo.type = "sine";
        windLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);

        windLfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        windLfo.start(0);
      }

      // Crickets synthesizer (chirp oscillator modulated by LFO)
      this.cricketNode = this.ctx.createGain();
      this.cricketNode.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.cricketNode.connect(this.ambienceNode);

      const cricketOsc = this.ctx.createOscillator();
      cricketOsc.type = "sine";
      cricketOsc.frequency.setValueAtTime(4500, this.ctx.currentTime);

      const chirpGain = this.ctx.createGain();
      chirpGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      cricketOsc.connect(chirpGain);
      chirpGain.connect(this.cricketNode);
      cricketOsc.start(0);

      // Modulate chirp gain with a 5Hz oscillator for rapid cricket vibrations
      const chirpMod = this.ctx.createOscillator();
      chirpMod.type = "sine";
      chirpMod.frequency.setValueAtTime(40, this.ctx.currentTime);
      const modGain = this.ctx.createGain();
      modGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      chirpMod.connect(modGain);
      modGain.connect(chirpGain.gain);
      chirpMod.start(0);

      // Random cricket chirps scheduler
      const triggerCricket = () => {
        if (!this.ctx || !this.cricketNode) return;
        const now = this.ctx.currentTime;
        chirpGain.gain.cancelScheduledValues(now);
        // Short chirp duration
        chirpGain.gain.setValueAtTime(0.1, now);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      };
      
      const interval = setInterval(triggerCricket, 2000);
      (this.cricketNode as any).interval = interval;

    } catch (e) {
      console.warn("Failed to start ambience synthesizer", e);
    }
  }

  stopAmbience() {
    if (this.cricketNode) {
      clearInterval((this.cricketNode as any).interval);
      try { this.cricketNode.disconnect(); } catch {}
      this.cricketNode = null;
    }
    if (this.windNode) {
      try { this.windNode.disconnect(); } catch {}
      this.windNode = null;
    }
    if (this.ambienceNode) {
      try { this.ambienceNode.disconnect(); } catch {}
      this.ambienceNode = null;
    }
  }

  startMusic() {
    if (!this.musicEnabled) return;
    this.initCtx();
    if (!this.ctx) return;
    if (this.musicInterval) return; // Already playing

    try {
      // Reverb/Delay unit for magical space
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.setValueAtTime(0.4, this.ctx.currentTime);
      const delayGain = this.ctx.createGain();
      delayGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

      this.delayNode.connect(delayGain);
      delayGain.connect(this.delayNode); // feedback loop
      delayGain.connect(this.ctx.destination);

      // A simple pentatonic melody loop: C4, D4, E4, G4, A4, C5, D5...
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
      let step = 0;

      this.musicInterval = setInterval(() => {
        if (!this.ctx) return;
        
        // Random pentatonic melody
        const randomNote = scale[Math.floor(Math.random() * scale.length)];
        const time = this.ctx.currentTime;
        
        // Play node
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(randomNote, time);
        
        gain.gain.setValueAtTime(0.0, time);
        gain.gain.linearRampToValueAtTime(0.04, time + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        if (this.delayNode) gain.connect(this.delayNode);
        
        osc.start(time);
        osc.stop(time + 1.5);
        
        step++;
      }, 700);

    } catch (e) {
      console.warn("Failed to start music synthesizer", e);
    }
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.delayNode) {
      try { this.delayNode.disconnect(); } catch {}
      this.delayNode = null;
    }
  }

  // Play short pop sound on click
  playClick() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.08);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  // Play success chime
  playSuccess() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time + idx * 0.08);

      gain.gain.setValueAtTime(0.0, time + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.06, time + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time + idx * 0.08);
      osc.stop(time + idx * 0.08 + 0.4);
    });
  }

  // Play failure sound
  playFailure() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, time); // A3
    osc.frequency.linearRampToValueAtTime(110, time + 0.45); // Slide down to A2

    gain.gain.setValueAtTime(0.0, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    // Apply lowpass filter to make it softer
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500, time);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }

  // Play badge unlock fanfare
  playBadge() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const arpeggio = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51]; // G4, C5, E5, G5, C6, E6
    
    arpeggio.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time + idx * 0.06);

      gain.gain.setValueAtTime(0.0, time + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.08, time + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + idx * 0.06 + 0.5);

      // Add a slight vibrato
      const vibrato = this.ctx.createOscillator();
      vibrato.frequency.value = 6; // 6Hz
      const vibratoGain = this.ctx.createGain();
      vibratoGain.gain.value = 4; // freq shift
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      
      vibrato.start(time + idx * 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time + idx * 0.06);
      
      vibrato.stop(time + idx * 0.06 + 0.6);
      osc.stop(time + idx * 0.06 + 0.6);
    });
  }

  // Play level completion fanfare
  playLevelComplete() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const time = this.ctx.currentTime;
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [349.23, 440.00, 523.25], // F major
      [392.00, 493.88, 587.33], // G major
      [523.25, 659.25, 783.99, 1046.50] // C major oct
    ];

    chords.forEach((chord, chordIdx) => {
      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, time + chordIdx * 0.25);

        gain.gain.setValueAtTime(0.0, time + chordIdx * 0.25);
        gain.gain.linearRampToValueAtTime(0.05, time + chordIdx * 0.25 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + chordIdx * 0.25 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(time + chordIdx * 0.25);
        osc.stop(time + chordIdx * 0.25 + 0.55);
      });
    });
  }
}

export const audioSystem = new AudioSystem();
