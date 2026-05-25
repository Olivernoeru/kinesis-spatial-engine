// File: src/components/HUD.jsx
import React from 'react';

export default function HUD({ title, position, statusRef, coordRef }) {
  // Logika buat nentuin posisi kotak (kiri atau kanan)
  const isLeft = position === 'left';
  const positionClass = isLeft ? 'left-6' : 'right-6 text-right';

  return (
    <div className={`absolute top-6 ${positionClass} bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-xl z-20 shadow-2xl`}>
      <h2 className="text-gray-400 text-[10px] tracking-[0.3em] mb-3 border-b border-white/10 pb-2">
        {title}
      </h2>
      <div ref={statusRef} className="text-gray-500 font-bold tracking-widest">
        [ STANDBY ]
      </div>
      <div ref={coordRef} className="text-xs text-gray-600 mt-1">
        X: 0.00 | Y: 0.00
      </div>
    </div>
  );
}