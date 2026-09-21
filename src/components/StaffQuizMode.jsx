import React, { useState, useRef } from "react";

export default function StaffQuizMode({
  linesData,
  inputText,
  lang = "th",
  circleTextColor = "#ffffff",
  onExit,
  speak,
}) {
  const t = (th, en) => (lang === "en" ? en : th);

  // ดึงคำศัพท์ทั้งหมดที่กำลังแสดงอยู่บนกระดาน 5 เส้นเข้าสู่โจทย์
  const [quizQueue] = useState(() => {
    const words = [];
    linesData.filter((row) => row.show).forEach((row) => {
      if (row.isMulti) {
        row.multi.forEach((m) => {
          if (m.text) words.push({ word: m.text, targetLine: row.id, originalColor: m.color });
        });
      } else if (row.word) {
        words.push({ word: row.word, targetLine: row.id, originalColor: row.color });
      }
    });
    return words.length > 0 ? words.sort(() => Math.random() - 0.5) : [];
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [isResolved, setIsResolved] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [placedLine, setPlacedLine] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // การลากวางด้วย Pointer Events
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [shakeAnim, setShakeAnim] = useState(false);
  const startPointerRef = useRef({ x: 0, y: 0 });

  const currentQ = quizQueue[currentIdx] || null;
  const totalPossibleScore = quizQueue.length * 2;

  // ตรวจจับพิกัดการลาก
  const handlePointerDown = (e) => {
    if (isResolved || isRevealing || !currentQ) return;
    setIsDragging(true);
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setDragOffset({
      x: e.clientX - startPointerRef.current.x,
      y: e.clientY - startPointerRef.current.y,
    });
  };

  const handlePointerUp = (e) => {
    if (!isDragging || !currentQ) return;
    setIsDragging(false);

    // ตรวจสอบว่าปล่อยตกบนเส้นระดับเสียงใด (คำนวณผ่าน elementFromPoint)
    let droppedLineId = null;
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    for (const el of elements) {
      const lineAttr = el.getAttribute("data-tone-line-id");
      if (lineAttr) {
        droppedLineId = Number(lineAttr);
        break;
      }
    }

    setDragOffset({ x: 0, y: 0 });

    if (droppedLineId !== null) {
      checkAnswer(droppedLineId);
    } else {
      // ปล่อยนอกเขต
      setShakeAnim(true);
      setTimeout(() => setShakeAnim(false), 400);
    }
  };

  const checkAnswer = (droppedLineId) => {
    if (droppedLineId === currentQ.targetLine) {
      // ตอบถูกต้อง
      let earned = 0;
      if (attempts === 0) earned = 2;
      else if (attempts === 1) earned = 1;

      setScore((prev) => prev + earned);
      setPlacedLine(droppedLineId);
      setIsResolved(true);
      if (speak) speak(currentQ.word, true);
    } else {
      // ตอบผิด
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= 3) {
        // ผิดครบ 3 ครั้ง -> เฉลย
        setIsRevealing(true);
        setPlacedLine(currentQ.targetLine);
        if (speak) speak(currentQ.word, true);

        setTimeout(() => {
          setIsRevealing(false);
          setIsResolved(true);
        }, 800);
      } else {
        setShakeAnim(true);
        setTimeout(() => setShakeAnim(false), 400);
      }
    }
  };

  const handleNextQuestion = () => {
    const next = currentIdx + 1;
    if (next < quizQueue.length) {
      setCurrentIdx(next);
      setAttempts(0);
      setIsResolved(false);
      setIsRevealing(false);
      setPlacedLine(null);
    } else {
      setIsCompleted(true);
    }
  };

  if (!currentQ && !isCompleted) {
    return (
      <div className="quiz-empty-box" style={{ padding: "20px", textAlign: "center" }}>
        <p>{t("ไม่พบคำสำหรับทำแบบฝึกหัด กรุณาพิมพ์คำหรือเลือกโหมดการผันก่อน", "No words to quiz. Please input a word first.")}</p>
        <button className="danger-btn" onClick={onExit}>{t("ย้อนกลับ", "Back")}</button>
      </div>
    );
  }

  // กำหนดสี: เริ่มต้นสีส้มปริศนา (#f97316) เมื่อถูกต้องหรือเฉลย ค่อยคืนสีกลุ่มอักษรเดิม
  const currentColor = isResolved ? currentQ.originalColor : "#f97316";

  return (
    <div className="staff-quiz-container">
      {/* 1. แท่นลากวางด้านล่าง หรือกล่องข้อความคำสั่ง */}
      {!isCompleted ? (
        <div className="quiz-drag-station">
          <div className="quiz-instruction-text">
            {!isResolved ? (
              <span>
                🎯 {t(`นำคำในวงกลมตัวโน้ต ลากไปวางบนเส้นบรรทัดให้ถูกต้อง (ครั้งที่ ${attempts + 1}/3)`,
                       `Drag the note circle to the correct line (Attempt ${attempts + 1}/3)`)}
              </span>
            ) : (
              <span style={{ color: "#16a34a", fontWeight: "800" }}>
                🎉 {t("ถูกต้องสมบูรณ์! คลิกปุ่ม 'ข้อต่อไป' ด้านล่าง", "Correct! Click 'Next' to continue")}
              </span>
            )}
          </div>

          {!isResolved && (
            <div
              className={`tone-circle quiz-draggable-node ${shakeAnim ? "shake-error" : ""}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                backgroundColor: currentColor,
                color: circleTextColor,
                "--note-color": currentColor,
                transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(${isDragging ? 1.25 : 1.05})`,
                touchAction: "none",
                cursor: "grab",
                zIndex: 300,
              }}
              title={t("คลิกแล้วลากไปวางบนเส้น", "Drag to staff line")}
            >
              {currentQ.word}
            </div>
          )}
        </div>
      ) : (
        <div className="practice-summary-banner" style={{ margin: "16px 0" }}>
          <span>🎉 {t(`แบบฝึกหัดเสร็จสมบูรณ์! คะแนนรวมของคุณ: ${score} / ${totalPossibleScore} คะแนน`,
                        `Quiz finished! Total score: ${score} / ${totalPossibleScore}`)}</span>
          <button type="button" onClick={onExit} className="practice-summary-close-btn">✕</button>
        </div>
      )}

      {/* 2. แถบควบคุมสถานะและปุ่มข้อต่อไป */}
      <div className="quiz-controls-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
        <div className="quiz-score-pill" style={{ fontSize: "13px", fontWeight: 700, color: "#475569" }}>
          🏆 {t("คะแนน", "Score")}: <strong style={{ color: "#16a34a" }}>{score}</strong> / {totalPossibleScore}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {isResolved && !isCompleted && (
            <button type="button" className="green-btn quiz-next-btn" onClick={handleNextQuestion}>
              {t("ข้อต่อไป ❯", "Next ❯")}
            </button>
          )}
          <button type="button" className="danger-btn" onClick={onExit}>
            {t("❌ ยกเลิกแบบฝึกหัด", "❌ Cancel Quiz")}
          </button>
        </div>
      </div>
    </div>
  );
}