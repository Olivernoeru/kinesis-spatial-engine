// File: src/utils/audioEngine.js

let audioCtx = null;

export const playHeavyImpact = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const bufferSize = audioCtx.sampleRate * 0.15; 
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1; 
  
  const noise = audioCtx.createBufferSource(); 
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass'; 
  filter.frequency.setValueAtTime(800, audioCtx.currentTime); 
  filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
  
  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime); 
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15); 
  
  noise.connect(filter); 
  filter.connect(gainNode); 
  gainNode.connect(audioCtx.destination);
  noise.start();
};