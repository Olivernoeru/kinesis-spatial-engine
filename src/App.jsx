// File: src/App.jsx
import React, { useEffect, useRef } from 'react';

// 1. IMPORT MODULAR
import HUD from './components/HUD';
import { playHeavyImpact } from './utils/audioEngine';

// AI dari global window
const Hands = window.Hands;
const Camera = window.Camera;

// --- CONFIGURATION & UTILITIES ---
const getDistance = (p1, p2, width, height) => {
  const dx = (p1.x - p2.x) * width; const dy = (p1.y - p2.y) * height;
  return Math.sqrt(dx * dx + dy * dy);
};

const activeFingers = [
  { name: "INDEX", tip: 8, tolerance: 35 },    
  { name: "MIDDLE", tip: 12, tolerance: 30 },  
  { name: "RING", tip: 16, tolerance: 30 },    
  { name: "PINKY", tip: 20, tolerance: 25 }    
];

const COLOR_SCHEME = {
    core_cyan: 'rgba(0, 255, 255,', 
    accent_orange: 'rgba(255, 136, 0,', 
    node_center: '#ffffff' 
};

// --- DATA OBJEK 3D (Icosahedron) ---
const t = (1.0 + Math.sqrt(5.0)) / 2.0;
const icoNodes = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
];
const icoEdges = [
    [0,11],[0,5],[0,1],[0,7],[0,10],[1,9],[1,5],[1,8],[1,7],[2,11],[2,10],[2,4],[2,6],[2,3],[3,9],[3,8],[3,4],[3,6],[4,9],[4,5],[4,11],[5,9],[6,8],[6,7],[6,10],[7,8],[8,9],[10,11]
];

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const h1StatusRef = useRef(null); const h1CoordRef = useRef(null);
  const h2StatusRef = useRef(null); const h2CoordRef = useRef(null);

  const isInitialized = useRef(false);
  const handStates = useRef([{ isPinching: false }, { isPinching: false }]);
  
  const tObj = useRef({ 
      x: 0, y: 0, vx: 0, vy: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 60 
  });

  useEffect(() => {
    if (isInitialized.current || !Hands || !Camera) return;
    isInitialized.current = true;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d');

    tObj.current.x = window.innerWidth / 2;
    tObj.current.y = window.innerHeight / 2;

    const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });

    hands.onResults((results) => {
      if (results.image && (canvasElement.width !== results.image.width || canvasElement.height !== results.image.height)) {
        canvasElement.width = results.image.width; canvasElement.height = results.image.height;
      }

      ctx.save();
      ctx.translate(canvasElement.width, 0); ctx.scale(-1, 1);
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      if (results.image) ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      const time = Date.now() * 0.0015; 
      const centerX = canvasElement.width / 2;
      const centerY = canvasElement.height / 2;

      let isTelekinesisActive = false;
      let targetX = centerX; let targetY = centerY;

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        if (h1StatusRef.current) { h1StatusRef.current.innerText = "[ SCANNING ]"; h1StatusRef.current.style.color = "#888"; h1CoordRef.current.innerText = "X: 0.00 | Y: 0.00"; }
        if (h2StatusRef.current) { h2StatusRef.current.innerText = "[ SCANNING ]"; h2StatusRef.current.style.color = "#888"; h2CoordRef.current.innerText = "X: 0.00 | Y: 0.00"; }
        handStates.current[0].isPinching = false; handStates.current[1].isPinching = false;
      } else {
        let activeHandsCount = 0; let sumX = 0; let sumY = 0;

        for (let index = 0; index < results.multiHandLandmarks.length; index++) {
            const landmarks = results.multiHandLandmarks[index];
            const thumbTip = landmarks[4];
            
            for (const finger of activeFingers) {
                const pinchDist = getDistance(thumbTip, landmarks[finger.tip], canvasElement.width, canvasElement.height);
                if (pinchDist < 40) { 
                    isTelekinesisActive = true; activeHandsCount++;
                    sumX += ((thumbTip.x + landmarks[finger.tip].x) / 2) * canvasElement.width;
                    sumY += ((thumbTip.y + landmarks[finger.tip].y) / 2) * canvasElement.height;
                    break;
                }
            }
        }
        if (isTelekinesisActive) { targetX = sumX / activeHandsCount; targetY = sumY / activeHandsCount; }
      }

      const tension = 0.05; const dampening = 0.85; 
      const ax = (targetX - tObj.current.x) * tension; const ay = (targetY - tObj.current.y) * tension;
      tObj.current.vx += ax; tObj.current.vy += ay;
      tObj.current.vx *= dampening; tObj.current.vy *= dampening;
      tObj.current.x += tObj.current.vx; tObj.current.y += tObj.current.vy;

      tObj.current.rotX += isTelekinesisActive ? 0.08 : 0.02;
      tObj.current.rotY += isTelekinesisActive ? 0.1 : 0.03;

      ctx.save();
      ctx.translate(tObj.current.x, tObj.current.y);
      const projectedNodes = icoNodes.map(node => {
          let x = node[0]; let y = node[1]; let z = node[2];
          let cos = Math.cos(tObj.current.rotX); let sin = Math.sin(tObj.current.rotX);
          let y1 = y * cos - z * sin; let z1 = y * sin + z * cos; y = y1; z = z1;
          cos = Math.cos(tObj.current.rotY); sin = Math.sin(tObj.current.rotY);
          let x1 = x * cos + z * sin; let z2 = -x * sin + z * cos; x = x1; z = z2;

          const fov = 350; const scale = (fov / (fov + z)) * tObj.current.scale;
          return { x: x * scale, y: y * scale, z: z };
      });

      ctx.beginPath();
      for (const edge of icoEdges) {
          const p1 = projectedNodes[edge[0]]; const p2 = projectedNodes[edge[1]];
          ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      }
      
      const baseBlur = isTelekinesisActive ? 35 : 15;
      const pulseGlow = baseBlur + Math.sin(time * 3) * (isTelekinesisActive ? 10 : 5);
      
      ctx.shadowBlur = pulseGlow;
      ctx.shadowColor = isTelekinesisActive ? COLOR_SCHEME.accent_orange + ' 1)' : COLOR_SCHEME.core_cyan + ' 1)';
      ctx.strokeStyle = isTelekinesisActive ? COLOR_SCHEME.accent_orange + ' 0.9)' : COLOR_SCHEME.core_cyan + ' 0.8)'; 
      ctx.lineWidth = 3; ctx.stroke(); ctx.shadowBlur = 0;
      
      for (const p of projectedNodes) {
          ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = COLOR_SCHEME.node_center + ')'; ctx.fill();
      }
      ctx.restore();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (let index = 0; index < results.multiHandLandmarks.length; index++) {
            const landmarks = results.multiHandLandmarks[index];
            
            // --- FIX ERROR: DEKLARASI rawX & rawY KEMBALI ---
            const rawX = (landmarks[0].x * 100).toFixed(2); 
            const rawY = (landmarks[0].y * 100).toFixed(2);

            const dx = (landmarks[0].x - landmarks[9].x) * canvasElement.width;
            const dy = (landmarks[0].y - landmarks[9].y) * canvasElement.height;
            const palmScale = Math.max(0.4, Math.min(Math.sqrt(dx * dx + dy * dy) / 150, 2.5));

            const palmCenter = {
                x: (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3 * canvasElement.width,
                y: (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3 * canvasElement.height
            };

            ctx.save(); ctx.translate(palmCenter.x, palmCenter.y); 
            ctx.rotate(time); ctx.beginPath();
            ctx.arc(0, 0, 70 * palmScale, 0, Math.PI * 1.5);
            ctx.strokeStyle = COLOR_SCHEME.accent_orange + ' 0.9)'; ctx.lineWidth = 4 * palmScale; 
            ctx.shadowBlur = 15 * palmScale; ctx.shadowColor = COLOR_SCHEME.accent_orange + ' 1)';
            ctx.setLineDash([10 * palmScale, 15 * palmScale]); ctx.stroke();

            ctx.rotate(-time * 2.5); ctx.beginPath();
            ctx.arc(0, 0, 45 * palmScale, 0, Math.PI * 2);
            ctx.strokeStyle = COLOR_SCHEME.core_cyan + ' 0.9)'; ctx.lineWidth = 6 * palmScale; 
            ctx.shadowBlur = 20 * palmScale; ctx.shadowColor = COLOR_SCHEME.core_cyan + ' 1)';
            ctx.setLineDash([5 * palmScale, 10 * palmScale]); ctx.stroke();

            ctx.beginPath(); ctx.arc(0, 0, 8 * palmScale, 0, Math.PI * 2);
            ctx.fillStyle = COLOR_SCHEME.core_cyan + ' 1)'; ctx.shadowBlur = 25 * palmScale; ctx.fill();
            ctx.restore(); ctx.setLineDash([]); 

            const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
            for (const conn of connections) {
                const startX = landmarks[conn[0]].x * canvasElement.width; const startY = landmarks[conn[0]].y * canvasElement.height;
                const endX = landmarks[conn[1]].x * canvasElement.width; const endY = landmarks[conn[1]].y * canvasElement.height;
                ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY);
                ctx.shadowBlur = 20 * palmScale; ctx.shadowColor = COLOR_SCHEME.core_cyan + ' 1)';
                ctx.strokeStyle = COLOR_SCHEME.core_cyan + ' 0.8)'; ctx.lineWidth = 3.5 * palmScale; ctx.stroke();
                ctx.shadowBlur = 0; 
            }

            const thumbTip = landmarks[4]; 
            let isAnyFingerPinching = false;
            let activeStatus = "[ ACTIVE ]"; let statusColor = COLOR_SCHEME.core_cyan + " 1)";

            for (const finger of activeFingers) {
                const fingerTip = landmarks[finger.tip];
                const pinchDistance = getDistance(thumbTip, fingerTip, canvasElement.width, canvasElement.height);
                
                if (pinchDistance < Math.max(15, finger.tolerance * palmScale)) {
                    isAnyFingerPinching = true;
                    activeStatus = `[ ${finger.name} GRAB ]`; statusColor = COLOR_SCHEME.accent_orange + " 1)";
                    
                    const midX = ((thumbTip.x + fingerTip.x) / 2) * canvasElement.width;
                    const midY = ((thumbTip.y + fingerTip.y) / 2) * canvasElement.height;
                    
                    ctx.beginPath(); ctx.arc(midX, midY, 25 * palmScale, 0, Math.PI * 2); 
                    ctx.shadowBlur = 35 * palmScale; ctx.shadowColor = COLOR_SCHEME.accent_orange + ' 1)';
                    ctx.fillStyle = COLOR_SCHEME.accent_orange + ' 0.95)'; ctx.fill();
                    ctx.shadowBlur = 0; 

                    ctx.save(); ctx.translate(midX, midY); ctx.scale(-1, 1);
                    const pwr = Math.max(0, 100 - (pinchDistance / 100 * 100)).toFixed(0);
                    ctx.font = `bold ${14 * palmScale}px monospace`;
                    ctx.fillStyle = COLOR_SCHEME.accent_orange + ' 1)';
                    ctx.shadowBlur = 10 * palmScale; ctx.shadowColor = COLOR_SCHEME.accent_orange + ' 1)';
                    ctx.fillText(`${pwr}% PWR`, 30 * palmScale, -15 * palmScale);
                    ctx.font = `normal ${12 * palmScale}px monospace`;
                    ctx.fillStyle = COLOR_SCHEME.core_cyan + ' 0.95)';
                    ctx.fillText(`ID: ${finger.name}`, 30 * palmScale, 5 * palmScale);
                    ctx.restore();

                    // SILENT AUDIO EXECUTION
                    if (!handStates.current[index].isPinching) { 
                        try { playHeavyImpact(); } catch (e) { /* Abaikan error audio Chrome */ }
                        handStates.current[index].isPinching = true; 
                    }
                    break; 
                }
            }

            if (!isAnyFingerPinching) handStates.current[index].isPinching = false;

            const tipNodes = [4, 8, 12, 16, 20];
            for (const [i, point] of landmarks.entries()) {
                const x = point.x * canvasElement.width; const y = point.y * canvasElement.height;
                const isTip = tipNodes.includes(i);
                ctx.beginPath(); ctx.arc(x, y, 16 * palmScale, 0, Math.PI * 2); ctx.shadowBlur = 15 * palmScale; 
                if (isTip) { ctx.shadowColor = COLOR_SCHEME.accent_orange + ' 0.9)'; ctx.strokeStyle = COLOR_SCHEME.accent_orange + ' 0.85)'; } 
                else { ctx.shadowColor = COLOR_SCHEME.core_cyan + ' 0.9)'; ctx.strokeStyle = COLOR_SCHEME.core_cyan + ' 0.85)'; }
                ctx.lineWidth = 4 * palmScale; ctx.stroke();
                
                ctx.beginPath(); ctx.arc(x, y, 5 * palmScale, 0, Math.PI * 2);
                ctx.fillStyle = COLOR_SCHEME.node_center + ')'; ctx.fill();
                ctx.shadowBlur = 0; 
            }

            // HUD UPDATER SEKARANG UDAH AMAN (rawX dan rawY udah ada)
            if (index === 0 && h1StatusRef.current) { h1StatusRef.current.innerText = activeStatus; h1StatusRef.current.style.color = statusColor; h1CoordRef.current.innerText = `X: ${rawX} | Y: ${rawY}`; } 
            else if (index === 1 && h2StatusRef.current) { h2StatusRef.current.innerText = activeStatus; h2StatusRef.current.style.color = statusColor; h2CoordRef.current.innerText = `X: ${rawX} | Y: ${rawY}`; }
        }
      }

      ctx.restore(); 
    });

    const camera = new Camera(videoElement, { onFrame: async () => { await hands.send({ image: videoElement }); }, width: 960, height: 540 });
    camera.start();

    return () => { camera.stop(); };
  }, []);

  return (
    // Kita taruh onClick di bungkus utama buat ngebuka gembok audio Chrome diem-diem
    <div 
      className="relative w-screen h-screen bg-black overflow-hidden font-mono select-none cursor-crosshair"
      onClick={() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) { const ctx = new AudioContext(); ctx.resume(); }
      }}
    >
      <video ref={videoRef} className="hidden" autoPlay playsInline></video>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover z-0"></canvas>
      <HUD title="HAND 01 // MAIN" position="left" statusRef={h1StatusRef} coordRef={h1CoordRef} />
      <HUD title="HAND 02 // SUB" position="right" statusRef={h2StatusRef} coordRef={h2CoordRef} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none opacity-20 z-20">
        <div className="w-px h-10 bg-white absolute" /><div className="w-10 h-px bg-white absolute" />
      </div>
    </div>
  );
}