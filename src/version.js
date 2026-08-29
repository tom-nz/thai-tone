/**
 * version.js
 * จัดการเวอร์ชันและประวัติการเปลี่ยนแปลง (Changelog) สำหรับระบบและ Gemini
 */

export const APP_METADATA = {
  appName: "thai-tone-app",
  version: "1.1.0-modular",
  lastUpdated: "2026-08-30",
  architecture: "React + Vite (Modular Architecture)",
  author: "tom-nz"
};

export const CHANGELOG = [
  {
    version: "1.1.0-modular",
    date: "2026-08-30",
    changes: [
      "แยกโค้ดเป็น 4 โมดูลย่อย (toneEngine, TopBar, StaffBoard, ControlPanel)",
      "แก้ไขขนาดลูกบอลโน้ตและตัวหนังสือให้คงที่ 34px ไม่ขยายใหญ่",
      "ระบบ Progressive UI ซ่อนกล่องวิเคราะห์และปุ่ม Radio เมื่อไม่มีการกรอกข้อความ",
      "ปรับสไตล์ Radio: เลือก = วงกลมสีดำทึบ, ไม่เลือก = วงกลมสีขาวขอบดำ",
      "ตั้งค่า autoFocus ในช่องพิมพ์ข้อความตอนเริ่มต้น",
      "กำหนด base path เป็น ./ เพื่อรองรับทั้ง GitHub Pages และ Cloudflare Pages"
    ]
  },
  {
    version: "1.0.0-baseline",
    date: "2026-08-20",
    changes: [
      "เวอร์ชันเสถียรตั้งต้น (Baseline Single-file Component)"
    ]
  }
];