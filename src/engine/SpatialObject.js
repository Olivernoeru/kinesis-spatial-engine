// File: src/engine/SpatialObject.js

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

// PALET CYBER-MONACO BLUE
const COLOR_SCHEME = {
  idle_stroke: 'rgba(0, 150, 255,', 
  idle_glow: 'rgba(0, 100, 255,',   
  active_stroke: 'rgba(255, 255, 255,', 
  active_glow: 'rgba(0, 255, 255,', 
  node: '#ffffff'
};

export class SpatialObject {
  constructor(id, initialX, initialY, initialZ) {
    this.id = id; this.isGrabbed = false; 
    this.x = initialX; this.y = initialY; this.z = initialZ;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.scale = 30;
    this.rotationX = Math.random() * Math.PI; this.rotationY = Math.random() * Math.PI;
    this.baseRotationSpeed = 0.01; 
    
    // --- FIX 2: NERF FISIKA ---
    // Tension diturunin biar gerakannya smooth (enggak teleport)
    this.tension = 0.015;      
    this.dampeningGrab = 0.85; // Bikin agak licin dikit pas ditarik
    this.dampeningFree = 0.98; 
  }

  updatePhysics(targetX, targetY, targetZ) {
    if (this.isGrabbed) {
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      
      const distance = Math.sqrt(dx * dx + dy * dy);
      let currentTension = this.tension;
      
      // Mjolnir Recall kita bikin x2.5 aja biar terbangnya elegan, bukan ngilang.
      if (distance > 300) { 
        currentTension = this.tension * 2.5; 
      } else if (distance > 150) {
        currentTension = this.tension * 1.5; 
      }

      const forceX = dx * currentTension;
      const forceY = dy * currentTension;
      const forceZ = (targetZ - this.z) * currentTension;

      this.vx = (this.vx + forceX) * this.dampeningGrab;
      this.vy = (this.vy + forceY) * this.dampeningGrab;
      this.vz = (this.vz + forceZ) * this.dampeningGrab;
      
      this.rotationX += 0.06; this.rotationY += 0.08;
    } else {
      this.vx *= this.dampeningFree; this.vy *= this.dampeningFree; this.vz *= this.dampeningFree;
      this.rotationX += this.baseRotationSpeed; this.rotationY += this.baseRotationSpeed + 0.01;
    }
    this.x += this.vx; this.y += this.vy; this.z += this.vz;
  }

  render(ctx, time) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; 
    ctx.translate(this.x, this.y);
    
    const projectedNodes = icoNodes.map(node => {
      let x = node[0]; let y = node[1]; let z = node[2];
      let cos = Math.cos(this.rotationX); let sin = Math.sin(this.rotationX);
      let y1 = y * cos - z * sin; let z1 = y * sin + z * cos; y = y1; z = z1;
      cos = Math.cos(this.rotationY); sin = Math.sin(this.rotationY);
      let x1 = x * cos + z * sin; let z2 = -x * sin + z * cos; x = x1; z = z2;
      const fov = 350; const depth = Math.max(1, fov + z);
      const projScale = (fov / depth) * this.scale;
      return { x: x * projScale, y: y * projScale, z: z };
    });

    ctx.beginPath();
    for (const edge of icoEdges) {
      const p1 = projectedNodes[edge[0]]; const p2 = projectedNodes[edge[1]];
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    }
    
    const baseBlur = this.isGrabbed ? 30 : 15;
    const pulseGlow = baseBlur + Math.sin(time * 5) * (this.isGrabbed ? 10 : 5);
    ctx.shadowBlur = pulseGlow;
    ctx.shadowColor = this.isGrabbed ? COLOR_SCHEME.active_glow + ' 1)' : COLOR_SCHEME.idle_glow + ' 1)';
    ctx.strokeStyle = this.isGrabbed ? COLOR_SCHEME.active_stroke + ' 1)' : COLOR_SCHEME.idle_stroke + ' 1)'; 
    ctx.lineWidth = this.isGrabbed ? 4 : 2; 
    ctx.stroke(); 

    for (const p of projectedNodes) {
      ctx.beginPath(); 
      ctx.arc(p.x, p.y, this.isGrabbed ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; 
      ctx.fill();
    }
    ctx.restore();
  }
}