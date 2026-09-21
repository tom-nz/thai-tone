import React, { useState, useEffect } from "react";
import StaffQuizMode from "./StaffQuizMode";
import { midConsonants, lowSingleConsonants, analyzeSyllable } from "../utils/toneRules";

export default function ToneBoard({
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

  const getSpeechText = (item) => {
    if (!item?.show) return "";
    if (item.isMulti) return item.multi[0]?.ttsText || item.multi[0]?.text || "";
    return item.ttsText || item.word || "";
  };

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

  return (
    <div
      className={`tone-board ${isDisplay ? "display-board" : ""}`}
      style={{
        ...(isDisplay ? { backgroundColor: staffBgColor } : {}),
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div className="board-title" style={{ color: "#4A148C" }}>
        <h2 style={{ color: "#4A148C" }}>{t("ไตรยางศ์ หรือ อักษร 3 หมู่", "Three Consonant Classes (Triyang)")}</h2>
        <div style={{ color: "#4A148C" }}>{t("และการผันวรรณยุกต์", "Tone Rules & Musical Staves")}</div>
      </div>

      {(!isQuizMode || (isQuizMode && resolvedQuizItem)) && Boolean(inputText.trim() || resolvedQuizItem) && (() => {
        const visibleItems = linesData.filter((item) => item.show);
        const topItem = visibleItems[0];
        const bottomItem = visibleItems[visibleItems.length - 1];
        const isMid = midConsonants.includes(analysisInfo?.primaryConsonant);

        const getTargetWord = (item) => getSpeechText(item);
        const analyses = [];

        if (mode === "pair") {
          const topWord = getTargetWord(topItem);
          const bottomWord = getTargetWord(bottomItem);
          const pConsonant = analysisInfo?.primaryConsonant || "";
          const isSingle = lowSingleConsonants.includes(pConsonant);

          let pairTitle, pairDesc;
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
            <div className="analysis-box">
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
              info: analyzeSyllable(word, mode),
            });
          }
        } else if (mode === "full5") {
          const topWord = getTargetWord(topItem);
          const bottomWord = getTargetWord(bottomItem);

          if (topWord) {
            analyses.push({
              label: "เสียงสูง",
              word: topWord,
              info: analyzeSyllable(topWord, "highOnly"),
            });
          }

          if (bottomWord && bottomItem?.id !== topItem?.id) {
            analyses.push({
              label: "เสียงต่ำ",
              word: bottomWord,
              info: analyzeSyllable(bottomWord, "lowOnly"),
            });
          }
        } else if (mode === "highOnly") {
          const word = getTargetWord(topItem);
          if (word) {
            analyses.push({
              label: "เสียงสูง",
              word,
              info: analyzeSyllable(word, "highOnly"),
            });
          }
        } else if (mode === "lowOnly") {
          const word = getTargetWord(bottomItem);
          if (word) {
            analyses.push({
              label: "เสียงต่ำ",
              word,
              info: analyzeSyllable(word, "lowOnly"),
            });
          }
        }

        if (!analyses.length) return null;

        const getLabelText = (lbl) => {
          if (lbl === "อักษรกลาง") return t("อักษรกลาง", "Mid Class");
          if (lbl === "เสียงสูง") return t("เสียงสูง", "High Tone");
          if (lbl === "เสียงต่ำ") return t("เสียงต่ำ", "Low Tone");
          return lbl;
        };

        const translateType = (type) => {
          if (type === "คำเป็น") return t("คำเป็น", "Live Syllable");
          if (type === "คำตาย") return t("คำตาย", "Dead Syllable");
          return type;
        };

        const translateVowel = (v) => {
          if (v === "สระเสียงยาว") return t("สระเสียงยาว", "Long Vowel");
          if (v === "สระเสียงสั้น") return t("สระเสียงสั้น", "Short Vowel");
          return v;
        };

        const getAnalysisDesc = (inf) => {
          if (lang !== "en") return inf.desc;
          const cClass = inf.consonantClass;
          const pConsonant = inf.primaryConsonant || "";
          const init = inf.initial || "";
          const initKind = inf.initialKind || "single";
          const dead = inf.isDead;
          const short = inf.isShort;

          let cLabel = "";
          if (initKind === "trueCluster") cLabel = ` (True Cluster "${init}")`;
          else if (initKind === "leadingHo") cLabel = ` (Leading ห- "${init}")`;
          else if (initKind === "leadingO") cLabel = ` (Leading อ- "${init}")`;
          else if (initKind === "falseCluster") cLabel = ` (False Cluster "${init}")`;

          if (cClass === "middle") {
            return dead
              ? `Mid Class${cLabel} Dead Syllable (Inflects 4 tones: Low, Falling, High, Rising; Natural pitch: Low)`
              : `Mid Class${cLabel} Live Syllable (Inflects all 5 tones; Natural pitch: Mid)`;
          }
          if (cClass === "high") {
            return dead
              ? `High Class${cLabel} Dead Syllable (Inflects 2 tones: Low, Falling; Natural pitch: Low)`
              : `High Class${cLabel} Live Syllable (Inflects 3 tones: Low, Falling, Rising; Natural pitch: Rising)`;
          }
          if (cClass === "low") {
            const subtype = lowSingleConsonants.includes(pConsonant) ? "Single Low Class" : "Paired Low Class";
            return dead
              ? short
                ? `${subtype}${cLabel} Dead Syllable (Short Vowel) (Inflects 2 tones: Falling, High; Natural pitch: High)`
                : `${subtype}${cLabel} Dead Syllable (Long Vowel) (Inflects 2 tones: Falling, High; Natural pitch: Falling)`
              : `${subtype}${cLabel} Live Syllable (Inflects 3 tones: Mid, Falling, High; Natural pitch: Mid)`;
          }
          return inf.desc;
        };

        return (
          <div className="analysis-box">
            {analyses.map(({ label, word, info }, index) => (
              <div className="analysis-item" key={`${label}-${word}-${index}`}>
                📌 {t("ผลวิเคราะห์หลักภาษา", "Linguistic Analysis")} ({getLabelText(label)}): <strong>"{word}"</strong> {t("เป็น", "is")}{" "}
                <span className="analysis-tag">
                  {translateType(info.type)} ({translateVowel(info.vowelLen)})
                </span>{" "}
                — {getAnalysisDesc(info)}
              </div>
            ))}
          </div>
        );
      })()}

      {/* เส้นบรรทัด 5 เส้น */}
      <div className="tone-rows" style={{ paddingTop: "10px" }}>
        {linesData.map((item) => {
          const isActive = !isPracticing && !isQuizMode && activeRowId === item.id;
          const fixedRight = fixedRightLabels[item.id];
          const lineThemeColor = isQuizMode ? "#94a3b8" : (item.show ? (item.isMulti ? item.multi[0]?.color : item.color) : "#94a3b8");
          const isQuizResolvedHere = isQuizMode && resolvedQuizItem && resolvedQuizItem.placedLine === item.id;

          return (
            <button
              type="button"
              data-tone-line-id={item.id}
              className={`tone-row ${isActive ? "active" : ""} ${!item.show && !isQuizMode ? "disabled-tone-row" : ""} ${isPracticing ? "practice-locked" : ""}`}
              key={item.id}
              onClick={() => {
                if (!isPracticing && !isQuizMode) onRowClick(item);
              }}
              style={isPracticing || isQuizMode ? { cursor: 'default' } : {}}
              title={item.show && !isPracticing && !isQuizMode ? `${t("คลิกเพื่อขยายและอ่านคำ", "Click to zoom and speak")} ${getSpeechText(item)}` : ""}
            >
              <div
                className="tone-name clickable-tone-text"
                style={{
                  color: "#1e293b",
                  fontSize: textSize,
                  transform: isActive ? "scale(1.08)" : "none",
                  transition: "transform .18s ease, color .18s ease",
                }}
              >
                {t(item.tone, toneNames[item.id]?.en || item.tone)} <span style={{ color: "#475569" }}>[ {item.mark} ]</span>
              </div>

              <div className="tone-line-wrap">
                <div className="tone-line" style={{ backgroundColor: isQuizMode ? "#cbd5e1" : (isActive ? "#475569" : "#94a3b8") }} />

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
                  <div className="multi-circles" style={{ left: item.leftPos }}>
                    {item.multi.map((circle, index) => (
                      <React.Fragment key={`${circle.text}-${index}`}>
                        {index > 0 && <span className="slash">/</span>}
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

              <div className="tone-line-number" style={{ color: lineThemeColor }}>
                {item.id}
              </div>

              <div className="fixed-tone-label" style={{ color: fixedRight?.color || "#94a3b8" }}>
                {fixedRight?.text || ""}
              </div>
            </button>
          );
        })}
      </div>

      {isQuizMode && (
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
      )}

      {/* แถบปุ่มควบคุมด้านล่างกระดาน */}
      <div className="board-footer-actions">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
            {mode === "pair" || mode === "highOnly" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="10 5 5 9 2 9 2 15 5 15 10 19 10 5" fill="currentColor" stroke="none" />
                <path d="M15 9l6 6" stroke="currentColor" strokeWidth="2.2" />
                <path d="M16 15h5v-5" stroke="currentColor" strokeWidth="2.2" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="10 5 5 9 2 9 2 15 5 15 10 19 10 5" fill="currentColor" stroke="none" />
                <path d="M15 15l6-6" stroke="currentColor" strokeWidth="2.2" />
                <path d="M16 9h5v5" stroke="currentColor" strokeWidth="2.2" />
              </svg>
            )}
            <span className="auto-play-label">
              {isPlayingAll
                ? t("กำลังออกเสียง...", "Playing...")
                : mode === "pair"
                  ? t("ผันเสียง 5+1", "Play 5+1")
                  : mode === "highOnly"
                    ? t("ผันเสียง 5-2-3", "Play 5-2-3")
                    : mode === "lowOnly"
                      ? t("ผันเสียง 1-3-4", "Play 1-3-4")
                      : t("ผันเสียง 1-5", "Play 1-5")}
            </span>
          </button>

          <button
            type="button"
            className={`practice-toggle-btn ${isPracticing ? "cancel" : ""}`}
            onClick={onTogglePractice}
            disabled={isQuizMode}
            style={isQuizMode ? { opacity: 0.45, cursor: "not-allowed", filter: "grayscale(0.6)" } : {}}
          >
            {isPracticing ? t("❌ ยกเลิก", "❌ Cancel") : t("🎙️ ฝึกออกเสียง", "🎙️ Practice")}
          </button>

          <button
            type="button"
            className={`quiz-toggle-btn ${isQuizMode ? "cancel" : ""}`}
            onClick={() => onToggleQuiz(!isQuizMode)}
            disabled={isPracticing}
            style={isPracticing ? { opacity: 0.45, cursor: "not-allowed", filter: "grayscale(0.6)" } : {}}
          >
            {isQuizMode ? t("❌ ยกเลิกแบบฝึกหัด", "❌ Cancel Quiz") : t("🎯 วางคำบนเส้นบรรทัด", "🎯 Staff Drop Quiz")}
          </button>

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

        {isPracticing && !practiceCompleted && (
          <div className="practice-status-banner">
            <span className="practice-msg-text">{practiceMsg}</span>
            <span className="practice-timer-text">⏱️ {practiceTimer}s</span>
            <span className="practice-score-text">🏆 {t("คะแนน", "Score")}: {practiceScore}</span>
          </div>
        )}

        {practiceCompleted && (
          <div className="practice-summary-banner">
            <span style={{ fontSize: "16px" }}>🎉</span>
            <span>
              {t(`การทดสอบเสร็จสมบูรณ์! คะแนนรวมของคุณ: ${practiceScore} / ${totalPossibleScore} คะแนน`,
                 `Practice completed! Total score: ${practiceScore} / ${totalPossibleScore}`)}
            </span>
            <button
              type="button"
              onClick={onTogglePractice}
              className="practice-summary-close-btn"
              title={t("ปิดสรุปคะแนน", "Close summary")}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}