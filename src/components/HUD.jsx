// File: src/components/HUD.jsx
import React from 'react';

export default function HUD({ title, position, statusRef, coordRef }) {
  const positionClass = position === 'left' ? 'left-6' : 'right-6';

  return (
    <div className={`absolute top-6 ${positionClass} z-30 flex flex-col gap-2 font-mono select-none pointer-events-none`}>
      <div className="w-72 bg-[#030B14]/70 backdrop-blur-md border border-[#00FFFF]/20 p-4 rounded-sm shadow-[0_0_15px_#00FFFF1A] flex flex-col gap-3 transition-all duration-500">
        
        <div className="flex justify-between items-center border-b border-[#00FFFF]/20 pb-2">
          <span className="text-[10px] font-bold text-[#4A7A9C] tracking-widest uppercase">
            {title}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FFFF] animate-pulse shadow-[0_0_5px_#00FFFF]" />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] text-[#4A7A9C]/70 uppercase tracking-wider font-bold">System State</span>
          <div 
            ref={statusRef} 
            className="text-lg font-black text-[#00FFFF] tracking-tight transition-all duration-300 drop-shadow-[0_0_8px_#00FFFFCC]"
          >
            [ SCANNING ]
          </div>
        </div>

        <div className="flex flex-col gap-0.5 bg-[#00FFFF]/5 p-2 rounded-sm border border-[#00FFFF]/10">
          <span className="text-[8px] text-[#4A7A9C]/60 uppercase tracking-wider font-bold">Telemetry Data</span>
          <div 
            ref={coordRef} 
            className="text-[10px] font-bold text-[#00FFFF]/80 tracking-normal"
          >
            X: 0.00 | Y: 0.00
          </div>
        </div>

      </div>
      <div className={`w-12 h-[1px] bg-[#00FFFF]/40 ${position === 'left' ? 'self-start' : 'self-end'}`} />
    </div>
  );
}