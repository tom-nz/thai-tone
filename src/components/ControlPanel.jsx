import React from "react";
import {
  quickConsonants,
  midConsonants,
  highConsonants,
  lowPairConsonants,
  lowSingleConsonants,
  trueClusters,
  leadingHoClusters,
  falseClusters,
  longVowels,
  shortVowels,
} from "../utils/toneRules";

function ModeRadio({ value, checked, label, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer" }}>
      <input
        type="radio"
        name="mode"
        checked={checked}
        onChange={() => onChange(value)}
        style={{
          appearance: "none",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: "2px solid #475569",
          backgroundColor: checked ? "#000000" : "#ffffff",
          cursor: "pointer",
          margin: 0,
          flexShrink: 0,
        }}
      />
      {label}
    </label>
  );
}

export default function ControlPanel({
  mode,
  handleModeChange,
  inputText,
  setInputText,
  validateInput,
  inputError,
  loading,
  handleGenerate,
  handleQuickConsonantClick,
  handleQuickVowelClick,
  colorMid,
  setColorMid,
  colorHigh,
  setColorHigh,
  colorLow,
  setColorLow,
  circleTextColor,
  setCircleTextColor,
  staffBgColor,
  setStaffBgColor,
  bgColor,
  setBgColor,
  bgType,
  setBgType,
  setBgImage,
  handleImageUpload,
  labelFontSize,
  setLabelFontSize,
  speechEnabled,
  setSpeechEnabled,
  selectedVoiceURI,
  setSelectedVoiceURI,
  voices,
  speechRate,
  setSpeechRate,
  onTestVoice,
  soundManagerOpen,
  setSoundManagerOpen,
  newSoundWord,
  setNewSoundWord,
  handleAddSoundWord,
  soundLoading,
  soundSearch,
  setSoundSearch,
  soundError,
  filteredSoundWords,
  onPlaySoundWord,
  handleReplaceSoundAudio,
  handleDeleteSoundWord,
  fetchSoundWords,
  handleClearAllLocalCache,
  customApiKey,
  showApiInput,
  setShowApiInput,
  tempApiKey,
  setTempApiKey,
  handleSaveApiKey,
  apiSaveStatus,
  lang,
}) {
  const t = (th, en) => (lang === "en" ? en : th);

  return (
    <aside className="control-panel panel" style={{ flex: 1, overflowY: "auto", position: "static", maxHeight: "none", margin: 0 }}>
      <h3>{t("⚙️ แผงควบคุม", "⚙️ Control Panel")}</h3>

      <section className="control-group">
        <strong>{t("✨ ผู้ช่วย AI ผันวรรณยุกต์อัตโนมัติ", "✨ AI Tone Inflection Assistant")}</strong>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px", fontSize: "13px", color: "#334155" }}>
          <ModeRadio value="full5" checked={mode === "full5"} label={t("แสดงชุดผัน 5 เสียงเมื่อมีกฎเทียบ (อักษรคู่ / ห นำ)", "Show 5 tones with paired / leading rules")} onChange={handleModeChange} />
          <ModeRadio value="highOnly" checked={mode === "highOnly"} label={t("เฉพาะเสียงสูง (เอก, โท, จัตวา)", "High tone set only (Low, Falling, Rising)")} onChange={handleModeChange} />
          <ModeRadio value="lowOnly" checked={mode === "lowOnly"} label={t("เฉพาะเสียงต่ำ (สามัญ, โท, ตรี)", "Low tone set only (Mid, Falling, High)")} onChange={handleModeChange} />
          <ModeRadio value="pair" checked={mode === "pair"} label={t("จับคู่อักษร(เสียง)สูงและต่ำ เพื่อระบุกลุ่มอักษร", "Pair High & Low Class Consonants")} onChange={handleModeChange} />
        </div>

        <div className="input-row">
          <input
            value={inputText}
            placeholder={t("พิมพ์ 1 คำ เช่น กอ, เมา, กวาง", "Type 1 word, e.g. กอ, เมา, กวาง")}
            onChange={(event) => {
              let val = event.target.value;
              if (mode === "pair") {
                const match = val.match(/([ก-ฮ])/);
                val = match ? `${match[1]}อ` : "ขอ";
              }
              setInputText(val);
              validateInput(val);
              if (!val.trim() && mode !== "pair") handleModeChange("full5");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleGenerate();
            }}
            className={inputError ? "input-error" : ""}
          />
          <button className="blue-btn" disabled={loading} onClick={handleGenerate}>
            {loading ? "..." : t("ผันคำ", "Analyze")}
          </button>
        </div>
        {inputError && <div className="error-text">{inputError}</div>}
      </section>

      {/* เลือกพยัญชนะด่วน */}
      <section>
        <div className="section-label">{t("⌨️ เลือกพยัญชนะด่วน (๔๔ ตัว):", "⌨️ Quick Consonants (44 Letters):")}</div>
        <div className="consonant-grid">
          {quickConsonants.map((consonant) => (
            <button
              key={consonant}
              type="button"
              className="consonant-btn"
              onClick={() => handleQuickConsonantClick(consonant)}
              style={{
                color: midConsonants.includes(consonant)
                  ? colorMid
                  : highConsonants.includes(consonant)
                    ? colorHigh
                    : colorLow,
              }}
            >
              {consonant}
            </button>
          ))}
        </div>

        <div className="low-class-groups">
          <div className="low-class-group">
            <div className="section-label low-pair-label">{t("🟣 อักษรต่ำคู่ (๑๔ ตัว)", "🟣 Paired Low Consonants (14 Letters)")}</div>
            <div className="low-consonant-grid">
              {lowPairConsonants.map((consonant) => (
                <button key={`low-pair-${consonant}`} type="button" className="consonant-btn low-pair-btn" onClick={() => handleQuickConsonantClick(consonant)}>
                  {consonant}
                </button>
              ))}
            </div>
          </div>

          <div className="low-class-group">
            <div className="section-label low-single-label">{t("🔵 อักษรต่ำเดี่ยว (๑๐ ตัว)", "🔵 Single Low Consonants (10 Letters)")}</div>
            <div className="low-consonant-grid">
              {lowSingleConsonants.map((consonant) => (
                <button key={`low-single-${consonant}`} type="button" className="consonant-btn low-single-btn" onClick={() => handleQuickConsonantClick(consonant)}>
                  {consonant}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="cluster-groups">
          <div>
            <div className="section-label cluster-label">{t("🔗 ควบกล้ำแท้", "🔗 True Clusters")}</div>
            <div className="cluster-grid">
              {trueClusters.map((cluster) => (
                <button key={cluster} type="button" className="cluster-btn true-cluster" onClick={() => handleQuickConsonantClick(cluster)}>
                  {cluster}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="section-label cluster-label">{t("🟣 อักษรนำ ห-นำ", "🟣 Leading ห- Clusters")}</div>
            <div className="cluster-grid">
              {leadingHoClusters.map((cluster) => (
                <button key={cluster} type="button" className="cluster-btn leading-ho-cluster" onClick={() => handleQuickConsonantClick(cluster)}>
                  {cluster}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="section-label cluster-label">{t("🟠 ควบกล้ำไม่แท้", "🟠 False Clusters")}</div>
            <div className="cluster-grid">
              {falseClusters.map((cluster) => (
                <button key={cluster} type="button" className="cluster-btn false-cluster" onClick={() => handleQuickConsonantClick(cluster)}>
                  {cluster}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* สระเสียงสั้น/ยาว */}
      <section>
        <div className="section-label green-label">{t("🟢 สระเสียงยาว (คำเป็น):", "🟢 Long Vowels (Live Syllables):")}</div>
        <div className="vowel-list">
          {longVowels.map((vowel) => (
            <button key={vowel.label} className="vowel-btn long-vowel" onClick={() => handleQuickVowelClick(vowel)}>
              {vowel.label}
            </button>
          ))}
        </div>
        <div className="section-label red-label">{t("🔴 สระเสียงสั้น (คำตาย):", "🔴 Short Vowels (Dead Syllables):")}</div>
        <div className="vowel-list">
          {shortVowels.map((vowel) => (
            <button key={vowel.label} className="vowel-btn short-vowel" onClick={() => handleQuickVowelClick(vowel)}>
              {vowel.label}
            </button>
          ))}
        </div>
      </section>

      {/* เสียงอ่าน TTS */}
      <section className="control-group">
        <strong>{t("🔊 การอ่านออกเสียง", "🔊 Speech & Voice")}</strong>
        <label className="toggle-label">
          <input type="checkbox" checked={speechEnabled} onChange={(e) => setSpeechEnabled(e.target.checked)} />
          {t("เปิดเสียงเมื่อคลิกบรรทัด", "Enable voice on row click")}
        </label>
        <label className="select-label">
          {t("เสียงอ่าน", "Voice")}
          <select value={selectedVoiceURI} onChange={(e) => setSelectedVoiceURI(e.target.value)}>
            <option value="">{t("เลือกอัตโนมัติ", "Auto Select")}</option>
            {voices.filter((v) => v.lang?.toLowerCase().startsWith("th")).map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>
        <label className="select-label">
          {t("ความเร็วอ่าน:", "Speech Rate:")} {speechRate}x
          <input type="range" min="0.5" max="1.4" step="0.05" value={speechRate} onChange={(e) => setSpeechRate(Number(e.target.value))} />
        </label>
        <button className="soft-btn" onClick={onTestVoice}>
          ▶ {t("ทดลองอ่านคำ", "Test Voice")}
        </button>
      </section>

      {/* จัดการคลังเสียง */}
      <section className="control-group sound-manager-section">
        <button className="soft-btn" onClick={() => setSoundManagerOpen((v) => !v)}>
          📚 {soundManagerOpen ? t("ปิดคลังเสียง", "Close Sound Library") : t("จัดการคลังเสียง (เรียกดู/เพิ่ม/แก้ไข/ลบ)", "Manage Sound Library")}
        </button>
        {soundManagerOpen && (
          <div className="sound-manager-box">
            <div className="input-row">
              <input
                type="text"
                value={newSoundWord}
                placeholder={t("พิมพ์คำใหม่ที่จะเพิ่ม...", "Type a new word to add...")}
                onChange={(e) => setNewSoundWord(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddSoundWord(); }}
              />
              <button className="green-btn" onClick={handleAddSoundWord} disabled={soundLoading || !newSoundWord.trim()}>
                ➕ {t("เพิ่ม", "Add")}
              </button>
            </div>
            <input
              type="text"
              value={soundSearch}
              placeholder={t("🔍 ค้นหาคำในคลังเสียง...", "🔍 Search sound library...")}
              onChange={(e) => setSoundSearch(e.target.value)}
            />
            {soundLoading && <div className="section-label">{t("กำลังโหลด...", "Loading...")}</div>}
            {soundError && <div className="error-text">{soundError}</div>}
            <div className="sound-word-list">
              {filteredSoundWords.map((item) => (
                <div key={item.word} className="sound-word-row">
                  <span className="sound-word-text">{item.word}</span>
                  <div className="sound-word-actions">
                    <button className="soft-btn" title={t("ฟังเสียง", "Play")} onClick={() => onPlaySoundWord(item.word)}>▶</button>
                    <label className="soft-btn sound-edit-btn" title={t("แทนที่ไฟล์เสียง", "Replace audio")}>
                      ✏️
                      <input type="file" accept="audio/*" onChange={(e) => { handleReplaceSoundAudio(item.word, e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                    <button className="danger-btn" title={t("ลบคำนี้", "Delete word")} onClick={() => handleDeleteSoundWord(item.word)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="soft-btn" onClick={fetchSoundWords} disabled={soundLoading}>🔄 {t("รีเฟรชรายการ", "Refresh List")}</button>
            <button className="danger-btn" onClick={handleClearAllLocalCache}>🧹 {t("ล้างแคชเสียงในเครื่องทั้งหมด", "Clear all local audio cache")}</button>
          </div>
        )}
      </section>

      {/* สีพื้นหลังกระดาน */}
      <section className="control-group">
        <div style={{ fontSize: "13px", fontWeight: "bold", color: "#4b5563", marginBottom: "8px" }}>
          {t("🎼 สีพื้นหลังกระดานบรรทัด 5 เส้น", "🎼 5-Line Staff Background")}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { label: t("ขาว", "White"), value: "#ffffff" },
            { label: t("ครีม", "Cream"), value: "#fffbeb" },
            { label: t("ฟ้าอ่อน", "Soft Blue"), value: "#f0f9ff" },
            { label: t("เขียวอ่อน", "Soft Green"), value: "#f0fdf4" },
            { label: t("เทาอ่อน", "Soft Gray"), value: "#f8fafc" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStaffBgColor(item.value)}
              style={{
                backgroundColor: item.value,
                border: staffBgColor === item.value ? "2px solid #0284c7" : "1px solid #cbd5e1",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "bold",
                cursor: "pointer",
                color: "#1e293b",
              }}
            >
              {item.label}
            </button>
          ))}
          <input
            type="color"
            value={staffBgColor}
            onChange={(e) => setStaffBgColor(e.target.value)}
            style={{ width: "34px", height: "30px", padding: 0, cursor: "pointer", border: "1px solid #cbd5e1", borderRadius: "6px" }}
          />
        </div>
      </section>

      {/* สีประจำหมู่อักษร */}
      <section>
        <div className="section-label">{t("🎨 ตั้งค่าสีประจำหมู่ และสีตัวอักษร", "🎨 Consonant Class & Text Colors")}</div>
        <div className="color-grid">
          {[
            [t("อักษรกลาง", "Mid Class"), colorMid, setColorMid],
            [t("อักษรสูง", "High Class"), colorHigh, setColorHigh],
            [t("อักษรต่ำ", "Low Class"), colorLow, setColorLow],
            [t("สีตัวอักษร", "Text Color"), circleTextColor, setCircleTextColor],
          ].map(([label, value, setter]) => (
            <label
              key={label}
              className="color-picker"
              style={{
                backgroundColor: label === "สีตัวอักษร" ? "#334155" : value,
                color: label === "สีตัวอักษร" ? value : "#fff",
              }}
            >
              {label}
              <input type="color" value={value} onChange={(e) => setter(e.target.value)} />
            </label>
          ))}
        </div>
      </section>

      {/* สีพื้นหลังรวม / รูปภาพ */}
      <section className="control-group">
        <strong>{t("🖼️ เลือกสีหรือรูปภาพพื้นหลังจอภาพรวม", "🖼️ Overall Screen Background")}</strong>
        <div className="background-colors">
          {[
            [t("เทา", "Gray"), "#e2e8f0"],
            [t("สว่าง", "Light"), "#f1f5f9"],
            [t("ฟ้าอ่อน", "Soft Blue"), "#e0f2fe"],
            [t("มินต์", "Mint"), "#dcfce7"],
            [t("ส้มอ่อน", "Soft Orange"), "#fef3c7"],
            [t("เข้ม", "Dark"), "#334155"],
          ].map(([label, color]) => (
            <button
              key={color}
              onClick={() => { setBgColor(color); setBgType("color"); }}
              className={bgColor === color && bgType === "color" ? "background-selected" : ""}
              style={{ backgroundColor: color, color: color === "#334155" ? "#fff" : "#1e293b" }}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="upload-btn">
          {t("📁 อัปโหลดรูปภาพพื้นหลัง", "📁 Upload Background Image")}
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </label>
        {bgType === "image" && (
          <button className="danger-btn" onClick={() => { setBgType("color"); setBgImage(""); }}>
            {t("ยกเลิกรูปภาพ", "Remove Image")}
          </button>
        )}
      </section>

      {/* ขนาดตัวหนังสือ */}
      <section className="control-group">
        <label className="select-label">
          {t("📐 ขนาดตัวหนังสือและวงกลม (จอที่ 2):", "📐 Font & Circle Size (Screen 2):")} {labelFontSize}px
          <input type="range" min="16" max="32" value={labelFontSize} onChange={(e) => setLabelFontSize(Number(e.target.value))} />
        </label>
      </section>

      {/* Gemini API Key */}
      <section className="api-section">
        <button className="api-toggle" onClick={() => setShowApiInput((v) => !v)}>
          🔑 {customApiKey ? t("เปลี่ยน Gemini API Key", "Change Gemini API Key") : t("เชื่อมต่อ AI (API Key)", "Connect AI (API Key)")}
        </button>
        {showApiInput && (
          <div className="api-input-box">
            <strong>{t("🔑 เชื่อมต่อ Gemini API Key ส่วนตัว:", "🔑 Connect Personal Gemini API Key:")}</strong>
            <div className="input-row">
              <input
                type="password"
                value={tempApiKey}
                placeholder={t("วาง Gemini API Key...", "Paste Gemini API Key...")}
                onChange={(e) => setTempApiKey(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveApiKey(); }}
              />
              <button className="green-btn" onClick={handleSaveApiKey}>{t("บันทึก", "Save")}</button>
            </div>
            {apiSaveStatus && <div className="success-text">✓ {apiSaveStatus}</div>}
          </div>
        )}
      </section>
    </aside>
  );
}