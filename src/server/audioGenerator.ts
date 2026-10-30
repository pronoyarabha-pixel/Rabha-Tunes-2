import fs from 'fs';
import path from 'path';

/**
 * Generates an authentic sounding, soothing acoustic/folk pentatonic WAV file.
 * Features:
 * - Bamboo flute-like melodic lines (pentatonic scale with vibrato)
 * - Warm ethnic acoustic drone (fundamental + 5th)
 * - Rhythmic folk percussion (Kham drum thud and soft cymbals)
 */
export function generateSyntheticFolkWav(
  filePath: string,
  durationSec: number = 60,
  melodyMood: 'peaceful' | 'ambient' | 'festive' = 'peaceful'
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sampleRate = 22050; // High efficiency, sounds great for acoustic flute/drum
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataByteLength = numSamples * numChannels * (bitsPerSample / 8);

  const buffer = Buffer.alloc(44 + dataByteLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataByteLength, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);

  // 'data' subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataByteLength, 40);

  // Pentatonic notes in Hz (C4, D4, E4, G4, A4, C5, D5, E5, G5)
  const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];

  // Melody patterns based on mood
  let noteDuration = melodyMood === 'festive' ? 0.35 : 0.75;
  let melodySeq: number[] = [];
  if (melodyMood === 'peaceful') {
    melodySeq = [0, 1, 2, 4, 3, 2, 0, 2, 4, 5, 4, 2, 1, 0, -1, 2];
  } else if (melodyMood === 'ambient') {
    melodySeq = [4, 3, 2, 0, 1, 2, 4, 6, 5, 4, 2, 1, 0, -1, 0, 2];
    noteDuration = 1.1;
  } else {
    melodySeq = [0, 2, 4, 5, 4, 2, 4, 5, 7, 5, 4, 2, 1, 2, 0, 0];
    noteDuration = 0.3;
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // 1. Drone chord (gentle tanpura/dotara hum)
    const drone1 = Math.sin(2 * Math.PI * 130.81 * t) * 0.15; // C3
    const drone2 = Math.sin(2 * Math.PI * 196.00 * t) * 0.08; // G3
    const droneShimmer = Math.sin(2 * Math.PI * 0.2 * t) * 0.04;

    // 2. Flute Melody
    const currentNoteIndex = Math.floor(t / noteDuration) % melodySeq.length;
    const noteStep = melodySeq[currentNoteIndex];
    let fluteSample = 0;

    if (noteStep >= 0 && noteStep < pentatonic.length) {
      const noteTime = t % noteDuration;
      const freq = pentatonic[noteStep];
      // Vibrato (5Hz)
      const vibrato = Math.sin(2 * Math.PI * 5 * noteTime) * (noteTime > 0.3 ? 4.0 : 1.0);
      const actualFreq = freq + vibrato;

      // Gentle attack and release envelope
      let envelope = 1;
      if (noteTime < 0.08) {
        envelope = noteTime / 0.08;
      } else if (noteTime > noteDuration - 0.08) {
        envelope = (noteDuration - noteTime) / 0.08;
      }

      // Flute timbre: pure fundamental + soft 2nd & 3rd harmonics + breath noise
      const breath = (Math.random() * 2 - 1) * 0.015;
      const h1 = Math.sin(2 * Math.PI * actualFreq * t);
      const h2 = Math.sin(2 * Math.PI * (actualFreq * 2) * t) * 0.25;
      const h3 = Math.sin(2 * Math.PI * (actualFreq * 3) * t) * 0.1;

      fluteSample = (h1 + h2 + h3 + breath) * envelope * 0.45;
    }

    // 3. Folk percussion (Kham drum on beats + cymbals)
    const beatInterval = melodyMood === 'festive' ? 0.3 : 0.6;
    const beatPhase = (t % beatInterval) / beatInterval;
    let drumSample = 0;
    if (beatPhase < 0.15) {
      // Kham bass thud (pitch drops from 90Hz to 45Hz)
      const drumT = beatPhase * beatInterval;
      const drumPitch = 90 * Math.exp(-drumT * 25);
      drumSample = Math.sin(2 * Math.PI * drumPitch * drumT) * Math.exp(-drumT * 18) * 0.35;
    }
    // High brass cymbal tick on off-beat
    let cymbalSample = 0;
    const offBeatPhase = ((t + beatInterval * 0.5) % beatInterval) / beatInterval;
    if (offBeatPhase < 0.04) {
      cymbalSample = (Math.random() * 2 - 1) * Math.exp(-offBeatPhase * 40) * 0.08;
    }

    // Master mix
    const mix = (drone1 + drone2 + droneShimmer) + fluteSample + drumSample + cymbalSample;

    // Soft clip limiter to prevent clipping
    const clamped = Math.max(-1, Math.min(1, mix));
    const sampleInt16 = Math.floor(clamped * 32767);

    buffer.writeInt16LE(sampleInt16, offset);
    offset += 2;
  }

  fs.writeFileSync(filePath, buffer);
}
