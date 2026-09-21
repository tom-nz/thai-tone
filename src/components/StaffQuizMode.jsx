import React, { useState, useRef, useEffect } from "react";

export default function StaffQuizMode({
  linesData,
  lang = "th",
  circleTextColor = "#ffffff",
  fontSize = 20,
  isDisplay = false,
  onExit,
  speak,
  onResolveQuestion, // ส่งข้อมูลระดับเส้นที่ถูกต้องขึ้นไปแสดงบนบรรทัด
}) {
  const t = (th, en) => (lang === "en" ? en : th);

  // คำนวณขนาดให้ตรงกับตัวโน้ตบนเส้นบรรทัดหลักทุกประการ
  const ratio = Math.max(0.8, fontSize / 20);
  const circleSize = isDisplay ? `clamp(42px, ${4.2 * ratio}vw, 70px)` : "48px";
  const circleFontSize = isDisplay ? `clamp(16px, ${1.8 * ratio}vw, 27px)` : "18px";

  // ดึงคำศัพท์ทั้งหมดที่กำลังแสดงอยู่บนกระดาน 5 เส้นเข้าสู่โจทย์
  const [quizQueue] = useState(() => {
    const words = [];
    linesData.filter((row) => row.show).forEach((row) => {
      if (row.isMulti) {
        row.multi.forEach((m) => {
          if (m.text) words.push({ word: m.text, targetLine: row.id, originalColor: m.color, leftPos: row.leftPos });
        });
      } else if (row.word) {
        words.push({ word: row.word, targetLine: row.id, originalColor: row.color, leftPos: row.leftPos });
      }
    });
    return words.length > 0 ? words.sort(() => Math.random() - 0.5) : [];
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [isResolved, setIsResolved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // การลากวางด้วย Pointer Events
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [shakeAnim, setShakeAnim] = useState(false);
  const startPointerRef = useRef({ x: 0, y: 0 });

  const currentQ = quizQueue[currentIdx] || null;
  const totalPossibleScore = quizQueue.length * 2;

  const handlePointerDown = (e) => {
    if (isResolved || !currentQ) return;
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
      setShakeAnim(true);
      setTimeout(() => setShakeAnim(false), 400);
    }
  };

  const checkAnswer = (droppedLineId) => {
    if (droppedLineId === currentQ.targetLine) {
      // วางถูกต้อง
      let earned = 0;
      if (attempts === 0) earned = 2;
      else if (attempts === 1) earned = 1;

      setScore((prev) => prev + earned);
      setIsResolved(true);
      if (onResolveQuestion) {
        onResolveQuestion({
          ...currentQ,
          placedLine: droppedLineId,
          isRevealed: false
        });
      }
      if (speak) speak(currentQ.word, true);
    } else {
      // วางผิด
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= 3) {
        // ผิดครบ 3 ครั้ง -> เฉลย
        setIsResolved(true);
        if (onResolveQuestion) {
          onResolveQuestion({
            ...currentQ,
            placedLine: currentQ.targetLine,
            isRevealed: true
          });
        }
        if (speak) speak(currentQ.word, true);
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
      if (onResolveQuestion) onResolveQuestion(null); // ล้างตัวโน้ตบนเส้นเพื่อรอข้อถัดไป
    } else {
      setIsCompleted(true);
      if (onResolveQuestion) onResolveQuestion(null);
    }
  };

  if (!currentQ && !isCompleted) return null;

  return (
    <div className="staff-quiz-wrapper" style={{ marginTop: "14px" }}>
      {!isCompleted ? (
        <div className="quiz-drag-station">
          <div className="quiz-instruction-text">
            {!isResolved ? (
              <span>
                🎯 {t(`นำคำในวงกลมตัวโน้ต ลากไปวางบนเส้นบรรทัดให้ถูกต้อง (ครั้งที่ ${attempts + 1}/3)`,
                       `Drag the note circle to the correct staff line (Attempt ${attempts + 1}/3)`)}
              </span>
            ) : (
              <span style={{ color: "#16a34a", fontWeight: "800" }}>
                🎉 {t("ถูกต้องสมบูรณ์! คลิกปุ่ม 'ข้อต่อไป ❯' ด้านล่าง", "Correct! Click 'Next ❯' below")}
              </span>
            )}
          </div>

          {/* วงกลมคำถาม: ขนาดเท่าตัวโน้ตปกติ (circleSize) และสีส้มปริศนาเสมอ */}
          {!isResolved && (
            <div
              className={`tone-circle quiz-draggable-node ${shakeAnim ? "shake-error" : ""}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                width: circleSize,
                minWidth: circleSize,
                maxWidth: circleSize,
                height: circleSize,
                fontSize: circleFontSize,
                lineHeight: 1,
                backgroundColor: "#f97316", // สีส้มปริศนาตอนเริ่ม
                color: circleTextColor,
                "--note-color": "#f97316",
                transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(${isDragging ? 1.25 : 1.05})`,
                touchAction: "none",
                cursor: "grab",
                zIndex: 300,
              }}
              title={t("คลิกแล้วลากไปวางบนเส้นบรรทัด", "Drag to staff line")}
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

      {/* แถบแสดงคะแนนและปุ่มข้อต่อไป (ตัดปุ่มยกเลิกที่ซ้ำซ้อนออก) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#475569" }}>
          🏆 {t("คะแนน", "Score")}: <strong style={{ color: "#16a34a" }}>{score}</strong> / {totalPossibleScore}
        </div>

        {isResolved && !isCompleted && (
          <button type="button" className="green-btn quiz-next-btn" onClick={handleNextQuestion}>
            {t("ข้อต่อไป ❯", "Next ❯")}
          </button>
        )}
      </div>
    </div>
  );
}