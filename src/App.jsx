import React, { useState } from "react";

/* =========================================================================
   MODULE: ข้อมูลและกฎการผัน (เก็บที่นี่เพื่อให้ AI แก้ไขง่าย)
========================================================================= */
const TONE_LEVELS = [
  { id: 'rising', label: 'เสียงจัตวา [ ๋ ]', color: '#ff4d4f' },
  { id: 'high', label: 'เสียงตรี [ ๊ ]', color: '#1890ff' },
  { id: 'mid', label: 'เสียงโท [ ่ ]', color: '#1890ff' }, // ตัวอย่างตำแหน่ง
  { id: 'low', label: 'เสียงเอก [ ่ ]', color: '#ff4d4f' },
  { id: 'neutral', label: 'เสียงสามัญ [ - ]', color: '#1890ff' }
];

/* =========================================================================
   MODULE: COMPONENT BOARD (ส่วนแสดงผลหน้าจอหลัก)
========================================================================= */
const Board = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h2 style={{ textAlign: 'center' }}>ไตรยางศ์ หรือ อักษร 3 หมู่ และการผันวรรณยุกต์</h2>
    
    {/* ส่วนวิเคราะห์ */}
    <div style={{ background: '#e6f7ff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
      วิเคราะห์หลักภาษา: "วอง" เป็น คำเป็น (สระเสียงยาว) — ผันคู่ อักษรสูง/ห นำ [เอก, โท, จัตวา] + อักษรต่ำ [สามัญ, โท, ตรี] รวมผันได้ครบทั้ง 5 เสียง
    </div>

    {/* ส่วนบรรทัด 5 เส้นและจุดวงกลม */}
    <div style={{ position: 'relative', height: '300px', borderLeft: '2px solid #ccc', paddingLeft: '20px' }}>
      {TONE_LEVELS.map((level, index) => (
        <div key={level.id} style={{ display: 'flex', alignItems: 'center', height: '60px', borderBottom: '1px solid #eee' }}>
          <span style={{ width: '150px', fontWeight: 'bold' }}>{level.label}</span>
          {/* นี่คือตำแหน่งจุดวงกลมจำลอง ให้คุณเติม logic การวางตำแหน่งในนี้ได้เลย */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: level.color, marginLeft: '100px' }} />
        </div>
      ))}
    </div>
  </div>
);

/* =========================================================================
   MODULE: APP หลัก
========================================================================= */
export default function App() {
  const [viewLayout, setViewLayout] = useState("standard");

  return (
    <div className="app-container">
      {/* แถบเมนู */}
      <nav style={{ padding: '10px', background: '#f0f0f0', display: 'flex', gap: '10px' }}>
        <button onClick={() => setViewLayout("standard")}>ชิดเดียว</button>
        <button onClick={() => setViewLayout("split")}>แบ่ง 2 จอ</button>
        <button style={{ background: 'green', color: 'white' }}>แยกจอมอนิเตอร์ 2</button>
      </nav>

      {/* พื้นที่แสดงผล */}
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}><Board /></div>
        {viewLayout === "split" && (
          <div style={{ flex: 1, borderLeft: '1px solid #ccc', padding: '20px' }}>
            <h3>แผงควบคุม</h3>
            <p>ใส่ Input / คำสั่งผันวรรณยุกต์ที่นี่...</p>
          </div>
        )}
      </div>
    </div>
  );
}