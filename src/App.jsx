// File: src/App.jsx
import React, { useEffect, useRef } from 'react';
import HUD from './components/HUD';
import { playHeavyImpact } from './utils/audioEngine';
import { SpatialObject } from './engine/SpatialObject';

const Hands = window.Hands;
const Camera = window.Camera;

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

// UI HAND TRACKING: CYBER-MONACO BLUE PALETTE
const COLOR_SCHEME = { 
  idle: 'rgba(0, 150, 255,',     // Deep Blue Solid
  active: 'rgba(0, 255, 255,',   // Cyan Neon 
  hud_text: '#00FFFF'            // Teks Aktif di HUD jadi Cyan Menyala
};

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const h1StatusRef = useRef(null); const h1CoordRef = useRef(null);
  const h2StatusRef = useRef(null); const h2CoordRef = useRef(null);

  const isInitialized = useRef(false);
  const handStates = useRef([{ isPinching: false }, { isPinching: false }]);
  
  const sceneRef = useRef([]);
  const grabbedObjIdRef = useRef(null); 

  useEffect(() => {
    if (isInitialized.current || !Hands || !Camera) return;
    isInitialized.current = true;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d');

    const w = window.innerWidth;
    const h = window.innerHeight;
    
    sceneRef.current = [
      new SpatialObject("obj-kiri", w * 0.25, h / 2, -250),
      new SpatialObject("obj-kanan", w * 0.75, h / 2, -250)
    ];

    const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });

    hands.onResults((results) => {
      if (results.image && isInitialized.current) {
        if(canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
          canvasElement.width = videoElement.videoWidth; canvasElement.height = videoElement.videoHeight;
        }
      }

      ctx.save();
      ctx.translate(canvasElement.width, 0); ctx.scale(-1, 1);
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      if (results.image) {
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        
        // --- FIX 1: CINEMATIC SMOKE DARK FILTER ---
        // Konsisten 100% gelap elegan biar hologram nyala maksimal
        ctx.fillStyle = 'rgba(3, 11, 20, 0.75)'; 
        ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
      }

      const time = Date.now() * 0.0015; 
      const centerX = canvasElement.width / 2;
      const centerY = canvasElement.height / 2;

      let isTelekinesisActive = false;
      let targetX = centerX; let targetY = centerY;

      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        if (h1StatusRef.current) { 
          h1StatusRef.current.innerText = "[ SCANNING ]"; 
          h1StatusRef.current.style.color = '#4A7A9C'; 
          h1StatusRef.current.style.textShadow = 'none';
          h1CoordRef.current.innerText = "X: 0.00 | Y: 0.00"; 
        }
        if (h2StatusRef.current) { 
          h2StatusRef.current.innerText = "[ SCANNING ]"; 
          h2StatusRef.current.style.color = '#4A7A9C'; 
          h2StatusRef.current.style.textShadow = 'none';
          h2CoordRef.current.innerText = "X: 0.00 | Y: 0.00"; 
        }
        handStates.current[0].isPinching = false; handStates.current[1].isPinching = false;
      } else {
        let selectionData = null;

        for (let index = 0; index < results.multiHandLandmarks.length; index++) {
            const landmarks = results.multiHandLandmarks[index];
            const thumbTip = landmarks[4];
            
            for (const finger of activeFingers) {
                const pinchDistance = getDistance(thumbTip, landmarks[finger.tip], canvasElement.width, canvasElement.height);
                if (pinchDistance < 40) { 
                    isTelekinesisActive = true; 
                    selectionData = {
                      x: ((thumbTip.x + landmarks[finger.tip].x) / 2) * canvasElement.width,
                      y: ((thumbTip.y + landmarks[finger.tip].y) / 2) * canvasElement.height,
                    };
                    break;
                }
            }
            if(selectionData) break;
        }

        if (isTelekinesisActive && selectionData) { 
            targetX = selectionData.x; 
            targetY = selectionData.y; 
        }
      }

      for (const obj of sceneRef.current) obj.isGrabbed = false;

      if (isTelekinesisActive) {
        if (grabbedObjIdRef.current === null) {
          let closestObj = null;
          let minDistance = Infinity;
          for (const obj of sceneRef.current) {
            const dx = obj.x - targetX; const dy = obj.y - targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) { minDistance = dist; closestObj = obj; }
          }
          if (closestObj) grabbedObjIdRef.current = closestObj.id;
        }
      } else {
        grabbedObjIdRef.current = null;
      }

      // --- RENDER OBJEK KINESIS ---
      for (const obj of sceneRef.current) {
        if (obj.id === grabbedObjIdRef.current) {
          obj.isGrabbed = true;
          obj.updatePhysics(targetX, targetY, obj.z); 
        } else {
          obj.updatePhysics(obj.x, obj.y, obj.z); 
        }
        obj.render(ctx, time);
      }

      // --- RENDER UI TANGAN AI ---
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        
        ctx.globalCompositeOperation = 'source-over';

        for (let index = 0; index < results.multiHandLandmarks.length; index++) {
            const landmarks = results.multiHandLandmarks[index];
            const rawX = (landmarks[0].x * 100).toFixed(2); const rawY = (landmarks[0].y * 100).toFixed(2);
            const dx = (landmarks[0].x - landmarks[9].x) * canvasElement.width; const dy = (landmarks[0].y - landmarks[9].y) * canvasElement.height;
            const palmScale = Math.max(0.4, Math.min(Math.sqrt(dx * dx + dy * dy) / 150, 2.5));
            const palmCenter = { x: (landmarks[0].x + landmarks[5].x + landmarks[17].x) / 3 * canvasElement.width, y: (landmarks[0].y + landmarks[5].y + landmarks[17].y) / 3 * canvasElement.height };
            
            ctx.save(); ctx.translate(palmCenter.x, palmCenter.y); ctx.rotate(time); ctx.beginPath(); ctx.arc(0, 0, 70 * palmScale, 0, Math.PI * 1.5);
            ctx.strokeStyle = COLOR_SCHEME.active + ' 0.9)'; ctx.lineWidth = 4 * palmScale; ctx.shadowBlur = 15 * palmScale; ctx.shadowColor = COLOR_SCHEME.active + ' 1)';
            ctx.setLineDash([10 * palmScale, 15 * palmScale]); ctx.stroke();
            
            ctx.rotate(-time * 2.5); ctx.beginPath(); ctx.arc(0, 0, 45 * palmScale, 0, Math.PI * 2);
            ctx.strokeStyle = COLOR_SCHEME.idle + ' 0.9)'; ctx.lineWidth = 6 * palmScale; ctx.shadowBlur = 20 * palmScale; ctx.shadowColor = COLOR_SCHEME.idle + ' 1)';
            ctx.setLineDash([5 * palmScale, 10 * palmScale]); ctx.stroke();
            
            ctx.beginPath(); ctx.arc(0, 0, 8 * palmScale, 0, Math.PI * 2); ctx.fillStyle = COLOR_SCHEME.idle + ' 1)'; ctx.shadowBlur = 25 * palmScale; ctx.fill();
            ctx.restore(); ctx.setLineDash([]); 
            
            ctx.beginPath();
            const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
            for (const conn of connections) {
                const startX = landmarks[conn[0]].x * canvasElement.width; const startY = landmarks[conn[0]].y * canvasElement.height;
                const endX = landmarks[conn[1]].x * canvasElement.width; const endY = landmarks[conn[1]].y * canvasElement.height;
                ctx.moveTo(startX, startY); ctx.lineTo(endX, endY);
            }
            
            ctx.shadowBlur = 10 * palmScale; ctx.shadowColor = COLOR_SCHEME.idle + ' 1)';
            ctx.strokeStyle = COLOR_SCHEME.idle + ' 0.9)'; ctx.lineWidth = 3 * palmScale;
            ctx.stroke(); ctx.shadowBlur = 0; 
            
            const thumbTip = landmarks[4]; let isAnyFingerPinching = false; 
            
            let activeStatus = "[ ACTIVE ]"; let statusColor = '#4A7A9C'; 
            
            for (const finger of activeFingers) {
                const fingerTip = landmarks[finger.tip]; 
                const pinchDistance = getDistance(thumbTip, fingerTip, canvasElement.width, canvasElement.height);
                
                if (pinchDistance < Math.max(15, finger.tolerance * palmScale)) {
                    isAnyFingerPinching = true; activeStatus = `[ ${finger.name} GRAB ]`; statusColor = COLOR_SCHEME.hud_text; 
                    const midX = ((thumbTip.x + fingerTip.x) / 2) * canvasElement.width; const midY = ((thumbTip.y + fingerTip.y) / 2) * canvasElement.height;
                    
                    ctx.beginPath(); ctx.arc(midX, midY, 25 * palmScale, 0, Math.PI * 2); ctx.shadowBlur = 35 * palmScale; ctx.shadowColor = COLOR_SCHEME.active + ' 1)';
                    ctx.fillStyle = COLOR_SCHEME.active + ' 0.95)'; ctx.fill(); ctx.shadowBlur = 0; 
                    
                    ctx.save(); ctx.translate(midX, midY); ctx.scale(-1, 1); const pwr = Math.max(0, 100 - (pinchDistance / 100 * 100)).toFixed(0);
                    ctx.font = `bold ${14 * palmScale}px monospace`; ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 10 * palmScale; ctx.shadowColor = '#ffffff';
                    ctx.fillText(`${pwr}% PWR`, 30 * palmScale, -15 * palmScale); ctx.font = `normal ${12 * palmScale}px monospace`; ctx.fillStyle = '#ffffff';
                    ctx.fillText(`ID: ${finger.name}`, 30 * palmScale, 5 * palmScale); ctx.restore();
                    
                    if (!handStates.current[index].isPinching) { try { playHeavyImpact(); } catch (e) { } handStates.current[index].isPinching = true; }
                    break; 
                }
            }
            if (!isAnyFingerPinching) handStates.current[index].isPinching = false;
            
            const tipNodes = [4, 8, 12, 16, 20];
            for (const [i, point] of landmarks.entries()) {
                const x = point.x * canvasElement.width; const y = point.y * canvasElement.height; const isTip = tipNodes.includes(i);
                ctx.beginPath(); ctx.arc(x, y, 16 * palmScale, 0, Math.PI * 2); ctx.shadowBlur = 15 * palmScale; 
                if (isTip) { ctx.shadowColor = COLOR_SCHEME.active + ' 1)'; ctx.strokeStyle = COLOR_SCHEME.active + ' 1)'; } 
                else { ctx.shadowColor = COLOR_SCHEME.idle + ' 1)'; ctx.strokeStyle = '#ffffff'; }
                ctx.lineWidth = 4 * palmScale; ctx.stroke();
                
                ctx.beginPath(); ctx.arc(x, y, 5 * palmScale, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.shadowBlur = 0; 
            }

            if (index === 0 && h1StatusRef.current) { 
              h1StatusRef.current.innerText = activeStatus; 
              h1StatusRef.current.style.color = statusColor; 
              h1StatusRef.current.style.textShadow = statusColor === COLOR_SCHEME.hud_text ? `0 0 10px ${COLOR_SCHEME.hud_text}` : 'none'; 
              h1CoordRef.current.innerText = `X: ${rawX} | Y: ${rawY}`; 
            } 
            else if (index === 1 && h2StatusRef.current) { 
              h2StatusRef.current.innerText = activeStatus; 
              h2StatusRef.current.style.color = statusColor; 
              h2StatusRef.current.style.textShadow = statusColor === COLOR_SCHEME.hud_text ? `0 0 10px ${COLOR_SCHEME.hud_text}` : 'none';
              h2CoordRef.current.innerText = `X: ${rawX} | Y: ${rawY}`; 
            }
        }
      }
      ctx.restore(); 
    });

    const camera = new Camera(videoElement, { onFrame: async () => { await hands.send({ image: videoElement }); }, width: 960, height: 540 });
    camera.start();

    return () => { camera.stop(); };
  }, []);

  return (
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