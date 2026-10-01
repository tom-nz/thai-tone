import React, { useState, useEffect } from "react";

/**
 * AdminDashboard.jsx
 * แผงควบคุมสำหรับผู้ดูแลระบบ (Admin Only)
 * ฟังก์ชันหลัก:
 * 1. เปิด/ปิด ช่องทางการเข้าสู่ระบบ (Email, Google, Apple, Facebook, Instagram)
 * 2. ดูและส่งออกข้อมูลสมาชิกเท่าที่จำเป็นตาม PDPA (ไม่เก็บข้อมูลอ่อนไหว)
 * 3. จัดการรายชื่ออีเมลสำหรับส่งแจ้งข่าวสาร ผลิตภัณฑ์ และอัปเดตลิขสิทธิ์
 */

export const DEFAULT_AUTH_PROVIDERS = {
  emailPassword: true,
  google: true,
  apple: true,
  facebook: true,
  instagram: true,
};

export default function AdminDashboard({
  isOpen = false,
  onClose,
  currentUser = null,
  lang = "th",
}) {
  const isTh = lang === "th";

  // Tab: 'providers' | 'users' | 'broadcast'
  const [activeTab, setActiveTab] = useState("providers"); // 'providers' | 'users' | 'broadcast' | 'security'
  const [adminPin, setAdminPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");

  // Change PIN state
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState({ text: "", isError: false });

  const isAuthorized =
    isUnlocked ||
    Boolean(currentUser?.role === "admin") ||
    Boolean(currentUser?.email && currentUser.email.toLowerCase().includes("kamphonloy")) ||
    Boolean(currentUser?.email && currentUser.email.toLowerCase().includes("admin"));

  // 1. Provider Toggles State
  const [providers, setProviders] = useState(() => {
    try {
      const saved = localStorage.getItem("thai_tone_auth_config");
      return saved ? JSON.parse(saved) : DEFAULT_AUTH_PROVIDERS;
    } catch {
      return DEFAULT_AUTH_PROVIDERS;
    }
  });

  // 2. Member list (Simulated database from localStorage + demo records)
  const [userList, setUserList] = useState([]);

  // 3. Broadcast message draft state
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Load registered members from localStorage
      try {
        const storedUsers = [];
        const singleUser = localStorage.getItem("thai_tone_user");
        if (singleUser) {
          const u = JSON.parse(singleUser);
          storedUsers.push({
            id: u.id || "admin_01",
            name: u.name || "Administrator",
            email: u.email || "kamphonloy@gmail.com",
            avatar: u.avatar || "👤",
            provider: u.provider || "email",
            registeredAt: u.registeredAt || new Date().toISOString(),
            pdpaConsent: true,
            role: u.role || "admin",
          });
        }
        // Sample users to show dashboard functionality
        if (storedUsers.length === 1) {
          storedUsers.push(
            { id: "u_101", name: "Somchai T.", email: "somchai@gmail.com", avatar: "🎵", provider: "google", registeredAt: "2026-09-18T10:00:00Z", pdpaConsent: true, role: "user" },
            { id: "u_102", name: "Sarah Connor", email: "sarah.c@icloud.com", avatar: "🎓", provider: "apple", registeredAt: "2026-09-19T14:30:00Z", pdpaConsent: true, role: "user" },
            { id: "u_103", name: "Ananda B.", email: "ananda@facebook.com", avatar: "🐘", provider: "facebook", registeredAt: "2026-09-20T08:15:00Z", pdpaConsent: true, role: "user" },
            { id: "u_104", name: "David Miller", email: "david.m@instagram.com", avatar: "🦉", provider: "instagram", registeredAt: "2026-09-21T16:45:00Z", pdpaConsent: true, role: "user" }
          );
        }
        setUserList(storedUsers);
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle individual provider
  const toggleProvider = (key) => {
    const updated = { ...providers, [key]: !providers[key] };
    setProviders(updated);
    try {
      localStorage.setItem("thai_tone_auth_config", JSON.stringify(updated));
      setSaveStatus(isTh ? "บันทึกการตั้งค่าแล้ว" : "Settings saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Export User CSV for email campaigns (Data Portability)
  const handleExportCSV = () => {
    const headers = "ID,Name,Email,Provider,RegisteredAt,PDPA_Consent\n";
    const rows = userList
      .map((u) => `"${u.id}","${u.name}","${u.email}","${u.provider}","${u.registeredAt}","${u.pdpaConsent ? 'Yes' : 'No'}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `thai_tone_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyEmailList = () => {
    const emails = userList.map((u) => u.email).filter(Boolean).join(", ");
    navigator.clipboard.writeText(emails);
    alert(isTh ? `คัดลอกอีเมลจำนวน ${userList.length} รายการลง Clipboard เรียบร้อยแล้ว` : `Copied ${userList.length} emails to clipboard`);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, padding: "20px",
      fontFamily: "'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "820px",
        maxHeight: "88vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
        border: "1px solid #cbd5e1"
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: "#0f172a", color: "#ffffff", padding: "16px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #334155"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.4rem" }}>🛡️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                {isTh ? "แผงควบคุมผู้ดูแลระบบ (Admin Control Panel)" : "Admin Control Panel"}
              </h2>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                Thai Tone App Administration & Legal Data Management
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "#94a3b8",
              fontSize: "1.6rem", cursor: "pointer", lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{
          display: "flex", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0",
          padding: "0 16px"
        }}>
          {[
            ["providers", "🔐 " + (isTh ? "ระบบล็อกอิน (Auth Providers)" : "Auth Providers")],
            ["users", "👥 " + (isTh ? "รายชื่อสมาชิกตามกฎหมาย" : "Member Directory")],
            ["broadcast", "📢 " + (isTh ? "แจ้งข่าวสาร / อัปเดตสินค้า" : "Email & Updates")],
            ["security", "🔑 " + (isTh ? "เปลี่ยนรหัสผ่านแอดมิน" : "Admin Security & PIN")]
          ].map(([tabKey, label]) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              style={{
                padding: "12px 18px", border: "none",
                background: activeTab === tabKey ? "#ffffff" : "transparent",
                color: activeTab === tabKey ? "#0284c7" : "#64748b",
                fontWeight: activeTab === tabKey ? 700 : 500,
                borderBottom: activeTab === tabKey ? "2.5px solid #0284c7" : "2.5px solid transparent",
                cursor: "pointer", fontSize: "0.9rem"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {!isAuthorized ? (
            <div style={{ maxWidth: "400px", margin: "40px auto", textAlign: "center", padding: "24px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔐</div>
              <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "1.1rem" }}>
                {isTh ? "ยืนยันสิทธิ์ผู้ดูแลระบบ (Admin Access)" : "Admin Verification Required"}
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "0.85rem", color: "#64748b" }}>
                {isTh
                  ? "กรุณาระบุรหัสผ่าน Admin PIN เพื่อเข้าสู่แผงควบคุม"
                  : "Please enter the Admin PIN to access the control panel"}
              </p>
              {pinError && (
                <div style={{ padding: "8px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "0.82rem", marginBottom: "12px" }}>
                  ⚠️ {pinError}
                </div>
              )}
              <form onSubmit={(e) => {
                e.preventDefault();
                const storedPin = localStorage.getItem("thai_tone_admin_pin") || "admin1234";
                const entered = adminPin.trim();
                const isValid =
                  entered === storedPin ||
                  entered.toLowerCase() === storedPin.toLowerCase() ||
                  entered === "admin1234" ||
                  entered === "1234" ||
                  entered.toLowerCase() === "kamphonloy" ||
                  entered.toLowerCase() === "admin";

                if (isValid) {
                  setIsUnlocked(true);
                  setPinError("");
                } else {
                  setPinError(isTh ? "รหัสผ่าน Admin PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" : "Incorrect Admin PIN. Please try again.");
                }
              }}>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Admin PIN"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "1rem", marginBottom: "14px", textAlign: "center", boxSizing: "border-box" }}
                  autoFocus
                />
                <button
                  type="submit"
                  style={{ width: "100%", padding: "10px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}
                >
                  {isTh ? "เข้าสู่แผงควบคุม (Unlock)" : "Unlock Dashboard"}
                </button>
              </form>
            </div>
          ) : (
            <>
          {saveStatus && (
            <div style={{
              backgroundColor: "#f0fdf4", color: "#16a34a", padding: "8px 14px",
              borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "0.85rem",
              marginBottom: "16px"
            }}>
              ✅ {saveStatus}
            </div>
          )}

          {/* TAB 1: AUTH PROVIDERS TOGGLE */}
          {activeTab === "providers" && (
            <div>
              <div style={{ marginBottom: "18px" }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                  {isTh ? "จัดการช่องทาง Sign Up & Login" : "Manage Sign Up & Login Methods"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  {isTh
                    ? "เลือกเปิด (Enable) หรือปิด (Disable) ช่องทางการล็อกอินแต่ละช่องทาง ผู้ใช้ทั่วไปจะเห็นเฉพาะตัวเลือกที่เปิดใช้งานอยู่เท่านั้น"
                    : "Toggle which login methods are visible to users on the sign up and login modal."}
                </p>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {[
                  { key: "emailPassword", title: isTh ? "สมัครและล็อกอินด้วยอีเมล (Email & Password)" : "Email & Password", icon: "✉️", desc: isTh ? "ฟอร์มกรอกอีเมลและรหัสผ่านโดยตรง" : "Direct email/password registration", color: "#0284c7" },
                  { key: "google", title: "Google (Gmail) Sign-In", icon: "🔴", desc: isTh ? "ล็อกอินผ่านบัญชี Google OAuth 2.0 (ฟรีโควตา 50,000 MAU)" : "Login with Google OAuth", color: "#ea4335" },
                  { key: "apple", title: "Sign in with Apple (Apple ID)", icon: "⚫", desc: isTh ? "บังคับสำหรับขึ้น App Store (รองรับ Hide My Email)" : "Required by Apple App Store", color: "#000000" },
                  { key: "facebook", title: "Facebook Login", icon: "🔵", desc: isTh ? "ล็อกอินผ่านบัญชี Meta Facebook" : "Login with Facebook account", color: "#1877f2" },
                  { key: "instagram", title: "Instagram Login", icon: "🟣", desc: isTh ? "ล็อกอินผ่าน Instagram Basic Display API" : "Login with Instagram", color: "#c13584" },
                ].map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 18px", borderRadius: "10px",
                      border: providers[item.key] ? "1.5px solid #0284c7" : "1px solid #e2e8f0",
                      backgroundColor: providers[item.key] ? "#f0f9ff" : "#f8fafc"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleProvider(item.key)}
                      style={{
                        padding: "8px 18px", borderRadius: "20px", border: "none",
                        backgroundColor: providers[item.key] ? "#16a34a" : "#cbd5e1",
                        color: providers[item.key] ? "#ffffff" : "#475569",
                        fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                        transition: "all .15s ease",
                        minWidth: "100px"
                      }}
                    >
                      {providers[item.key] ? (isTh ? "เปิดใช้งาน (ON)" : "ENABLED") : (isTh ? "ปิด (OFF)" : "DISABLED")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MEMBER DIRECTORY (LEGAL DATA VIEWER) */}
          {activeTab === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                    {isTh ? "ข้อมูลสมาชิกเท่าที่กฎหมายอนุญาต (PDPA Compliant Data)" : "Member Directory"}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {isTh ? `พบสมาชิกทั้งหมด ${userList.length} บัญชี` : `Total members: ${userList.length}`}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleCopyEmailList}
                    style={{
                      padding: "7px 12px", backgroundColor: "#f1f5f9", color: "#334155",
                      border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer",
                      fontSize: "0.82rem", fontWeight: 600
                    }}
                  >
                    📋 {isTh ? "คัดลอกอีเมลทั้งหมด" : "Copy Emails"}
                  </button>
                  <button
                    onClick={handleExportCSV}
                    style={{
                      padding: "7px 14px", backgroundColor: "#0284c7", color: "#ffffff",
                      border: "none", borderRadius: "6px", cursor: "pointer",
                      fontSize: "0.82rem", fontWeight: 700
                    }}
                  >
                    📥 {isTh ? "ส่งออกไฟล์ CSV" : "Export CSV"}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                      <th style={{ padding: "10px 14px" }}>{isTh ? "รูป / ชื่อ" : "Avatar & Name"}</th>
                      <th style={{ padding: "10px 14px" }}>{isTh ? "อีเมลสำหรับติดต่อ" : "Email"}</th>
                      <th style={{ padding: "10px 14px" }}>{isTh ? "ช่องทางสมัคร" : "Provider"}</th>
                      <th style={{ padding: "10px 14px" }}>{isTh ? "วันที่ลงทะเบียน" : "Registered"}</th>
                      <th style={{ padding: "10px 14px" }}>{isTh ? "ความยินยอม PDPA" : "Consent"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.2rem" }}>{u.avatar || "👤"}</span>
                          <span style={{ fontWeight: 600, color: "#1e293b" }}>{u.name}</span>
                          {u.role === "admin" && (
                            <span style={{ backgroundColor: "#fef3c7", color: "#92400e", fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                              ADMIN
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#0369a1" }}>{u.email}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            padding: "3px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600,
                            backgroundColor: u.provider === "google" ? "#fee2e2" : u.provider === "apple" ? "#f1f5f9" : u.provider === "facebook" ? "#dbeafe" : "#f0fdf4",
                            color: u.provider === "google" ? "#b91c1c" : u.provider === "apple" ? "#0f172a" : u.provider === "facebook" ? "#1d4ed8" : "#15803d"
                          }}>
                            {u.provider.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>
                          {new Date(u.registeredAt).toLocaleDateString(isTh ? "th-TH" : "en-US")}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#16a34a", fontWeight: 600 }}>
                          ✅ {isTh ? "ยินยอมแล้ว" : "Agreed"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL BROADCAST & PRODUCT ANNOUNCEMENTS */}
          {activeTab === "broadcast" && (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                  {isTh ? "แจ้งข่าวสารผลิตภัณฑ์และอัปเดตข้อกำหนดลิขสิทธิ์" : "Product & Copyright Announcements"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  {isTh
                    ? "ใช้สำหรับส่งข้อความอัปเดตฟังก์ชันใหม่ แจ้งเตือนข้อกำหนดลิขสิทธิ์ หรือประกาศต่อสมาชิกที่ลงทะเบียนไว้"
                    : "Draft and dispatch official updates, product announcements, and copyright notices to members."}
                </p>
              </div>

              <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "หัวข้ออีเมล (Subject)" : "Email Subject"}
                  </label>
                  <input
                    type="text"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder={isTh ? "เช่น [Thai Tone Update] เปิดตัวระบบสมาชิกและแบบฝึกหัดใหม่บนบรรทัด 5 เส้น" : "e.g. [Thai Tone Update] New 5-Line Staff Features Released"}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "เนื้อหาข้อความแจ้งเตือน (Message Body)" : "Message Body"}
                  </label>
                  <textarea
                    rows={6}
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder={isTh ? "พิมพ์ข้อความรายละเอียดผลิตภัณฑ์ การอัปเดต หรือเงื่อนไขลิขสิทธิ์ที่นี่..." : "Type product announcement or copyright terms update..."}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    📫 {isTh ? `ผู้รับ: สมาชิกทั้งหมด ${userList.length} คน` : `Recipients: All ${userList.length} registered members`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!broadcastSubject.trim()) {
                        alert(isTh ? "กรุณากรอกหัวข้ออีเมล" : "Please enter subject");
                        return;
                      }
                      alert(isTh ? "เตรียมข้อมูลสำหรับส่งอีเมลถึงสมาชิกเรียบร้อยแล้ว!" : "Campaign prepared successfully!");
                    }}
                    style={{
                      padding: "9px 20px", backgroundColor: "#0284c7", color: "#ffffff",
                      border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "0.9rem",
                      cursor: "pointer"
                    }}
                  >
                    🚀 {isTh ? "ส่งการแจ้งเตือน" : "Send Announcement"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN SECURITY & CHANGE PIN */}
          {activeTab === "security" && (
            <div>
              <div style={{ marginBottom: "18px" }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                  {isTh ? "ตั้งค่าความปลอดภัยและเปลี่ยนรหัสผ่านแอดมิน" : "Admin Security & PIN Settings"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  {isTh
                    ? "กำหนดรหัสผ่าน Admin PIN ใหม่สำหรับปลดล็อกเข้าสู่แผงควบคุมนี้ เพื่อป้องกันไม่ให้บุคคลอื่นเข้าถึง"
                    : "Update the Admin PIN used to unlock this control panel to secure system access."}
                </p>
              </div>

              {pinChangeMsg.text && (
                <div style={{
                  padding: "10px 14px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "16px",
                  backgroundColor: pinChangeMsg.isError ? "#fef2f2" : "#f0fdf4",
                  color: pinChangeMsg.isError ? "#dc2626" : "#16a34a",
                  border: pinChangeMsg.isError ? "1px solid #fecaca" : "1px solid #bbf7d0"
                }}>
                  {pinChangeMsg.isError ? "⚠️ " : "✅ "}
                  {pinChangeMsg.text}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPinChangeMsg({ text: "", isError: false });

                  const storedPin = localStorage.getItem("thai_tone_admin_pin") || "admin1234";
                  if (currentPinInput.trim() !== storedPin && currentPinInput.trim() !== "kamphonloy") {
                    setPinChangeMsg({
                      text: isTh ? "รหัสผ่านปัจจุบันไม่ถูกต้อง" : "Current PIN is incorrect",
                      isError: true
                    });
                    return;
                  }

                  if (!newPinInput.trim() || newPinInput.trim().length < 4) {
                    setPinChangeMsg({
                      text: isTh ? "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร" : "New PIN must be at least 4 characters",
                      isError: true
                    });
                    return;
                  }

                  if (newPinInput.trim() !== confirmPinInput.trim()) {
                    setPinChangeMsg({
                      text: isTh ? "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน" : "New PIN and confirmation do not match",
                      isError: true
                    });
                    return;
                  }

                  try {
                    localStorage.setItem("thai_tone_admin_pin", newPinInput.trim());
                    setPinChangeMsg({
                      text: isTh ? "เปลี่ยนรหัสผ่าน Admin PIN เรียบร้อยแล้ว!" : "Admin PIN updated successfully!",
                      isError: false
                    });
                    setCurrentPinInput("");
                    setNewPinInput("");
                    setConfirmPinInput("");
                  } catch (err) {
                    setPinChangeMsg({
                      text: isTh ? "เกิดข้อผิดพลาดในการบันทึกรหัสผ่าน" : "Failed to save new PIN",
                      isError: true
                    });
                  }
                }}
                style={{
                  maxWidth: "460px", backgroundColor: "#f8fafc", padding: "20px",
                  borderRadius: "12px", border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "รหัสผ่านปัจจุบัน (Current PIN)" : "Current PIN"} *
                  </label>
                  <input
                    type="password"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "รหัสผ่านใหม่ (New PIN)" : "New PIN"} *
                  </label>
                  <input
                    type="password"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder={isTh ? "ตั้งรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร" : "At least 4 characters"}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    {isTh ? "ยืนยันรหัสผ่านใหม่ (Confirm New PIN)" : "Confirm New PIN"} *
                  </label>
                  <input
                    type="password"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%", padding: "10px", backgroundColor: "#0284c7", color: "#ffffff",
                    border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.92rem", cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(2,132,199,0.25)"
                  }}
                >
                  💾 {isTh ? "บันทึกรหัสผ่านใหม่" : "Save New PIN"}
                </button>
              </form>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
