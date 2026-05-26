// File: src/components/HUD.jsx
import React from 'react';

export default function HUD({ title, position, statusRef, coordRef }) {
  // Atur posisi pojok kiri atau kanan
  const positionClass = position === 'left' ? 'left-6' : 'right-6';

  return (
    <div className={`absolute top-6 ${positionClass} z-30 flex flex-col gap-2 font-mono select-none pointer-events-none`}>
      
      {/* CARD UTAMA: Opasitas diturunin ke 60% (/60) dan Blur dinaikin (blur-lg) */}
      <div className="w-72 bg-[#FFF4E4]/60 backdrop-blur-lg border border-[#E3E3E3]/30 p-4 rounded-sm shadow-2xl flex flex-col gap-3 transition-all duration-500">
        
        {/* HEADER: Rich Black (#141414) */}
        <div className="flex justify-between items-center border-b border-[#68191E]/10 pb-2">
          <span className="text-[10px] font-black text-[#141414] tracking-widest opacity-80">
            {title}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#68191E] animate-pulse" />
        </div>

        {/* STATUS: Wine Red (#68191E) */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#141414]/40 uppercase tracking-wider font-bold">System State</span>
          <div 
            ref={statusRef} 
            className="text-lg font-black text-[#68191E] tracking-tight transition-all duration-300"
          >
            [ SCANNING ]
          </div>
        </div>

        {/* TELEMETRY: Lebih tipis biar nggak berisik visualnya */}
        <div className="flex flex-col gap-0.5 bg-[#141414]/5 p-2 rounded-xs border border-[#141414]/5">
          <span className="text-[8px] text-[#141414]/30 uppercase tracking-wider font-bold">Telemetry Data</span>
          <div 
            ref={coordRef} 
            className="text-[10px] font-bold text-[#141414]/80 tracking-normal"
          >
            X: 0.00 | Y: 0.00
          </div>
        </div>

      </div>

      {/* AKSEN GARIS EDITORIAL (Tipis aja der) */}
      <div className={`w-8 h-[1px] bg-[#68191E]/30 ${position === 'left' ? 'self-start' : 'self-end'}`} />
    </div>
  );
}