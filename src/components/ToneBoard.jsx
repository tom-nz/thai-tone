import React, { useState, useEffect } from "react";
import StaffQuizMode from "./StaffQuizMode";

export default function ToneBoard({
  channelName,
  linesData,
  analysisInfo,
  inputText,
  activeRowId,
  onRowClick,
  circleTextColor,
  mode,
  isDisplay = false,
  fontSize = 20,
  staffBgColor = "#ffffff",
  lang = "th",
  onPlayAllTones,
  isPlayingAll = false,
  isPracticing = false,
  practiceTargetWord = null,
  mismatchWord = null,
  onTogglePractice,
  onSkip,
  practiceTimer = 10,
  practiceScore = 0,
  practiceMsg = "",
  practiceCompleted = false,
  totalPossibleScore = 0,
  isQuizMode = false,
  onToggleQuiz,
  speak,
}) {
  const t = (th, en) => (lang === "en" ? en : th);
  const [resolvedQuizItem, setResolvedQuizItem] = useState(null);

  useEffect(() => {
    if (!isQuizMode) setResolvedQuizItem(null);
  }, [isQuizMode]);

  const fixedRightLabels = {
    5: { text: t("เสียงสูง", "High Pitch"), color: "#ef4444" },
    3: { text: t("เสียงกลาง", "Mid Pitch"), color: "#22c55e" },
    1: { text: t("เสียงต่ำ", "Low Pitch"), color: "#007bff" },
  };

  const toneNames = {
    5: { th: "เสียงจัตวา", en: "Rising (Chattawa)" },
    4: { th: "เสียงตรี", en: "High (Tri)" },
    3: { th: "เสียงโท", en: "Falling (Tho)" },
    2: { th: "เสียงเอก", en: "Low (Ek)" },
    1: { th: "เสียงสามัญ", en: "Mid (Saman)" },
  };

  const ratio = Math.max(0.8, fontSize / 20);
  const circleSize = isDisplay ? `clamp(42px, ${4.2 * ratio}vw, 70px)` : "48px";
  const textSize = isDisplay ? `clamp(15px, ${1.5 * ratio}vw, 25px)` : "17px";
  const circleFontSize = isDisplay ? `clamp(16px, ${1.8 * ratio}vw, 27px)` : "18px";

  const getCircleStyle = (color) => ({
    backgroundColor: color,
    color: circleTextColor,
    "--note-color": color,
    width: circleSize,
    minWidth: circleSize,
    maxWidth: circleSize,
    height: circleSize,
    padding: 0,
    fontSize: circleFontSize,
    lineHeight: 1,
    flex: `0 0 ${circleSize}`,
  });

  const getSpeechText = (item) => {
    if (!item?.show) return "";
    if (item.isMulti) return item.multi[0]?.ttsText || item.multi[0]?.text || "";
    return item.ttsText || item.word || "";
  };

  return (
    <div
      className={`tone-board ${isDisplay ? "display-board" : ""}`}
      style={{
        ...(isDisplay ? { backgroundColor: staffBgColor } : {}),
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: "100%",
        height: "auto",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div className="board-title" style={{ color: "#4A148C", flexShrink: 0, marginBottom: "12px" }}>
        <h2 style={{ color: "#4A148C", margin: "0 0 4px 0" }}>
          {t("ไตรยางศ์ หรือ อักษร 3 หมู่", "Three Consonant Classes (Triyang)")}
        </h2>
        <div style={{ color: "#4A148C" }}>
          {t("และการผันวรรณยุกต์", "Tone Rules & Musical Staves")}
        </div>
      </div>

      {/* กล่องวิเคราะห์หลักภาษา: ไม่แสดงเมื่อไม่มีคำ และในโหมด Quiz แสดงเฉพาะเมื่อตอบถูก/เฉลยแล้ว */}
      {(!isQuizMode || (isQuizMode && resolvedQuizItem)) && Boolean(inputText.trim() || resolvedQuizItem) && (() => {
        const visibleItems = linesData.filter((item) => item.show);
        const topItem = visibleItems[0];
        const bottomItem = visibleItems[visibleItems.length - 1];
        const isMid = ["ก", "จ", "ด", "ต", "บ", "ป", "อ", "ฎ", "ฏ"].includes(analysisInfo?.primaryConsonant);

        const analyses = [];

        if (mode === "pair") {
          const topWord = getSpeechText(topItem);
          const bottomWord = getSpeechText(bottomItem);
          const pConsonant = analysisInfo?.primaryConsonant || "";
          const isSingle = ["ง", "ญ", "ณ", "น", "ม", "ย", "ร", "ล", "ฬ", "ว"].includes(pConsonant);

          let pairTitle;
          let pairDesc;

          if (isMid) {
            pairTitle = t("อักษรกลาง (Soloist / ศิลปินเดี่ยว)", "Mid Class (Soloist)");
            pairDesc = t(
              `มีเอกลักษณ์เฉพาะตัว สามารถผันได้ครบทั้ง 5 เสียงด้วยตัวเองโดยไม่ต้องจับคู่กับพยัญชนะอื่น (พื้นเสียงสามัญ "${bottomWord}" ➔ เสียงจัตวา "${topWord}")`,
              `Self-sufficient — inflects all 5 tones on its own without needing a partner (Base mid tone "${bottomWord}" ➔ Rising tone "${topWord}")`
            );
          } else if (isSingle) {
            pairTitle = t("อักษรต่ำเดี่ยว (Solo with Leading ห- / ยืม ห-นำ)", "Single Low Class (With Leading ห-)");
            pairDesc = t(
              `"${bottomWord}" (อักษรต่ำเดี่ยว) ไม่มีคู่เสียงสูงในตัวเอง จึงผันเสียงจัตวาโดย "ยืม ห-นำ" มาเป็น "${topWord}" เพื่อให้ผันครบ 5 เสียง (เสียงจัตวา "${topWord}" ➔ เสียงสามัญ "${bottomWord}")`,
              `"${bottomWord}" has no natural high partner, so it borrows "Leading ห-" ("${topWord}") to produce the rising tone and achieve all 5 tones (Rising "${topWord}" ➔ Mid "${bottomWord}")`
            );
          } else {
            pairTitle = t("คู่เสียงสูง-ต่ำคู่ (Duo / คู่หู)", "High & Paired Low Duo");
            pairDesc = t(
              `"${topWord}" (อักษรสูง) จับคู่กับ "${bottomWord}" (อักษรต่ำคู่) ช่วยกันผันให้ครบ 5 เสียง โดยทั้งคู่มีเสียงโทตรงกัน (เสียงจัตวา "${topWord}" ➔ เสียงสามัญ "${bottomWord}")`,
              `"${topWord}" (High Class) pairs with "${bottomWord}" (Paired Low Class) to complement all 5 tones together, sharing the falling tone (Rising "${topWord}" ➔ Mid "${bottomWord}")`
            );
          }

          if (!topWord && !bottomWord) return null;

          return (
            <div className="analysis-box" style={{ flexShrink: 0, marginBottom: "16px" }}>
              <div className="analysis-item">
                📌 <strong>{pairTitle}</strong>: {pairDesc}
              </div>
            </div>
          );
        }

        if (isMid) {
          const word = isQuizMode && resolvedQuizItem ? resolvedQuizItem.word : inputText.trim();
          if (word) {
            analyses.push({
              label: "อักษรกลาง",
              word,
              info: analysisInfo,
            });
          }
        } else if (mode === "full5") {
          const topWord = getSpeechText(topItem);
          const bottomWord = getSpeechText(bottomItem);

          if (topWord) {
            analyses.push({
              label: "เสียงสูง",
              word: topWord,
              info: analysisInfo,
            });
          }

          if (bottomWord && bottomItem?.id !== topItem?.id) {
            analyses.push({
              label: "เสียงต่ำ",
              word: bottomWord,
              info: analysisInfo,
            });
          }
        } else if (mode === "highOnly") {
          const word = getSpeechText(topItem);
          if (word) {
            analyses.push({
              label: "เสียงสูง",
              word: word,
              info: analysisInfo,
            });
          }
        } else if (mode === "lowOnly") {
          const word = getSpeechText(bottomItem);
          if (word) {
            analyses.push({
              label: "เสียงต่ำ",
              word: word,
              info: analysisInfo,
            });
          }
        }

        if (!analyses.length) return null;

        return (
          <div className="analysis-box" style={{ flexShrink: 0, marginBottom: "16px" }}>
            {analyses.map(({ label, word, info }, index) => (
              <div className="analysis-item" key={`${label}-${word}-${index}`}>
                📌 {t("ผลวิเคราะห์หลักภาษา", "Linguistic Analysis")} ({t(label, label)}): <strong>"{word}"</strong> {t("เป็น", "is")}{" "}
                <span className="analysis-tag">
                  {t(info?.type || "", info?.type || "")} ({t(info?.vowelLen || "", info?.vowelLen || "")})
                </span>{" "}
                — {info?.desc || ""}
              </div>
            ))}
          </div>
        );
      })()}

      {/* เฟรมบรรทัด 5 เส้น: ปรับขยายความสูงได้เต็มที่ตามจอ ไม่แสดง Scrollbar */}
      <div
        className="tone-rows"
        style={{
          flex: "1 0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "18px",
          padding: "12px 0 16px 0",
          minHeight: "380px",
        }}
      >
        {linesData.map((item) => {
          const isActive = !isPracticing && !isQuizMode && activeRowId === item.id;
          const fixedRight = fixedRightLabels[item.id];

          // คำนวณสีข้อความหน้าเส้นบรรทัด:
          // 1. เริ่มต้นไม่มีคำ หรือในโหมด Quiz -> แสดงสีดำ/เทามาตรฐาน (#1e293b)
          // 2. เมื่อผันคำ -> แสดงสีประจำหมู่อักษร
          // 3. พิเศษ: เส้นที่ 3 (เสียงโท) ของชุดคู่เสียงที่มี 2 คำ -> ใช้สีของอักษรต่ำ (สีน้ำเงิน) เสมอ
          let labelColor = "#1e293b";
          if (!isQuizMode && Boolean(inputText.trim())) {
            if (item.id === 3 && item.isMulti) {
              labelColor = item.multi[0]?.color || "#007bff";
            } else if (item.show) {
              labelColor = item.isMulti ? item.multi[0]?.color : item.color;
            }
          }

          const lineThemeColor = isQuizMode
            ? "#94a3b8"
            : item.show
              ? item.isMulti
                ? item.multi[0]?.color
                : item.color
              : "#94a3b8";

          const isQuizResolvedHere = isQuizMode && resolvedQuizItem && resolvedQuizItem.placedLine === item.id;

          return (
            <button
              type="button"
              data-tone-line-id={item.id}
              className={`tone-row ${isActive ? "active" : ""} ${isPracticing ? "practice-locked" : ""}`}
              key={item.id}
              onClick={() => {
                if (!isPracticing && !isQuizMode) onRowClick(item);
              }}
              style={{
                cursor: isPracticing || isQuizMode ? "default" : "pointer",
                padding: "8px 0",
                display: "grid",
                gridTemplateColumns: "180px 1fr 32px 85px",
                alignItems: "center",
                width: "100%",
                background: "transparent",
                border: "none",
              }}
              title={!isPracticing && !isQuizMode ? `${t("คลิกเพื่อขยายและอ่านคำ", "Click to zoom and speak")} ${getSpeechText(item)}` : ""}
            >
              {/* ข้อความชื่อเสียง: สีตามหมู่อักษร และคลิกย่อขยายได้แม้ไม่มีคำ */}
              <div
                className="tone-name clickable-tone-text"
                style={{
                  color: labelColor,
                  fontSize: textSize,
                  transform: isActive ? "scale(1.08)" : "none",
                  transition: "transform .18s ease, color .18s ease",
                  fontWeight: 700,
                  textAlign: "right",
                  paddingRight: "16px",
                  whiteSpace: "nowrap",
                }}
              >
                {t(item.tone, toneNames[item.id]?.en || item.tone)}{" "}
                <span style={{ color: labelColor, opacity: 0.85 }}>[ {item.mark} ]</span>
              </div>

              <div className="tone-line-wrap" style={{ position: "relative", height: "34px", display: "flex", alignItems: "center" }}>
                <div
                  className="tone-line"
                  style={{
                    width: "100%",
                    backgroundColor: isQuizMode ? "#cbd5e1" : isActive ? "#475569" : "#94a3b8",
                    height: isActive ? "4px" : "2px",
                    transition: "height .18s ease, background-color .18s ease",
                  }}
                />

                {/* โหมดปกติ: แสดงตัวโน้ตคำบนเส้นเมื่อมีคำ */}
                {!isQuizMode && item.show && !item.isMulti && item.word && (
                  <div
                    className={`tone-circle ${practiceTargetWord === item.word ? "target-test-active" : ""} ${mismatchWord === item.word ? "target-test-mismatch" : ""}`}
                    style={{
                      ...getCircleStyle(item.color),
                      left: item.leftPos,
                    }}
                  >
                    {item.word}
                  </div>
                )}

                {!isQuizMode && item.show && item.isMulti && (
                  <div className="multi-circles" style={{ left: item.leftPos, position: "absolute", display: "flex", alignItems: "center", gap: "6px" }}>
                    {item.multi.map((circle, index) => (
                      <React.Fragment key={`${circle.text}-${index}`}>
                        {index > 0 && <span className="slash" style={{ fontWeight: "bold", color: "#64748b" }}>/</span>}
                        <div
                          className={`tone-circle ${practiceTargetWord === circle.text ? "target-test-active" : ""} ${mismatchWord === circle.text ? "target-test-mismatch" : ""}`}
                          style={{
                            ...getCircleStyle(circle.color),
                            position: "relative",
                            left: "auto",
                            transform: "none",
                          }}
                        >
                          {circle.text}
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* โหมดแบบฝึกหัด: แสดงเฉพาะตัวโน้ตที่ตอบถูกหรือเฉลยแล้ว */}
                {isQuizMode && isQuizResolvedHere && (
                  <div
                    className={`tone-circle ${resolvedQuizItem.isRevealed ? "quiz-revealing-node" : "quiz-snap-node"}`}
                    style={{
                      ...getCircleStyle(resolvedQuizItem.originalColor),
                      left: resolvedQuizItem.leftPos || item.leftPos,
                    }}
                  >
                    {resolvedQuizItem.word}
                  </div>
                )}
              </div>

              <div className="tone-line-number" style={{ color: lineThemeColor, fontWeight: 800, textAlign: "center" }}>
                {item.id}
              </div>

              <div className="fixed-tone-label" style={{ color: fixedRight?.color || "#94a3b8", fontWeight: 700, textAlign: "center" }}>
                {fixedRight?.text || ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* แบบฝึกหัดวางคำบนเส้นบรรทัด 5 เส้น */}
      {isQuizMode && (
        <div style={{ flexShrink: 0, marginTop: "10px" }}>
          <StaffQuizMode
            linesData={linesData}
            lang={lang}
            circleTextColor={circleTextColor}
            fontSize={fontSize}
            isDisplay={isDisplay}
            speak={speak}
            onResolveQuestion={(item) => setResolvedQuizItem(item)}
            onExit={() => onToggleQuiz(false)}
          />
        </div>
      )}

      {/* แถบปุ่มควบคุมด้านล่างกระดาน */}
      <div className="board-footer-actions" style={{ flexShrink: 0, marginTop: "14px", paddingBottom: "6px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* ปุ่มผันเสียง 1-5 */}
          <button
            type="button"
            className={`auto-play-tones-btn ${isPlayingAll ? "playing" : ""}`}
            onClick={onPlayAllTones}
            disabled={isPracticing || isQuizMode || !linesData.some((item) => item.show && (item.word || (item.isMulti && item.multi.length > 0)))}
            style={isPracticing || isQuizMode ? { opacity: 0.45, cursor: "not-allowed" } : {}}
            title={
              mode === "pair"
                ? t("ออกเสียงผันวรรณยุกต์คู่เสียงสูง-ต่ำ (5 ➔ 1)", "Auto-play paired tones (5 ➔ 1)")
                : mode === "highOnly"
                  ? t("ออกเสียงผันวรรณยุกต์เฉพาะเสียงสูง (5 ➔ 2 ➔ 3)", "Auto-play high tones (5 ➔ 2 ➔ 3)")
                  : mode === "lowOnly"
                    ? t("ออกเสียงผันวรรณยุกต์เฉพาะเสียงต่ำ (1 ➔ 3 ➔ 4)", "Auto-play low tones (1 ➔ 3 ➔ 4)")
                    : t("ออกเสียงผันวรรณยุกต์อัตโนมัติ 5 เสียง (1 ➔ 5)", "Auto-play 5 tones ascending (1 ➔ 5)")
            }
          >
            <span className="auto-play-label">
              {isPlayingAll ? t("กำลังออกเสียง...", "Playing...") : t("ผันเสียง 1-5", "Play 1-5")}
            </span>
          </button>

          {/* ปุ่มฝึกออกเสียง (จางเมื่ออยู่ในโหมด Quiz) */}
          <button
            type="button"
            className={`practice-toggle-btn ${isPracticing ? "cancel" : ""}`}
            onClick={onTogglePractice}
            disabled={isQuizMode}
            style={isQuizMode ? { opacity: 0.45, cursor: "not-allowed", filter: "grayscale(0.6)" } : {}}
          >
            {isPracticing ? t("❌ ยกเลิก", "❌ Cancel") : t("🎙️ ฝึกออกเสียง", "🎙️ Practice")}
          </button>

          {/* ปุ่มแบบฝึกหัดวางคำ (จางเมื่ออยู่ในโหมดฝึกออกเสียง) */}
          <button
            type="button"
            className={`quiz-toggle-btn ${isQuizMode ? "cancel" : ""}`}
            onClick={() => onToggleQuiz(!isQuizMode)}
            disabled={isPracticing}
            style={isPracticing ? { opacity: 0.45, cursor: "not-allowed", filter: "grayscale(0.6)" } : {}}
          >
            {isQuizMode ? t("❌ ยกเลิกแบบฝึกหัด", "❌ Cancel Quiz") : t("🎯 วางคำบนเส้นบรรทัด", "🎯 Staff Drop Quiz")}
          </button>

          {/* ปุ่มข้ามคำในโหมดฝึกออกเสียง */}
          {isPracticing && !practiceCompleted && (
            <button
              type="button"
              className="practice-skip-btn"
              onClick={onSkip}
              title={t("ข้ามคำนี้ (ไม่ได้คะแนน)", "Skip this word (no score)")}
            >
              ⏭️ {t("ข้าม", "Skip")}
            </button>
          )}
        </div>

        {/* แถบสถานะโหมดออกเสียง */}
        {isPracticing && !practiceCompleted && (
          <div className="practice-status-banner" style={{ marginTop: "8px" }}>
            <span className="practice-msg-text">{practiceMsg}</span>
            <span className="practice-timer-text">⏱️ {practiceTimer}s</span>
            <span className="practice-score-text">🏆 {t("คะแนน", "Score")}: {practiceScore}</span>
          </div>
        )}

        {/* แถบสรุปคะแนนโหมดออกเสียง */}
        {practiceCompleted && (
          <div className="practice-summary-banner" style={{ marginTop: "8px" }}>
            <span style={{ fontSize: "16px" }}>🎉</span>
            <span>
              {t(`การทดสอบเสร็จสมบูรณ์! คะแนนรวมของคุณ: ${practiceScore} / ${totalPossibleScore} คะแนน`,
                 `Practice completed! Total score: ${practiceScore} / ${totalPossibleScore}`)}
            </span>
            <button type="button" onClick={onTogglePractice} className="practice-summary-close-btn">
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}