// A tiny royalty-free ambient-music engine built on the Web Audio API.
// It synthesizes looping, cinematic "heroic" chord pads in the browser, so
// the music player is fully functional without shipping any copyrighted audio.

export type AmbientTrack = {
  id: string;
  title: string;
  artist: string;
  /** Chord progression as arrays of MIDI note numbers. */
  chords: number[][];
  /** Seconds each chord sustains before the next one. */
  chordDur: number;
  waveform: OscillatorType;
  /** Low-pass cutoff in Hz — lower is warmer/darker. */
  cutoff: number;
};

// Three "soundtracks", tuned to each timer mode's mood.
export const TRACKS: AmbientTrack[] = [
  {
    id: "assemble",
    title: "Assemble",
    artist: "Avengers Suite",
    // Cmin - Ab - Eb - Bb (heroic, driving)
    chords: [
      [48, 55, 60, 63],
      [44, 51, 56, 60],
      [51, 58, 63, 67],
      [46, 53, 58, 62],
    ],
    chordDur: 4,
    waveform: "sawtooth",
    cutoff: 1100,
  },
  {
    id: "rest",
    title: "On Your Left",
    artist: "Downtime Theme",
    // Gentle, airy major pads for short breaks
    chords: [
      [50, 57, 62, 66],
      [48, 55, 60, 64],
      [45, 52, 57, 61],
      [53, 60, 64, 67],
    ],
    chordDur: 5,
    waveform: "triangle",
    cutoff: 900,
  },
  {
    id: "endgame",
    title: "Whatever It Takes",
    artist: "Long Rest",
    // Slow, spacious, reflective
    chords: [
      [43, 50, 55, 59],
      [48, 55, 60, 62],
      [45, 52, 57, 60],
      [41, 48, 53, 57],
    ],
    chordDur: 6,
    waveform: "sine",
    cutoff: 800,
  },
];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private delaySend: GainNode | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private chordIndex = 0;
  private playing = false;
  private volume = 0.5;
  private track: AmbientTrack = TRACKS[0];

  get isPlaying(): boolean {
    return this.playing;
  }

  get currentTrackId(): string {
    return this.track.id;
  }

  private ensureGraph() {
    if (this.ctx) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    // Simple feedback delay for a spacious, cinematic tail.
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.36;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.34;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    const send = ctx.createGain();
    send.gain.value = 1;
    send.connect(delay);
    this.delaySend = send;
  }

  private playChord(notes: number[], start: number, dur: number) {
    const ctx = this.ctx;
    const master = this.master;
    const send = this.delaySend;
    if (!ctx || !master || !send) return;

    const attack = Math.min(1.2, dur * 0.3);
    const release = Math.min(2.0, dur * 0.45);
    const peak = 0.14;

    notes.forEach((midi, i) => {
      const freq = midiToFreq(midi);
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc.type = this.track.waveform;
      osc2.type = this.track.waveform;
      osc.frequency.value = freq;
      osc2.frequency.value = freq;
      osc2.detune.value = 7; // mild chorus

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = this.track.cutoff;
      filter.Q.value = 0.6;

      const gain = ctx.createGain();
      // The root note is a touch louder; upper voices softer for balance.
      const voicePeak = peak * (i === 0 ? 1 : 0.7);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(voicePeak, start + attack);
      const sustainEnd = Math.max(start + attack, start + dur - release);
      gain.gain.setValueAtTime(voicePeak, sustainEnd);
      gain.gain.linearRampToValueAtTime(0.0001, start + dur);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      gain.connect(send);

      osc.start(start);
      osc2.start(start);
      osc.stop(start + dur + 0.1);
      osc2.stop(start + dur + 0.1);
    });

    // Add a low sub-bass root for weight.
    const bassOsc = ctx.createOscillator();
    bassOsc.type = "sine";
    bassOsc.frequency.value = midiToFreq(notes[0] - 12);
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.0001, start);
    bassGain.gain.linearRampToValueAtTime(0.12, start + attack);
    bassGain.gain.setValueAtTime(0.12, Math.max(start + attack, start + dur - release));
    bassGain.gain.linearRampToValueAtTime(0.0001, start + dur);
    bassOsc.connect(bassGain);
    bassGain.connect(master);
    bassOsc.start(start);
    bassOsc.stop(start + dur + 0.1);
  }

  private scheduler = () => {
    const ctx = this.ctx;
    if (!ctx || !this.playing) return;
    const lookahead = 0.4;
    while (this.nextTime < ctx.currentTime + lookahead) {
      this.playChord(
        this.track.chords[this.chordIndex],
        this.nextTime,
        this.track.chordDur,
      );
      this.nextTime += this.track.chordDur;
      this.chordIndex = (this.chordIndex + 1) % this.track.chords.length;
    }
  };

  async play() {
    this.ensureGraph();
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (ctx.state === "suspended") await ctx.resume();
    this.playing = true;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.linearRampToValueAtTime(this.volume, now + 0.8);
    if (this.nextTime < now) this.nextTime = now + 0.1;
    if (this.timer == null) {
      this.timer = window.setInterval(this.scheduler, 80);
    }
    this.scheduler();
  }

  pause() {
    const ctx = this.ctx;
    const master = this.master;
    this.playing = false;
    if (this.timer != null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.0001, now + 0.5);
    }
  }

  setTrack(id: string) {
    const next = TRACKS.find((t) => t.id === id);
    if (!next || next.id === this.track.id) return;
    this.track = next;
    this.chordIndex = 0;
    // Start the new progression almost immediately for a responsive switch.
    if (this.ctx && this.playing) {
      this.nextTime = this.ctx.currentTime + 0.1;
    }
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    const ctx = this.ctx;
    const master = this.master;
    if (ctx && master && this.playing) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(this.volume, now + 0.15);
    }
  }

  dispose() {
    this.pause();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
      this.delaySend = null;
    }
  }
}
