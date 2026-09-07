/* ============================================================
   toneBoardPatch.js  —  PATCH v13.1
   แก้ 2 เรื่อง โดยไม่แตะไฟล์ App.jsx เดิม:
   1) วงกลมโน้ตไม่ถูกตัดเมื่อขยายใหญ่ (ทั้ง 1 คอลัมน์ / 2 คอลัมน์)
      + ถอดเฟรมกล่องบรรทัด 5 เส้น + เลื่อนได้โดยไม่มีแถบเลื่อน
   2) Checkbox "เปิดเสียงเมื่อคลิกบรรทัด" = ขาวตอน unchecked,
      ติ๊กถูกสีดำตอน checked
   ============================================================ */

const PATCH_ID = "thai-tone-patch-v13-1";

const PATCH_CSS = `
  /* ---------- 1) ถอดเฟรมกล่องบรรทัด 5 เส้น + ห้าม clip ---------- */
  .board-frame,
  .board-panel {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
    padding: 0 !important;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* ---------- 2) 2 คอลัมน์: ให้กระดานกว้างกว่าแผงควบคุม ---------- */
  .main-grid.split-layout {
    grid-template-columns: minmax(0, 1fr) clamp(320px, 28vw, 400px);
    grid-template-rows: minmax(0, 1fr);
    align-items: stretch;
  }

  /* ---------- 3) หัวใจของบั๊ก: ความสูงแถวโตตามวงกลม ---------- */
  .tone-board { --circle-size: 48px; }

  .tone-line-wrap {
    height: auto !important;
    min-height: max(34px, calc(var(--circle-size) * 1.34));
    overflow: visible;
  }

  /* ---------- 4) เลื่อนได้ ไม่โชว์ scrollbar + กันชนบน-ล่าง ---------- */
  .tone-rows {
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-top: calc(var(--circle-size) * 0.48);
    padding-bottom: calc(var(--circle-size) * 0.42);
    padding-right: 2px;
  }
  .tone-rows::-webkit-scrollbar { width: 0; height: 0; display: none; }

  /* ---------- 5) โหมด Display / จอที่ 2 ---------- */
  .display-board { overflow: visible; }
  .display-board .tone-rows {
    overflow-y: auto !important;
    overflow-x: hidden;
    justify-content: flex-start;
    gap: clamp(10px, 2.2vh, 26px);
    margin-top: 1vh;
    padding-top: calc(var(--circle-size) * 0.55);
    padding-bottom: calc(var(--circle-size) * 0.5);
  }

  /* ---------- 6) ห้าม ancestor ตัดวงกลม/ก้านโน้ต ---------- */
  .tone-row,
  .multi-circles,
  .tone-circle { overflow: visible; }

  /* ---------- 7) Checkbox: ขาว / ติ๊กถูกดำ ---------- */
  .toggle-label input[type="checkbox"],
  .tone-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    margin: 0;
    flex-shrink: 0;
    border: 2px solid #475569;
    border-radius: 4px;
    background-color: #ffffff;
    cursor: pointer;
    display: inline-grid;
    place-content: center;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .toggle-label input[type="checkbox"]::after,
  .tone-checkbox::after {
    content: "";
    width: 5px;
    height: 10px;
    margin-top: -2px;
    border: solid #000000;
    border-width: 0 2.5px 2.5px 0;
    transform: rotate(45deg);
    opacity: 0;
    transition: opacity .12s ease;
  }
  .toggle-label input[type="checkbox"]:checked,
  .tone-checkbox:checked {
    background-color: #ffffff;
    border-color: #000000;
  }
  .toggle-label input[type="checkbox"]:checked::after,
  .tone-checkbox:checked::after { opacity: 1; }
  .toggle-label input[type="checkbox"]:focus-visible,
  .tone-checkbox:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, .35);
  }

  /* ---------- 8) จอเล็ก ---------- */
  @media (max-width: 640px) {
    .main-grid.split-layout {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(0, 1.25fr) minmax(0, 1fr);
    }
    .tone-rows {
      flex: 1 1 auto;
      padding-top: calc(var(--circle-size) * 0.62);
      padding-bottom: calc(var(--circle-size) * 0.55);
    }
  }
`;

/* ---------- inject CSS (ท้าย <head> เพื่อให้ชนะ cascade) ---------- */
function injectCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById(PATCH_ID)) return;
  const tag = document.createElement("style");
  tag.id = PATCH_ID;
  tag.textContent = PATCH_CSS;
  document.head.appendChild(tag);
}

/* ---------- sync --circle-size จากขนาดวงกลมจริงที่ React render ---------- */
function syncCircleVar() {
  if (typeof document === "undefined") return;
  document.querySelectorAll(".tone-board").forEach((board) => {
    const circle = board.querySelector(".tone-circle");
    if (!circle) return;
    const w = circle.getBoundingClientRect().width;
    if (!w) return;
    const next = `${Math.round(w)}px`;
    if (board.style.getPropertyValue("--circle-size") !== next) {
      board.style.setProperty("--circle-size", next);
    }
  });
}

let rafId = null;
function scheduleSync() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    syncCircleVar();
  });
}

export function installToneBoardPatch() {
  if (typeof window === "undefined") return;
  if (window.__thaiTonePatchInstalled) return;
  window.__thaiTonePatchInstalled = true;

  injectCss();

  const start = () => {
    scheduleSync();

    // วงกลมเปลี่ยนขนาด (สไลเดอร์ px) → อัปเดต var
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(scheduleSync);
      const attach = () => {
        document
          .querySelectorAll(".tone-board .tone-circle")
          .forEach((el) => ro.observe(el));
      };
      attach();
      new MutationObserver(() => {
        attach();
        scheduleSync();
      }).observe(document.body, { childList: true, subtree: true });
    } else {
      new MutationObserver(scheduleSync).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }

    window.addEventListener("resize", scheduleSync);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}

// auto-install เมื่อถูก import
installToneBoardPatch();