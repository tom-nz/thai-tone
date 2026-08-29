# 📋 PROJECT_STATE & GEMINI CONTEXT LOG

## 📌 ข้อมูลโปรเจกต์ (Project Info)
- **App Name:** Thai Tone App (`thai-tone-app`)
- **Current Version:** `1.1.0-modular`
- **Repository:** `https://github.com/tom-nz/thai-tone-app`
- **Live URLs:**
  - GitHub Pages: `https://tom-nz.github.io/thai-tone-app/`
  - Cloudflare Pages: `https://thai-tone-app.pages.dev/`

---

## 🏗️ โครงสร้างโมดูล (Modular Architecture Map)
1. `src/utils/toneEngine.js`
   - จัดการข้อมูลพยัญชนะ (44 ตัว), สระสั้น/ยาว
   - กฎการวิเคราะห์ไตรยางศ์ คำเป็น/คำตาย และการคำนวณเสียงวรรณยุกต์ 5 ระดับ
2. `src/components/TopBar.jsx`
   - แถบเมนูด้านบน (เลือกมุมมอง 1-2 จอ, เต็มจอ, สลับจอแยก)
3. `src/components/StaffBoard.jsx`
   - กระดานแสดงผลเส้นบรรทัด 5 เส้น
   - ลูกบอลโน้ตวรรณยุกต์ขนาดคงที่ (Fixed size: 34px, font 14px)
   - กล่องผลวิเคราะห์หลักภาษา (แสดงเมื่อมีข้อความ)
4. `src/components/ControlPanel.jsx`
   - ช่องรับข้อความ (autoFocus เริ่มต้น) และปุ่มผันคำ
   - ปุ่มผู้ช่วย AI Radio 3 โหมด (ซ่อนตอนเริ่มต้น; เลือก=ดำทึบ, ไม่เลือก=ขาวขอบดำ)
   - แป้นพิมพ์เสมือน (พยัญชนะด่วน 44 ตัว, สระเสียงยาว, สระเสียงสั้น)
5. `src/version.js`
   - จัดเก็บ Metadata และ Changelog
6. `src/App.jsx`
   - จุดศูนย์กลางจัดการ State หลัก (`inputText`, `mode`, `placedNotes`, `analysisInfo`)

---

## 🎯 กฎสำคัญของ UI/UX ที่กำหนดไว้ (Enforced Rules)
- **Empty State:** เมื่อเปิดเว็บครั้งแรก ช่องกรอกว่างเปล่า, กล่องวิเคราะห์ไม่แสดง, ปุ่ม Radio ซ่อนไว้
- **Radio Style:** เลือก = จุดสีดำทึบ (`#000000`), ไม่เลือก = วงกลมขาว ขอบดำ (`#ffffff` / border `#000000`)
- **Ball Size:** ขนาดลูกบอลโน้ตและฟอนต์ต้องคงที่เสมอ ไม่ขยายใหญ่เมื่อคลิกนอกเส้นหรือป้อนคำใหม่