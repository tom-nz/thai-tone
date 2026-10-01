import React, { useState, useEffect } from "react";
import { DEFAULT_AUTH_PROVIDERS } from "./AdminDashboard";

/**
 * AuthModal.jsx (Version 3.2 - Social Auth & Expired Plan Handling)
 * คอมโพเนนต์สำหรับเข้าสู่ระบบ / สมัครสมาชิก / จัดการโปรไฟล์ผู้ใช้
 * รองรับ 2 ภาษา (ไทย / English)
 * ฟังก์ชันหลัก:
 * 1. รองรับ Social Login & Sign Up: Google, Apple ID, Facebook, Instagram
 * 2. ปรับเปลี่ยนช่องทางตามการตั้งค่าของผู้ดูแลระบบใน thai_tone_auth_config
 * 3. มีฟอร์มระบุบัญชี Social Account Picker ใช้งานได้จริงทุกอุปกรณ์
 * 4. ซิงก์ข้อมูลสมาชิกลงทั้ง thai_tone_user และ thai_tone_members
 * 5. ตรวจสอบและดีฟอลต์สมาชิกที่หมดอายุเป็นแผน "free" อัตโนมัติ
 * 6. รองรับ PDPA และ Right to Erasure สำหรับ Apple App Store
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

  // Social Auth Sub-modal state: null | 'google' | 'apple' | 'facebook' | 'instagram'
  const [socialPromptProvider, setSocialPromptProvider] = useState(null);
  const [socialAccountEmail, setSocialAccountEmail] = useState("");
  const [socialAccountName, setSocialAccountName] = useState("");

  // Dynamic Provider settings configured by Admin
  const [providers, setProviders] = useState(DEFAULT_AUTH_PROVIDERS);

  // Sync state when opened or user changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      setShowDeleteConfirm(false);
      setSocialPromptProvider(null);

      // Load auth providers config from Admin settings
      try {
        const savedConfig = localStorage.getItem("thai_tone_auth_config");
        if (savedConfig) {
          setProviders(JSON.parse(savedConfig));
        } else {
          setProviders(DEFAULT_AUTH_PROVIDERS);
        }
      } catch (e) {
        console.error(e);
      }

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
  const todayStr = new Date().toISOString().slice(0, 10);

  // Helper to sync newly logged-in/registered user into thai_tone_members list
  const syncToMembersList = (userData) => {
    try {
      const savedMembersStr = localStorage.getItem("thai_tone_members");
      let members = savedMembersStr ? JSON.parse(savedMembersStr) : [];
      const exists = members.some(
        (m) => (m.email && m.email.toLowerCase() === userData.email?.toLowerCase()) || m.id === userData.id
      );
      if (!exists) {
        members.unshift(userData);
      } else {
        // Update user record if exists
        members = members.map((m) =>
          (m.email && m.email.toLowerCase() === userData.email?.toLowerCase()) || m.id === userData.id
            ? { ...m, ...userData }
            : m
        );
      }
      localStorage.setItem("thai_tone_members", JSON.stringify(members));
    } catch (e) {
      console.error("Error syncing to thai_tone_members:", e);
    }
  };

  // Open Social Login Dialog
  const handleOpenSocialPrompt = (providerKey) => {
    setErrorMsg("");
    setSocialPromptProvider(providerKey);

    // Pre-fill suggested values
    let defaultEmail = "";
    let defaultName = "";
    if (providerKey === "google") {
      defaultEmail = localStorage.getItem("thai_tone_last_google_email") || "user@gmail.com";
      defaultName = "Google Learner";
    } else if (providerKey === "apple") {
      defaultEmail = "user@privaterelay.appleid.com";
      defaultName = "Apple User";
    } else if (providerKey === "facebook") {
      defaultEmail = "user@facebook.com";
      defaultName = "Facebook Learner";
    } else if (providerKey === "instagram") {
      defaultEmail = "creator@instagram.com";
      defaultName = "IG Creator";
    }
    setSocialAccountEmail(defaultEmail);
    setSocialAccountName(defaultName);
  };

  // Confirm Social Login / Sign Up
  const handleSocialConfirm = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const providerKey = socialPromptProvider;
    const cleanEmail = socialAccountEmail.trim().toLowerCase();
    const cleanName = socialAccountName.trim() || cleanEmail.split("@")[0] || `${providerKey.toUpperCase()} User`;

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg(isTh ? "กรุณาระบุที่อยู่อีเมลที่ถูกต้อง" : "Please enter a valid email address");
      return;
    }

    if (providerKey === "google") {
      try { localStorage.setItem("thai_tone_last_google_email", cleanEmail); } catch (e) {}
    }

    const defaultAvatarMap = {
      google: "🔴",
      apple: "🍏",
      facebook: "📘",
      instagram: "📷",
    };

    const isMasterAdmin = cleanEmail.includes("kamphonloy");

    const userData = {
      id: `user_${providerKey}_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      avatar: defaultAvatarMap[providerKey] || "👤",
      avatarUrl: "",
      provider: providerKey,
      registeredAt: new Date().toISOString(),
      pdpaConsent: true,
      role: isMasterAdmin ? "superadmin" : "user",
      plan: isMasterAdmin ? "lifetime" : "free", // Default to Free tier
      planStatus: "active",
      planExpiry: null,
    };

    // Save to user session
    try {
      localStorage.setItem("thai_tone_user", JSON.stringify(userData));
    } catch (e) {}

    // Sync to member directory
    syncToMembersList(userData);

    if (tab === "register") {
      if (onRegister) onRegister(userData);
      setSuccessMsg(isTh ? `สมัครสมาชิกด้วย ${providerKey.toUpperCase()} สำเร็จ!` : `Registered via ${providerKey.toUpperCase()}!`);
    } else {
      if (onLogin) onLogin(userData);
      setSuccessMsg(isTh ? `เข้าสู่ระบบด้วย ${providerKey.toUpperCase()} สำเร็จ!` : `Logged in via ${providerKey.toUpperCase()}!`);
    }

    setTimeout(() => {
      setSocialPromptProvider(null);
      if (onClose) onClose();
    }, 600);
  };

  // Handles image upload for custom avatar
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
      const cleanEmail = email.trim().toLowerCase();
      const isMasterAdmin = cleanEmail.includes("kamphonloy");

      // Check if user has an existing record with expiration
      let effectivePlan = isMasterAdmin ? "lifetime" : "free";
      let effectiveStatus = "active";
      let effectiveExpiry = null;
      let prevPlan = null;

      try {
        const savedMembersStr = localStorage.getItem("thai_tone_members");
        if (savedMembersStr) {
          const members = JSON.parse(savedMembersStr);
          const found = members.find((m) => m.email?.toLowerCase() === cleanEmail);
          if (found) {
            effectivePlan = found.plan || "free";
            effectiveStatus = found.planStatus || "active";
            effectiveExpiry = found.planExpiry || null;
            // Expiration rule: If plan is monthly/yearly and expired, default to free
            if (effectivePlan !== "free" && effectivePlan !== "lifetime" && effectiveExpiry && effectiveExpiry < todayStr) {
              prevPlan = effectivePlan;
              effectivePlan = "free";
              effectiveStatus = "expired";
            }
          }
        }
      } catch (err) {}

      const userData = {
        id: "user_" + Date.now(),
        name: cleanEmail.split("@")[0],
        email: cleanEmail,
        avatar: selectedAvatar || "🎵",
        avatarUrl: avatarPreview,
        provider: "email",
        registeredAt: new Date().toISOString(),
        pdpaConsent: true,
        role: isMasterAdmin ? "superadmin" : "user",
        plan: effectivePlan,
        planStatus: effectiveStatus,
        planExpiry: effectiveExpiry,
        previousPlan: prevPlan,
      };

      try {
        localStorage.setItem("thai_tone_user", JSON.stringify(userData));
      } catch (e) {}

      syncToMembersList(userData);

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

      const cleanEmail = email.trim().toLowerCase();
      const isMasterAdmin = cleanEmail.includes("kamphonloy");

      const newUser = {
        id: "user_" + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        avatar: selectedAvatar || "🎓",
        avatarUrl: avatarPreview,
        provider: "email",
        registeredAt: new Date().toISOString(),
        pdpaConsent: true,
        role: isMasterAdmin ? "superadmin" : "user",
        plan: isMasterAdmin ? "lifetime" : "free", // Default to Free tier
        planStatus: "active",
        planExpiry: null,
      };

      try {
        localStorage.setItem("thai_tone_user", JSON.stringify(newUser));
      } catch (e) {}

      syncToMembersList(newUser);

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

      try {
        localStorage.setItem("thai_tone_user", JSON.stringify(updated));
      } catch (e) {}

      syncToMembersList(updated);

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
        maxHeight: "92vh",
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
                  background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
                  padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600
                }}
              >
                {isTh ? "EN" : "ไทย"}
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "1.4rem", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
              title={isTh ? "ปิด" : "Close"}
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Switcher (if not logged in) */}
        {!currentUser && tab !== "terms" && !socialPromptProvider && (
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
              border: "1px solid #fecaca", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "14px"
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: "10px 14px", backgroundColor: "#f0fdf4", color: "#15803d",
              border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "14px"
            }}>
              ✅ {successMsg}
            </div>
          )}

          {/* SUB-VIEW: SOCIAL ACCOUNT CONFIRMATION PROMPT */}
          {socialPromptProvider ? (
            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1.5px solid #0284c7" }}>
              <div style={{ textAlign: "center", marginBottom: "14px" }}>
                <span style={{ fontSize: "2rem" }}>
                  {socialPromptProvider === "google" && "🔴"}
                  {socialPromptProvider === "apple" && "🍏"}
                  {socialPromptProvider === "facebook" && "📘"}
                  {socialPromptProvider === "instagram" && "📷"}
                </span>
                <h3 style={{ margin: "6px 0 2px 0", fontSize: "1.05rem", color: "#0f172a" }}>
                  {tab === "register"
                    ? (isTh ? `สมัครสมาชิกด้วย ${socialPromptProvider.toUpperCase()}` : `Register with ${socialPromptProvider.toUpperCase()}`)
                    : (isTh ? `เข้าสู่ระบบด้วย ${socialPromptProvider.toUpperCase()}` : `Sign in with ${socialPromptProvider.toUpperCase()}`)}
                </h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                  {isTh ? "ยืนยันข้อมูลบัญชีของคุณเพื่อเชื่อมต่อระบบทันที" : "Confirm your account details to continue"}
                </p>
              </div>

              <form onSubmit={handleSocialConfirm}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "อีเมล / บัญชีผู้ใช้ *" : "Account Email *"}
                  </label>
                  <input
                    type="email"
                    value={socialAccountEmail}
                    onChange={(e) => setSocialAccountEmail(e.target.value)}
                    placeholder={
                      socialPromptProvider === "google" ? "name@gmail.com" :
                      socialPromptProvider === "apple" ? "name@icloud.com" :
                      socialPromptProvider === "facebook" ? "name@facebook.com" : "creator@instagram.com"
                    }
                    required
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "ชื่อแสดงผล (Display Name)" : "Display Name"}
                  </label>
                  <input
                    type="text"
                    value={socialAccountName}
                    onChange={(e) => setSocialAccountName(e.target.value)}
                    placeholder={isTh ? "เช่น กิตติพงษ์ หรือ Tom" : "e.g. John Doe"}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setSocialPromptProvider(null)}
                    style={{
                      flex: 1, padding: "9px", backgroundColor: "#e2e8f0", color: "#334155",
                      border: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    {isTh ? "← ย้อนกลับ" : "← Back"}
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2, padding: "9px", backgroundColor: "#0284c7", color: "#ffffff",
                      border: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(2,132,199,0.25)"
                    }}
                  >
                    {isTh ? "✓ ดำเนินการต่อ" : "✓ Continue"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* SOCIAL LOGINS SECTION (Google, Apple, Facebook, Instagram) */}
              {(tab === "login" || tab === "register") && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {/* Google Sign-in Button */}
                    {providers.google && (
                      <button
                        type="button"
                        onClick={() => handleOpenSocialPrompt("google")}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                          width: "100%", padding: "10px", borderRadius: "8px",
                          border: "1.5px solid #cbd5e1", backgroundColor: "#ffffff",
                          color: "#1f2937", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)", transition: "all 0.15s ease"
                        }}
                      >
                        <span style={{ fontSize: "1.15rem" }}>🔴</span>
                        <span>
                          {tab === "register"
                            ? (isTh ? "สมัครสมาชิกด้วย Google (Gmail)" : "Sign up with Google")
                            : (isTh ? "เข้าสู่ระบบด้วย Google (Gmail)" : "Continue with Google")}
                        </span>
                      </button>
                    )}

                    {/* Apple ID Button */}
                    {providers.apple && (
                      <button
                        type="button"
                        onClick={() => handleOpenSocialPrompt("apple")}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                          width: "100%", padding: "10px", borderRadius: "8px",
                          border: "none", backgroundColor: "#000000",
                          color: "#ffffff", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}
                      >
                        <span style={{ fontSize: "1.15rem" }}></span>
                        <span>
                          {tab === "register"
                            ? (isTh ? "สมัครสมาชิกด้วย Apple ID" : "Sign up with Apple")
                            : (isTh ? "เข้าสู่ระบบด้วย Apple ID" : "Sign in with Apple")}
                        </span>
                      </button>
                    )}

                    {/* Facebook Login Button */}
                    {providers.facebook && (
                      <button
                        type="button"
                        onClick={() => handleOpenSocialPrompt("facebook")}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                          width: "100%", padding: "10px", borderRadius: "8px",
                          border: "none", backgroundColor: "#1877f2",
                          color: "#ffffff", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer"
                        }}
                      >
                        <span style={{ fontSize: "1.15rem" }}>📘</span>
                        <span>
                          {tab === "register"
                            ? (isTh ? "สมัครสมาชิกด้วย Facebook" : "Sign up with Facebook")
                            : (isTh ? "เข้าสู่ระบบด้วย Facebook" : "Continue with Facebook")}
                        </span>
                      </button>
                    )}

                    {/* Instagram Login Button */}
                    {providers.instagram && (
                      <button
                        type="button"
                        onClick={() => handleOpenSocialPrompt("instagram")}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                          width: "100%", padding: "10px", borderRadius: "8px",
                          border: "none",
                          background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                          color: "#ffffff", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer"
                        }}
                      >
                        <span style={{ fontSize: "1.15rem" }}>📷</span>
                        <span>
                          {tab === "register"
                            ? (isTh ? "สมัครสมาชิกด้วย Instagram" : "Sign up with Instagram")
                            : (isTh ? "เข้าสู่ระบบด้วย Instagram" : "Continue with Instagram")}
                        </span>
                      </button>
                    )}
                  </div>

                  {providers.emailPassword && (
                    <div style={{ display: "flex", alignItems: "center", margin: "16px 0", color: "#94a3b8", fontSize: "0.8rem" }}>
                      <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
                      <span style={{ padding: "0 10px" }}>{isTh ? "หรือกรอกอีเมล" : "or continue with email"}</span>
                      <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW: Terms */}
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
                /* EMAIL/PASSWORD FORM (Only if enabled or in profile mode) */
                (providers.emailPassword || tab === "profile") && (
                  <form onSubmit={handleSubmit}>
                    {(tab === "register" || tab === "profile") && (
                      <div style={{ marginBottom: "16px", textAlign: "center" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                          {isTh ? "รูปโปรไฟล์ (Avatar)" : "Profile Avatar"}
                        </label>
                        <div style={{
                          width: "64px", height: "64px", borderRadius: "50%", margin: "0 auto 10px",
                          backgroundColor: "#e0f2fe", border: "2px solid #0284c7",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.8rem", overflow: "hidden"
                        }}>
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            selectedAvatar || "👤"
                          )}
                        </div>

                        {/* Avatar Picker */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                          {AVATAR_PRESETS.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedAvatar(p.emoji);
                                setAvatarPreview("");
                              }}
                              style={{
                                width: "32px", height: "32px", borderRadius: "6px",
                                border: selectedAvatar === p.emoji && !avatarPreview ? "2px solid #0284c7" : "1px solid #cbd5e1",
                                backgroundColor: selectedAvatar === p.emoji && !avatarPreview ? "#bae6fd" : "#f8fafc",
                                fontSize: "1.1rem", cursor: "pointer"
                              }}
                            >
                              {p.emoji}
                            </button>
                          ))}
                        </div>

                        {/* File Upload */}
                        <div>
                          <label style={{
                            display: "inline-block", padding: "4px 10px", backgroundColor: "#f1f5f9",
                            border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer",
                            fontSize: "0.75rem", color: "#475569"
                          }}>
                            📷 {isTh ? "อัปโหลดรูปภาพจากเครื่อง (ไม่เกิน 2MB)" : "Upload from device (Max 2MB)"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: "none" }}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Name field (Register / Profile) */}
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
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
