import React, { useState, useEffect } from "react";

/**
 * AuthModal.jsx
 * คอมโพเนนต์สำหรับเข้าสู่ระบบ / สมัครสมาชิก / จัดการโปรไฟล์ผู้ใช้
 * รองรับ 2 ภาษา (ไทย / English)
 * ออกแบบตามหลัก Data Minimization (PDPA / Privacy Act) และข้อกำหนดลิขสิทธิ์
 */

const AVATAR_PRESETS = [
  { id: "music", emoji: "🎵", label: "Music" },
  { id: "staff", emoji: "🎼", label: "Score" },
  { id: "grad", emoji: "🎓", label: "Student" },
  { id: "owl", emoji: "🦉", label: "Owl" },
  { id: "elephant", emoji: "🐘", label: "Elephant" },
  { id: "thai", emoji: "🇹🇭", label: "Thailand" },
  { id: "flower", emoji: "🌺", label: "Lotus" },
  { id: "star", emoji: "⭐", label: "Star" },
];

export default function AuthModal({
  isOpen = false,
  onClose,
  currentUser = null,
  onLogin,
  onRegister,
  onUpdateProfile,
  onDeleteAccount,
  lang = "th",
  setLang,
}) {
  const [tab, setTab] = useState("login"); // 'login' | 'register' | 'profile' | 'terms'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].emoji);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeCopyright, setAgreeCopyright] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      setShowDeleteConfirm(false);
      if (currentUser) {
        setTab("profile");
        setName(currentUser.name || "");
        setEmail(currentUser.email || "");
        setSelectedAvatar(currentUser.avatar || AVATAR_PRESETS[0].emoji);
        setAvatarPreview(currentUser.avatarUrl || "");
      } else {
        setTab("login");
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setAgreePrivacy(false);
        setAgreeCopyright(false);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const isTh = lang === "th";

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg(isTh ? "ขนาดไฟล์ต้องไม่เกิน 2MB" : "File size must not exceed 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setSelectedAvatar("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (tab === "login") {
      if (!email.trim() || !password) {
        setErrorMsg(isTh ? "กรุณากรอกอีเมลและรหัสผ่าน" : "Please enter email and password");
        return;
      }
      const userData = {
        id: "user_" + Date.now(),
        name: email.split("@")[0],
        email: email.trim(),
        avatar: selectedAvatar || "🎵",
        avatarUrl: avatarPreview,
      };
      if (onLogin) onLogin(userData);
      setSuccessMsg(isTh ? "เข้าสู่ระบบสำเร็จ!" : "Logged in successfully!");
      setTimeout(() => onClose && onClose(), 500);
    } else if (tab === "register") {
      if (!name.trim() || !email.trim() || !password) {
        setErrorMsg(isTh ? "กรุณากรอกข้อมูลให้ครบทุกช่อง" : "Please fill in all fields");
        return;
      }
      if (password.length < 6) {
        setErrorMsg(isTh ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" : "Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(isTh ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match");
        return;
      }
      if (!agreePrivacy) {
        setErrorMsg(
          isTh
            ? "กรุณายินยอมเงื่อนไขการคุ้มครองข้อมูลส่วนบุคคล (PDPA)"
            : "Please accept the Privacy Policy (PDPA) consent"
        );
        return;
      }
      if (!agreeCopyright) {
        setErrorMsg(
          isTh
            ? "กรุณารับทราบและยอมรับข้อกำหนดเกี่ยวกับลิขสิทธิ์"
            : "Please accept the Copyright & Terms of Use notice"
        );
        return;
      }

      const newUser = {
        id: "user_" + Date.now(),
        name: name.trim(),
        email: email.trim(),
        avatar: selectedAvatar || "🎓",
        avatarUrl: avatarPreview,
        registeredAt: new Date().toISOString(),
      };

      if (onRegister) onRegister(newUser);
      setSuccessMsg(isTh ? "สร้างบัญชีสำเร็จ!" : "Account created successfully!");
      setTimeout(() => onClose && onClose(), 500);
    } else if (tab === "profile") {
      if (!name.trim()) {
        setErrorMsg(isTh ? "กรุณาระบุชื่อที่ต้องการแสดง" : "Please enter your display name");
        return;
      }
      const updated = {
        ...currentUser,
        name: name.trim(),
        avatar: selectedAvatar,
        avatarUrl: avatarPreview,
      };
      if (onUpdateProfile) onUpdateProfile(updated);
      setSuccessMsg(isTh ? "บันทึกข้อมูลเรียบร้อย!" : "Profile updated successfully!");
      setTimeout(() => onClose && onClose(), 500);
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentUser || {}, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `thai_tone_user_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "16px",
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "460px",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e2e8f0",
        fontFamily: "'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        {/* Header Bar inside Modal */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
          backgroundColor: "#1e293b", color: "#ffffff",
          borderTopLeftRadius: "16px", borderTopRightRadius: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.3rem" }}>🇹🇭</span>
            <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {tab === "login" && (isTh ? "เข้าสู่ระบบ" : "Sign In")}
              {tab === "register" && (isTh ? "สร้างบัญชีใหม่" : "Create Account")}
              {tab === "profile" && (isTh ? "ข้อมูลส่วนตัว" : "User Profile")}
              {tab === "terms" && (isTh ? "ข้อกำหนดลิขสิทธิ์และสิทธิ์ส่วนบุคคล" : "Copyright & Privacy Terms")}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {setLang && (
              <button
                type="button"
                onClick={() => setLang(isTh ? "en" : "th")}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600
                }}
              >
                {isTh ? "EN" : "ไทย"}
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", color: "#94a3b8",
                fontSize: "1.4rem", cursor: "pointer", padding: "0 4px",
                lineHeight: 1
              }}
              title={isTh ? "ปิด" : "Close"}
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Switcher (if not logged in) */}
        {!currentUser && tab !== "terms" && (
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
            <button
              type="button"
              onClick={() => { setTab("login"); setErrorMsg(""); }}
              style={{
                flex: 1, padding: "12px", border: "none",
                backgroundColor: tab === "login" ? "#ffffff" : "transparent",
                color: tab === "login" ? "#0284c7" : "#64748b",
                fontWeight: tab === "login" ? 700 : 500,
                borderBottom: tab === "login" ? "2px solid #0284c7" : "none",
                cursor: "pointer", fontSize: "0.95rem"
              }}
            >
              {isTh ? "เข้าสู่ระบบ (Sign In)" : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => { setTab("register"); setErrorMsg(""); }}
              style={{
                flex: 1, padding: "12px", border: "none",
                backgroundColor: tab === "register" ? "#ffffff" : "transparent",
                color: tab === "register" ? "#0284c7" : "#64748b",
                fontWeight: tab === "register" ? 700 : 500,
                borderBottom: tab === "register" ? "2px solid #0284c7" : "none",
                cursor: "pointer", fontSize: "0.95rem"
              }}
            >
              {isTh ? "สมัครสมาชิก (Register)" : "Register"}
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: "20px" }}>
          {errorMsg && (
            <div style={{
              padding: "10px 14px", backgroundColor: "#fef2f2", color: "#b91c1c",
              border: "1px solid #fecaca", borderRadius: "8px", fontSize: "0.88rem",
              marginBottom: "14px"
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: "10px 14px", backgroundColor: "#f0fdf4", color: "#15803d",
              border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "0.88rem",
              marginBottom: "14px"
            }}>
              ✅ {successMsg}
            </div>
          )}

          {/* VIEW: Terms & Copyright Notice */}
          {tab === "terms" ? (
            <div>
              <h3 style={{ marginTop: 0, color: "#1e293b", fontSize: "1rem" }}>
                {isTh ? "นโยบายความเป็นส่วนตัวและสิทธิ์ทางปัญญา" : "Privacy Policy & Intellectual Property"}
              </h3>
              <div style={{
                fontSize: "0.85rem", color: "#475569", lineHeight: 1.6,
                maxHeight: "260px", overflowY: "auto", padding: "10px",
                backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0"
              }}>
                <p><strong>1. {isTh ? "การจัดเก็บข้อมูลเท่าที่จำเป็น (Data Minimization):" : "Data Minimization:"}</strong><br />
                  {isTh
                    ? "ระบบจัดเก็บเฉพาะ ชื่อ นามแฝง อีเมล และรูปโปรไฟล์ เพื่อระบุตัวตนและบันทึกประวัติความก้าวหน้าในการเรียนรู้เท่านั้น ไม่มีการจัดเก็บข้อมูลระบุตัวตนที่ไม่จำเป็นตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)"
                    : "We only collect display name, email, and avatar for identity and learning progress tracking, complying with PDPA and Privacy principles."}
                </p>
                <p><strong>2. {isTh ? "ข้อกำหนดสิทธิ์ในลิขสิทธิ์ (Copyright Notice):" : "Copyright Notice:"}</strong><br />
                  {isTh
                    ? "สื่อการสอน กฎการผันวรรณยุกต์ไตรยางศ์ โน้ตเพลง 5 เส้น แผนภาพคลื่นความถี่ และซอฟต์แวร์ เป็นผลงานที่ได้รับความคุ้มครองตามกฎหมายลิขสิทธิ์ สงวนลิขสิทธิ์เฉพาะผู้พัฒนา ห้ามคัดลอกหรือนำไปใช้เชิงพาณิชย์โดยไม่ได้รับอนุญาต"
                    : "Educational contents, 5-line musical notation, pitch contour algorithms, and software are protected by copyright laws. All rights reserved."}
                </p>
                <p><strong>3. {isTh ? "สิทธิในการลบข้อมูล (Right to Erasure):" : "Right to Erasure:"}</strong><br />
                  {isTh
                    ? "ผู้ใช้งานมีสิทธิ์ลบบัญชีและลบข้อมูลส่วนบุคคลทั้งหมดออกจากระบบได้ตลอดเวลาตามระเบียบของ Apple App Store และ Google Play Store"
                    : "Users have the right to request deletion of their account and all personal data at any time."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab(currentUser ? "profile" : "register")}
                style={{
                  width: "100%", marginTop: "16px", padding: "10px",
                  backgroundColor: "#0284c7", color: "#fff", border: "none",
                  borderRadius: "8px", cursor: "pointer", fontWeight: 600
                }}
              >
                {isTh ? "← ย้อนกลับ" : "← Back"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Avatar Selection (for Register and Profile) */}
              {(tab === "register" || tab === "profile") && (
                <div style={{ marginBottom: "16px", textAlign: "center" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                    {isTh ? "รูปโปรไฟล์ (Avatar)" : "Profile Avatar"}
                  </label>
                  
                  {/* Current Avatar Display */}
                  <div style={{
                    width: "70px", height: "70px", borderRadius: "50%", margin: "0 auto 10px",
                    backgroundColor: "#e0f2fe", border: "2px solid #0284c7",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "2rem", overflow: "hidden"
                  }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      selectedAvatar || "👤"
                    )}
                  </div>

                  {/* Preset Avatar Emojis */}
                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {AVATAR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelectedAvatar(p.emoji); setAvatarPreview(""); }}
                        style={{
                          fontSize: "1.2rem", padding: "4px 8px", borderRadius: "6px",
                          border: selectedAvatar === p.emoji ? "2px solid #0284c7" : "1px solid #cbd5e1",
                          background: selectedAvatar === p.emoji ? "#e0f2fe" : "#ffffff",
                          cursor: "pointer"
                        }}
                        title={p.label}
                      >
                        {p.emoji}
                      </button>
                    ))}
                  </div>

                  {/* Upload Custom Image */}
                  <label style={{
                    display: "inline-block", fontSize: "0.75rem", color: "#0284c7",
                    cursor: "pointer", textDecoration: "underline"
                  }}>
                    📷 {isTh ? "อัปโหลดรูปภาพจากเครื่อง (ไม่เกิน 2MB)" : "Upload custom photo (max 2MB)"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                  </label>
                </div>
              )}

              {/* Display Name field (Register / Profile) */}
              {(tab === "register" || tab === "profile") && (
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "ชื่อที่แสดง / นามแฝง" : "Display Name"} *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isTh ? "เช่น ครูทอม หรือ Student A" : "e.g. Tom or Student A"}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: "8px",
                      border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box"
                    }}
                    required
                  />
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {isTh ? "ใช้เฉพาะแสดงในระบบ ไม่จำเป็นต้องใช้ชื่อจริง" : "Only shown in app; real name not required"}
                  </span>
                </div>
              )}

              {/* Email field */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  {isTh ? "อีเมล (Email)" : "Email"} *
                </label>
                <input
                  type="email"
                  value={email}
                  disabled={tab === "profile"}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: "8px",
                    border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box",
                    backgroundColor: tab === "profile" ? "#f1f5f9" : "#ffffff"
                  }}
                  required
                />
              </div>

              {/* Password fields (Login / Register) */}
              {tab !== "profile" && (
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "รหัสผ่าน (Password)" : "Password"} *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: "8px",
                      border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box"
                    }}
                    required
                  />
                </div>
              )}

              {tab === "register" && (
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "ยืนยันรหัสผ่าน" : "Confirm Password"} *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: "8px",
                      border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box"
                    }}
                    required
                  />
                </div>
              )}

              {/* PDPA and Copyright Checkboxes for Register */}
              {tab === "register" && (
                <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.8rem", color: "#334155", cursor: "pointer", marginBottom: "8px" }}>
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      style={{ marginTop: "3px" }}
                      required
                    />
                    <span>
                      {isTh
                        ? "ยินยอมให้จัดเก็บข้อมูลส่วนบุคคล (ชื่อและอีเมล) เพื่อใช้งานระบบตาม "
                        : "I consent to the collection of my personal info according to "}
                      <a href="#terms" onClick={(e) => { e.preventDefault(); setTab("terms"); }} style={{ color: "#0284c7" }}>
                        {isTh ? "นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)" : "Privacy Policy"}
                      </a>
                    </span>
                  </label>

                  <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.8rem", color: "#334155", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={agreeCopyright}
                      onChange={(e) => setAgreeCopyright(e.target.checked)}
                      style={{ marginTop: "3px" }}
                      required
                    />
                    <span>
                      {isTh
                        ? "รับทราบและตกลงปฏิบัติตาม "
                        : "I acknowledge and agree to "}
                      <a href="#copyright" onClick={(e) => { e.preventDefault(); setTab("terms"); }} style={{ color: "#0284c7" }}>
                        {isTh ? "ข้อกำหนดสิทธิ์ในทรัพย์สินทางปัญญาและลิขสิทธิ์" : "Copyright & IP Terms"}
                      </a>
                    </span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <button
                type="submit"
                style={{
                  width: "100%", padding: "11px", backgroundColor: "#0284c7",
                  color: "#ffffff", border: "none", borderRadius: "8px",
                  fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(2,132,199,0.2)"
                }}
              >
                {tab === "login" && (isTh ? "เข้าสู่ระบบ" : "Sign In")}
                {tab === "register" && (isTh ? "สร้างบัญชีและยอมรับเงื่อนไข" : "Create Account & Accept")}
                {tab === "profile" && (isTh ? "บันทึกการแก้ไขโปรไฟล์" : "Save Profile")}
              </button>

              {/* Extra options in Profile mode */}
              {tab === "profile" && (
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "12px" }}>
                    <button
                      type="button"
                      onClick={handleExportData}
                      style={{
                        flex: 1, padding: "8px", backgroundColor: "#f1f5f9",
                        color: "#475569", border: "1px solid #cbd5e1", borderRadius: "6px",
                        fontSize: "0.8rem", cursor: "pointer", fontWeight: 600
                      }}
                    >
                      📥 {isTh ? "ดาวน์โหลดข้อมูลของฉัน (JSON)" : "Download My Data"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("terms")}
                      style={{
                        flex: 1, padding: "8px", backgroundColor: "#f1f5f9",
                        color: "#475569", border: "1px solid #cbd5e1", borderRadius: "6px",
                        fontSize: "0.8rem", cursor: "pointer", fontWeight: 600
                      }}
                    >
                      📜 {isTh ? "ดูข้อกำหนดลิขสิทธิ์" : "View Terms"}
                    </button>
                  </div>

                  {/* Account Deletion (Apple App Store & PDPA Requirement) */}
                  <div style={{ backgroundColor: "#fef2f2", padding: "12px", borderRadius: "8px", border: "1px solid #fecaca" }}>
                    <div style={{ fontSize: "0.82rem", color: "#991b1b", fontWeight: 600, marginBottom: "4px" }}>
                      ⚠️ {isTh ? "สิทธิในการลบบัญชีและข้อมูล (Right to Erasure)" : "Account Deletion"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#7f1d1d", marginBottom: "8px" }}>
                      {isTh
                        ? "ข้อมูลทั้งหมดของคุณจะถูกลบออกจากระบบอย่างถาวรตามกฎหมายคุ้มครองข้อมูล"
                        : "All your personal data and progress will be permanently erased."}
                    </div>

                    {showDeleteConfirm ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onDeleteAccount) onDeleteAccount(currentUser?.id);
                            onClose && onClose();
                          }}
                          style={{
                            flex: 1, padding: "6px", backgroundColor: "#dc2626",
                            color: "#fff", border: "none", borderRadius: "6px",
                            fontSize: "0.8rem", fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          {isTh ? "ยืนยันลบบัญชีถาวร" : "Confirm Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          style={{
                            padding: "6px 12px", backgroundColor: "#cbd5e1",
                            color: "#334155", border: "none", borderRadius: "6px",
                            fontSize: "0.8rem", cursor: "pointer"
                          }}
                        >
                          {isTh ? "ยกเลิก" : "Cancel"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{
                          width: "100%", padding: "6px", backgroundColor: "transparent",
                          color: "#dc2626", border: "1px solid #dc2626", borderRadius: "6px",
                          fontSize: "0.78rem", fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        🗑️ {isTh ? "ขอลบบัญชีและข้อมูลทั้งหมด" : "Delete Account & Data"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
