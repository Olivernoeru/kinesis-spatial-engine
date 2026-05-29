// File: src/engine/KinesisStore.js

// Ini adalah Mutable Global Object. 
// Mengubah nilai di sini TIDAK AKAN memicu React re-render. Sangat ringan!
export const kinesisStore = {
    state: 'IDLE', // Bisa berisi: 'IDLE', 'PAN', 'ROTATE', 'ZOOM'
    
    // Titik pusat (jangkar) saat gesture pertama kali dimulai
    anchorX: 0,
    anchorY: 0,
    
    // Pergerakan saat ini (delta) dari titik anchor
    deltaX: 0,
    deltaY: 0,
    
    // Jarak untuk Zoom
    pinchDistance: 0,
    
    // Fungsi bantuan buat ngereset saat tangan dilepas
    reset: function() {
        this.state = 'IDLE';
        this.anchorX = 0;
        this.anchorY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
    }
};