// ใน toneBoardPatch.js
const PATCH_CSS = `
  /* เพิ่มส่วนนี้เพื่อแก้ Clipping */
  .main-grid.split-layout {
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 400px); /* ให้กระดานกว้างขึ้น */
  }

  .tone-rows {
    /* เพิ่ม padding บน-ล่าง เพื่อกันวงกลมถูกตัดเวลา scale */
    padding: 30px 10px !important; 
    overflow-y: auto !important;
  }

  .tone-line-wrap {
    height: auto !important;
    /* เพิ่ม min-height ให้สัมพันธ์กับขนาดวงกลมที่ขยาย */
    min-height: 70px !important; 
    align-items: center;
    overflow: visible !important;
  }

  /* เพิ่มกรอบให้กระดานในโหมด 2 คอลัมน์เหมือนแผงควบคุม */
  .board-frame {
    background: rgba(255,255,255,.95) !important;
    border-radius: 16px !important;
    box-shadow: 0 4px 20px rgba(0,0,0,.08) !important;
    padding: 20px !important;
  }
`;