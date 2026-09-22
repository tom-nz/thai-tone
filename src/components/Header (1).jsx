import React, { useState } from "react";
import AuthModal from "./AuthModal";
import AdminDashboard from "./AdminDashboard";

function Header({
  viewLayout,
  setViewLayout,
  setShowApiInput,
  apiKey,
  openDisplayWindow,
  user = null,
  onOpenAuthModal,
  onLogout,
  lang: propLang,
  setLang: propSetLang,
  onUpdateProfile,
  onDeleteAccount,
}) {
  const [internalLang, setInternalLang] = useState("th");
  const [internalUser, setInternalUser] = useState(() => {
    try {
      const saved = localStorage.getItem("thai_tone_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const lang = propLang || internalLang;
  const setLang = propSetLang || setInternalLang;
  const currentUser = user !== undefined && user !== null ? user : internalUser;
  const isTh = lang === "th";

  // Check if current user is an admin
  const isAdmin =
    Boolean(currentUser?.role === "admin") ||
    Boolean(currentUser?.email && currentUser.email.toLowerCase().includes("kamphonloy")) ||
    Boolean(currentUser?.email && currentUser.email.toLowerCase().includes("admin"));

  const handleOpenAuth = () => {
    if (onOpenAuthModal) {
      onOpenAuthModal();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      setInternalUser(null);
      try {
        localStorage.removeItem("thai_tone_user");
      } catch (e) {
        console.error(e);
      }
    }
    setShowProfileMenu(false);
  };

  const handleLoginSuccess = (userData) => {
    setInternalUser(userData);
    try {
      localStorage.setItem("thai_tone_user", JSON.stringify(userData));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <header
        className="app-header notranslate"
        translate="no"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          backgroundColor: "#1e293b",
          color: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          flexWrap: "wrap",
          gap: "12px",
          fontFamily: "'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.5rem" }}>🎼</span>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.2px" }}>
            {isTh ? "ระบบวิเคราะห์และผันวรรณยุกต์ไทย" : "Thai Tone & Staff Notation"}
          </h1>
        </div>

        {/* Right Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* View Modes */}
          {setViewLayout && (
            <div style={{ display: "flex", backgroundColor: "#334155", borderRadius: "6px", padding: "2px" }}>
              <button
                type="button"
                onClick={() => setViewLayout("standard")}
                style={{
                  padding: "5px 10px", border: "none", borderRadius: "4px", cursor: "pointer",
                  backgroundColor: viewLayout === "standard" ? "#2563eb" : "transparent",
                  color: "#fff", fontSize: "0.82rem", fontWeight: 500,
                }}
              >
                {isTh ? "ปกติ" : "Standard"}
              </button>
              <button
                type="button"
                onClick={() => setViewLayout("split")}
                style={{
                  padding: "5px 10px", border: "none", borderRadius: "4px", cursor: "pointer",
                  backgroundColor: viewLayout === "split" ? "#2563eb" : "transparent",
                  color: "#fff", fontSize: "0.82rem", fontWeight: 500,
                }}
              >
                {isTh ? "สองจอ (Split)" : "Split"}
              </button>
              <button
                type="button"
                onClick={() => setViewLayout("present")}
                style={{
                  padding: "5px 10px", border: "none", borderRadius: "4px", cursor: "pointer",
                  backgroundColor: viewLayout === "present" ? "#2563eb" : "transparent",
                  color: "#fff", fontSize: "0.82rem", fontWeight: 500,
                }}
              >
                {isTh ? "เฉพาะบอร์ด" : "Board"}
              </button>
            </div>
          )}

          {/* Dual Monitor Button */}
          {openDisplayWindow && (
            <button
              type="button"
              onClick={openDisplayWindow}
              style={{
                padding: "6px 11px", backgroundColor: "#0d9488", color: "#fff",
                border: "none", borderRadius: "6px", cursor: "pointer",
                fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600,
              }}
            >
              🖥️ {isTh ? "หน้าจอแยก" : "Dual Screen"}
            </button>
          )}

          {/* API Key Button */}
          {setShowApiInput && (
            <button
              type="button"
              onClick={() => setShowApiInput(true)}
              style={{
                padding: "6px 11px", backgroundColor: apiKey ? "#16a34a" : "#475569",
                color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer",
                fontSize: "0.82rem", fontWeight: 600,
              }}
            >
              {apiKey ? (isTh ? "🔑 Key แล้ว" : "🔑 Key Active") : (isTh ? "⚙️ ตั้งค่า Key" : "⚙️ API Key")}
            </button>
          )}

          {/* 🌐 Language Switcher */}
          <button
            type="button"
            onClick={() => setLang(isTh ? "en" : "th")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "5px 10px", borderRadius: "6px", border: "1.5px solid #0284c7",
              background: isTh ? "#0f172a" : "#1e293b", color: "#fff",
              fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
            }}
            title={isTh ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
          >
            <span>🌐</span>
            <span style={{ color: isTh ? "#38bdf8" : "#94a3b8" }}>TH</span>
            <span style={{ color: "#64748b" }}>/</span>
            <span style={{ color: !isTh ? "#4ade80" : "#94a3b8" }}>EN</span>
          </button>

          {/* 👤 Auth & User Dropdown */}
          <div style={{ position: "relative" }}>
            {currentUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  style={{
                    display: "flex", alignItems: "center", gap: "7px",
                    background: "#334155", border: "1.5px solid #0284c7",
                    borderRadius: "20px", padding: "3px 10px 3px 4px",
                    cursor: "pointer", color: "#fff",
                  }}
                  title={isTh ? "จัดการบัญชี" : "Account Menu"}
                >
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    backgroundColor: "#0284c7", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", overflow: "hidden",
                  }}>
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      currentUser.avatar || "👤"
                    )}
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {currentUser.name || currentUser.email?.split("@")[0] || "User"}
                  </span>
                  {isAdmin && (
                    <span style={{ backgroundColor: "#f59e0b", color: "#000", fontSize: "0.65rem", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                      ADMIN
                    </span>
                  )}
                  <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>▼</span>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div style={{
                    position: "absolute", top: "40px", right: 0,
                    backgroundColor: "#ffffff", color: "#1e293b",
                    borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
                    border: "1px solid #e2e8f0", width: "210px", zIndex: 1000, overflow: "hidden",
                  }}>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>
                        {currentUser.name || "User"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {currentUser.email}
                      </div>
                    </div>

                    {/* Admin Dashboard Entry (Visible only to Admin) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setIsAdminDashboardOpen(true);
                        }}
                        style={{
                          width: "100%", padding: "9px 14px", textAlign: "left",
                          background: "#fef3c7", border: "none", borderBottom: "1px solid #fde68a",
                          fontSize: "0.82rem", color: "#92400e", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "8px", fontWeight: 700,
                        }}
                      >
                        <span>🛡️</span> {isTh ? "แผงควบคุม Admin" : "Admin Dashboard"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setIsAuthModalOpen(true);
                      }}
                      style={{
                        width: "100%", padding: "9px 14px", textAlign: "left",
                        background: "none", border: "none", fontSize: "0.82rem",
                        color: "#334155", cursor: "pointer", display: "flex",
                        alignItems: "center", gap: "8px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span>👤</span> {isTh ? "แก้ไขข้อมูลส่วนตัว" : "Edit Profile"}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: "100%", padding: "9px 14px", textAlign: "left",
                        background: "none", border: "none", borderTop: "1px solid #f1f5f9",
                        fontSize: "0.82rem", color: "#dc2626", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "8px", fontWeight: 600,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <span>🚪</span> {isTh ? "ออกจากระบบ" : "Sign Out"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenAuth}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 14px", backgroundColor: "#0284c7", color: "#ffffff",
                  border: "none", borderRadius: "6px", cursor: "pointer",
                  fontSize: "0.83rem", fontWeight: 700, boxShadow: "0 2px 4px rgba(2,132,199,0.3)",
                }}
              >
                <span>👤</span>
                <span>{isTh ? "เข้าสู่ระบบ / สมัคร" : "Sign In / Register"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLoginSuccess}
        onRegister={handleLoginSuccess}
        onUpdateProfile={(updated) => {
          handleLoginSuccess(updated);
          if (onUpdateProfile) onUpdateProfile(updated);
        }}
        onDeleteAccount={(id) => {
          handleLogout();
          if (onDeleteAccount) onDeleteAccount(id);
        }}
        lang={lang}
        setLang={setLang}
      />

      {/* Admin Dashboard Modal (Admin Only) */}
      <AdminDashboard
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        currentUser={currentUser}
        lang={lang}
      />
    </>
  );
}

export default Header;
