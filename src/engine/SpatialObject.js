// File: src/engine/SpatialObject.js

// --- 1. DATA GEOMETRI MESIN ---
const t = (1.0 + Math.sqrt(5.0)) / 2.0;
const icoNodes = [
  [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
  [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
  [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
];
const icoEdges = [
  [0,11],[0,5],[0,1],[0,7],[0,10],[1,9],[1,5],[1,8],[1,7],[2,11],
  [2,10],[2,4],[2,6],[2,3],[3,9],[3,8],[3,4],[3,6],[4,9],[4,5],
  [4,11],[5,9],[6,8],[6,7],[6,10],[7,8],[8,9],[10,11]
];

// --- 2. PALET ULTIMATE CRIMSON + ADDITIVE BLENDING ---
const COLOR_SCHEME = {
  idle_stroke: 'rgba(255, 40, 80,',    // Merah terang untuk garis solid
  idle_glow: 'rgba(220, 0, 30,',       // Merah darah pekat untuk efek glow (kontras absolut)
  active_stroke: 'rgba(255, 255, 255,',// Putih murni saat ditarik
  active_glow: 'rgba(255, 80, 80,',    // Cahaya merah muda saat ditarik
  node: '#ffffff'                      // Titik sudut putih kristal
};

export class SpatialObject {
  constructor(id, initialX, initialY, initialZ) {
    // Identitas & State
    this.id = id;
    this.isGrabbed = false; 
    
    // Posisi Koordinat
    this.x = initialX;
    this.y = initialY;
    this.z = initialZ;
    
    // Momentum Fisika
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    
    // Skala Luxury (Negative Space)
    this.scale = 30;
    
    // Rotasi Otomatis
    this.rotationX = Math.random() * Math.PI;
    this.rotationY = Math.random() * Math.PI;
    this.baseRotationSpeed = 0.01; 
    
    // --- 3. DYNAMIC PHYSICS TUNING (ZERO-G MOMENTUM) ---
    this.tension = 0.03;       // Kelenturan pegas medium
    this.dampeningGrab = 0.80; // Rem kuat saat ditarik (biar presisi dan nggak mantul-mantul)
    this.dampeningFree = 0.98; // Rem super loss saat dilepas (Meluncur bebas tanpa karet gelang)
  }

  updatePhysics(targetX, targetY, targetZ) {
    if (this.isGrabbed) {
      // MODE DITARIK: Karet Gelang Aktif + Snappy
      const forceX = (targetX - this.x) * this.tension;
      const forceY = (targetY - this.y) * this.tension;
      const forceZ = (targetZ - this.z) * this.tension;

      this.vx = (this.vx + forceX) * this.dampeningGrab;
      this.vy = (this.vy + forceY) * this.dampeningGrab;
      this.vz = (this.vz + forceZ) * this.dampeningGrab;
      
      // Agresif muter saat dikunci
      this.rotationX += 0.06;
      this.rotationY += 0.08;
    } else {
      // MODE DILEPAS: Momentum glinding luar angkasa
      this.vx *= this.dampeningFree;
      this.vy *= this.dampeningFree;
      this.vz *= this.dampeningFree;
      
      // Muter santai dan elegan
      this.rotationX += this.baseRotationSpeed;
      this.rotationY += this.baseRotationSpeed + 0.01;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
  }

  render(ctx, time) {
    ctx.save();
    
    // --- 4. RAHASIA SCI-FI UX (ADDITIVE BLENDING) ---
    // Bikin garis saling menjumlahkan cahaya kalau tumpang tindih
    ctx.globalCompositeOperation = 'lighter';
    
    ctx.translate(this.x, this.y);
    
    // Aljabar Linear: Matriks Rotasi & Proyeksi Perspektif
    const projectedNodes = icoNodes.map(node => {
      let x = node[0]; let y = node[1]; let z = node[2];
      
      let cos = Math.cos(this.rotationX); let sin = Math.sin(this.rotationX);
      let y1 = y * cos - z * sin; let z1 = y * sin + z * cos; y = y1; z = z1;
      
      cos = Math.cos(this.rotationY); sin = Math.sin(this.rotationY);
      let x1 = x * cos + z * sin; let z2 = -x * sin + z * cos; x = x1; z = z2;

      const fov = 350; 
      const depth = Math.max(1, fov + z);
      const projScale = (fov / depth) * this.scale;
      return { x: x * projScale, y: y * projScale, z: z };
    });

    // Gambar Garis (Edges)
    ctx.beginPath();
    for (const edge of icoEdges) {
      const p1 = projectedNodes[edge[0]]; 
      const p2 = projectedNodes[edge[1]];
      ctx.moveTo(p1.x, p1.y); 
      ctx.lineTo(p2.x, p2.y);
    }
    
    // Dinamika Glow (Lebih intensif saat ditarik)
    const baseBlur = this.isGrabbed ? 50 : 25;
    const pulseGlow = baseBlur + Math.sin(time * 4) * (this.isGrabbed ? 15 : 10);
    
    // Eksekusi Gaya Cahaya Lasernya
    ctx.shadowBlur = pulseGlow;
    ctx.shadowColor = this.isGrabbed ? COLOR_SCHEME.active_glow + ' 1)' : COLOR_SCHEME.idle_glow + ' 1)';
    ctx.strokeStyle = this.isGrabbed ? COLOR_SCHEME.active_stroke + ' 1)' : COLOR_SCHEME.idle_stroke + ' 0.9)'; 
    ctx.lineWidth = this.isGrabbed ? 4 : 2.5; 
    ctx.stroke(); 
    ctx.shadowBlur = 0;
    
    // Gambar Titik (Vertices)
    for (const p of projectedNodes) {
      ctx.beginPath(); 
      // Membesar sedikit pas ditarik biar keliatan kokoh
      ctx.arc(p.x, p.y, this.isGrabbed ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = COLOR_SCHEME.node; 
      ctx.fill();
    }
    
    ctx.restore();
  }
}