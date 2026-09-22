import React, { useState, useRef } from "react";

// คลังคำสำหรับสุ่มในแบบฝึกหัด แยกกลุ่มอักษร 3 หมู่ชัดเจน
const QUIZ_WORD_BANK = [
  // อักษรกลาง
  { word: "กา", targetLine: 1, originalColor: "#22c55e", group: "middle" },
  { word: "ด่า", targetLine: 2, originalColor: "#22c55e", group: "middle" },
  { word: "ป้า", targetLine: 3, originalColor: "#22c55e", group: "middle" },
  { word: "โต๊", targetLine: 4, originalColor: "#22c55e", group: "middle" },
  { word: "ตั๋ว", targetLine: 5, originalColor: "#22c55e", group: "middle" },
  // อักษรสูง
  { word: "ขา", targetLine: 5, originalColor: "#ef4444", group: "high" },
  { word: "ข่า", targetLine: 2, originalColor: "#ef4444", group: "high" },
  { word: "ข้า", targetLine: 3, originalColor: "#ef4444", group: "high" },
  { word: "เสื่อ", targetLine: 2, originalColor: "#ef4444", group: "high" },
  { word: "เสื้อ", targetLine: 3, originalColor: "#ef4444", group: "high" },
  // อักษรต่ำ
  { word: "คา", targetLine: 1, originalColor: "#007bff", group: "low" },
  { word: "ค่อ", targetLine: 3, originalColor: "#007bff", group: "low" },
  { word: "ค้อ", targetLine: 4, originalColor: "#007bff", group: "low" },
  { word: "แม่", targetLine: 3, originalColor: "#007bff", group: "low" },
  { word: "ม้า", targetLine: 4, originalColor: "#007bff", group: "low" },
];

function generateBalancedQuizQueue(linesData) {
  const currentWords = [];
  linesData.filter((row) => row.show).forEach((row) => {
    if (row.isMulti) {
      row.multi.forEach((m) => {
        if (m.text) currentWords.push({ word: m.text, targetLine: row.id, originalColor: m.color, leftPos: row.leftPos });
      });
    } else if (row.word) {
      currentWords.push({ word: row.word, targetLine: row.id, originalColor: row.color, leftPos: row.leftPos });
    }
  });

  const basePool = currentWords.length >= 3 ? currentWords : QUIZ_WORD_BANK;
  
  const midList = basePool.filter(w => w.originalColor === "#22c55e" || w.group === "middle").sort(() => Math.random() - 0.5);
  const highList = basePool.filter(w => w.originalColor === "#ef4444" || w.group === "high").sort(() => Math.random() - 0.5);
  const lowList = basePool.filter(w => w.originalColor === "#007bff" || w.group === "low").sort(() => Math.random() - 0.5);

  const result = [];
  const maxLen = Math.max(midList.length, highList.length, lowList.length);
  for (let i = 0; i < maxLen; i++) {
    if (midList[i]) result.push(midList[i]);
    if (highList[i]) result.push(highList[i]);
    if (lowList[i]) result.push(lowList[i]);
  }

  return result.length > 0 ? result : basePool;
}

export default function StaffQuizMode({
  linesData,
  lang = "th",
  circleTextColor = "#ffffff",
  fontSize = 20,
  isDisplay = false,
  onExit,
  speak,
  onResolveQuestion,
}) {
  const t = (th, en) => (lang === "en" ? en : th);

  const ratio = Math.max(0.8, fontSize / 20);
  const circleSize = isDisplay ? `clamp(42px, ${4.2 * ratio}vw, 70px)` : "48px";
  const circleFontSize = isDisplay ? `clamp(16px, ${1.8 * ratio}vw, 27px)` : "18px";

  const [quizQueue] = useState(() => generateBalancedQuizQueue(linesData));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [isResolved, setIsResolved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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

    // ดีดกลับจุดเริ่มต้นล่างจอเสมอเมื่อปล่อยมือ
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
      let earned = 0;
      if (attempts === 0) earned = 2;
      else if (attempts === 1) earned = 1;

      setScore((prev) => prev + earned);
      setIsResolved(true);
      if (onResolveQuestion) {
        onResolveQuestion({
          ...currentQ,
          placedLine: droppedLineId,
          isRevealed: false,
        });
      }
      if (speak) speak(currentQ.word, true);
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      if (nextAttempts >= 3) {
        setIsResolved(true);
        if (onResolveQuestion) {
          onResolveQuestion({
            ...currentQ,
            placedLine: currentQ.targetLine,
            isRevealed: true,
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
      setDragOffset({ x: 0, y: 0 });
      if (onResolveQuestion) onResolveQuestion(null);
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
                backgroundColor: "#f97316",
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