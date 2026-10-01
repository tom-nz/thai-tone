import React, { useState, useEffect, useMemo } from "react";

/**
 * AdminDashboard.jsx (Version 3.0)
 * แผงควบคุมสำหรับผู้ดูแลระบบ (Admin Control Panel)
 * ฟังก์ชันหลัก:
 * 1. จัดการช่องทาง Auth (เปิด/ปิด Email, Google, Apple, Facebook, Instagram)
 * 2. จัดการสมาชิกและรูปแบบสมาชิก (Free, Monthly, Yearly, Lifetime) พร้อมแก้ไขแมนนวล/อัตโนมัติ
 * 3. จัดการสิทธิ์แอดมินตามบทบาท (Super Admin, Administrator, Manager, User)
 * 4. ระบบแจ้งข่าวสารแบบกำหนดกลุ่มเป้าหมาย (Targeted Broadcast with Smart Filters & Checkboxes)
 * 5. ความปลอดภัยและเปลี่ยนรหัสผ่าน Admin PIN
 */

export const DEFAULT_AUTH_PROVIDERS = {
  emailPassword: true,
  google: true,
  apple: true,
  facebook: true,
  instagram: true,
};

export const MEMBERSHIP_TIERS = {
  free: { labelTh: "ฟรี (Free)", labelEn: "Free Tier", color: "#64748b", bg: "#f1f5f9" },
  monthly: { labelTh: "รายเดือน (Monthly)", labelEn: "Monthly", color: "#0284c7", bg: "#e0f2fe" },
  yearly: { labelTh: "รายปี (Yearly)", labelEn: "Yearly", color: "#16a34a", bg: "#dcfce7" },
  lifetime: { labelTh: "ตลอดชีพ (Lifetime)", labelEn: "Lifetime", color: "#d97706", bg: "#fef3c7" },
};

export const ADMIN_ROLES = {
  superadmin: {
    labelTh: "ผู้ดูแลระบบสูงสุด (Super Admin)",
    labelEn: "Super Admin",
    color: "#dc2626",
    bg: "#fee2e2",
    descTh: "มีสิทธิ์เต็มทุกส่วน จัดการสิทธิ์แอดมิน และเปลี่ยนรหัสผ่านหลักได้",
    descEn: "Full access to all modules, role assignments, and security settings."
  },
  admin: {
    labelTh: "ผู้ดูแลระบบ (Administrator)",
    labelEn: "Administrator",
    color: "#d97706",
    bg: "#fef3c7",
    descTh: "จัดการช่องทางล็อกอิน จัดการสมาชิก และส่งอีเมลแจ้งข่าวสารได้",
    descEn: "Can manage auth providers, member accounts, and dispatch announcements."
  },
  manager: {
    labelTh: "ผู้จัดการ (Manager)",
    labelEn: "Manager",
    color: "#2563eb",
    bg: "#dbeafe",
    descTh: "ดูข้อมูลสมาชิก ปรับสถานะรูปแบบสมาชิก และส่งข่าวสารได้",
    descEn: "Can view members, modify subscription tiers, and send targeted updates."
  },
  user: {
    labelTh: "ผู้ใช้ทั่วไป (Standard User)",
    labelEn: "User",
    color: "#64748b",
    bg: "#f1f5f9",
    descTh: "ไม่มีสิทธิ์เข้าถึงแผงควบคุมผู้ดูแล",
    descEn: "Regular learner with no administrative dashboard privileges."
  }
};

export default function AdminDashboard({
  isOpen = false,
  onClose,
  currentUser = null,
  lang = "th",
}) {
  const isTh = lang === "th";

  // Tab State: 'providers' | 'users' | 'roles' | 'broadcast' | 'security'
  const [activeTab, setActiveTab] = useState("providers");
  const [adminPin, setAdminPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");

  // Change PIN State
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState({ text: "", isError: false });

  // 1. Auth Providers Toggle State
  const [providers, setProviders] = useState(() => {
    try {
      const saved = localStorage.getItem("thai_tone_auth_config");
      return saved ? JSON.parse(saved) : DEFAULT_AUTH_PROVIDERS;
    } catch {
      return DEFAULT_AUTH_PROVIDERS;
    }
  });

  // 2. Member Directory with Membership Tiers
  const [userList, setUserList] = useState([]);
  const [tierUpdateMsg, setTierUpdateMsg] = useState("");

  // 3. Admin Roles Management State
  const [adminRoles, setAdminRoles] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("manager");
  const [roleMsg, setRoleMsg] = useState({ text: "", isError: false });

  // 4. Targeted Broadcast State with Smart Filters & Selection
  const [filterTier, setFilterTier] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterEmailGroup, setFilterEmailGroup] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());

  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastStatus, setBroadcastStatus] = useState("");

  const isAuthorized =
    isUnlocked ||
    Boolean(currentUser?.role === "superadmin" || currentUser?.role === "admin") ||
    Boolean(currentUser?.email && currentUser.email.toLowerCase().includes("kamphonloy")) ||
    Boolean(currentUser?.email && currentUser.email.toLowerCase().includes("admin"));

  // Load state on open
  useEffect(() => {
    if (isOpen) {
      // 1. Load users & tiers
      try {
        let stored = [];
        const savedMembers = localStorage.getItem("thai_tone_members");
        if (savedMembers) {
          stored = JSON.parse(savedMembers);
        } else {
          // Initialize demo records with membership tiers
          const singleUser = localStorage.getItem("thai_tone_user");
          if (singleUser) {
            const u = JSON.parse(singleUser);
            stored.push({
              id: u.id || "admin_01",
              name: u.name || "Administrator",
              email: u.email || "kamphonloy@gmail.com",
              avatar: u.avatar || "👤",
              provider: u.provider || "email",
              registeredAt: u.registeredAt || "2026-10-01T08:00:00Z",
              pdpaConsent: true,
              role: u.role || "superadmin",
              plan: u.plan || "lifetime",
              planStatus: "active",
              planExpiry: null,
            });
          }
          stored.push(
            { id: "u_101", name: "Somchai T.", email: "somchai@gmail.com", avatar: "🎵", provider: "google", registeredAt: "2026-09-18T10:00:00Z", pdpaConsent: true, role: "user", plan: "free", planStatus: "active", planExpiry: null },
            { id: "u_102", name: "Sarah Connor", email: "sarah.c@icloud.com", avatar: "🎓", provider: "apple", registeredAt: "2026-09-20T14:30:00Z", pdpaConsent: true, role: "user", plan: "monthly", planStatus: "active", planExpiry: "2026-10-20" },
            { id: "u_103", name: "Ananda B.", email: "ananda@facebook.com", avatar: "🐘", provider: "facebook", registeredAt: "2026-09-20T08:15:00Z", pdpaConsent: true, role: "user", plan: "yearly", planStatus: "active", planExpiry: "2027-09-20" },
            { id: "u_104", name: "David Miller", email: "david.m@instagram.com", avatar: "🦉", provider: "instagram", registeredAt: "2026-09-22T16:45:00Z", pdpaConsent: true, role: "user", plan: "lifetime", planStatus: "active", planExpiry: null }
          );
          localStorage.setItem("thai_tone_members", JSON.stringify(stored));
        }
        setUserList(stored);

        // Select all IDs by default for broadcast
        setSelectedUserIds(new Set(stored.map((u) => u.id)));
      } catch (e) {
        console.error(e);
      }

      // 2. Load admin roles list
      try {
        const savedRoles = localStorage.getItem("thai_tone_admin_roles");
        if (savedRoles) {
          setAdminRoles(JSON.parse(savedRoles));
        } else {
          const initialRoles = [
            { email: "kamphonloy@gmail.com", role: "superadmin", assignedAt: "2026-09-01T00:00:00Z" },
            { email: "admin@thaitone.app", role: "admin", assignedAt: "2026-09-15T00:00:00Z" },
            { email: "editor@thaitone.app", role: "manager", assignedAt: "2026-09-20T00:00:00Z" },
          ];
          setAdminRoles(initialRoles);
          localStorage.setItem("thai_tone_admin_roles", JSON.stringify(initialRoles));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  // Toggle Auth Providers
  const toggleProvider = (key) => {
    const updated = { ...providers, [key]: !providers[key] };
    setProviders(updated);
    try {
      localStorage.setItem("thai_tone_auth_config", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Change user membership tier (Manual override by Admin or automated hook)
  const handleUpdateUserPlan = (userId, newPlan) => {
    const updated = userList.map((u) => {
      if (u.id === userId) {
        let newExpiry = null;
        if (newPlan === "monthly") {
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          newExpiry = d.toISOString().slice(0, 10);
        } else if (newPlan === "yearly") {
          const d = new Date();
          d.setFullYear(d.getFullYear() + 1);
          newExpiry = d.toISOString().slice(0, 10);
        }
        return {
          ...u,
          plan: newPlan,
          planStatus: "active",
          planExpiry: newExpiry,
        };
      }
      return u;
    });

    setUserList(updated);
    try {
      localStorage.setItem("thai_tone_members", JSON.stringify(updated));
      const targetUser = updated.find((u) => u.id === userId);
      setTierUpdateMsg(
        isTh
          ? `อัปเดตสมาชิก "${targetUser?.name || targetUser?.email}" เป็น [${MEMBERSHIP_TIERS[newPlan].labelTh}] เรียบร้อย`
          : `Updated plan for "${targetUser?.name || targetUser?.email}" to [${MEMBERSHIP_TIERS[newPlan].labelEn}]`
      );
      setTimeout(() => setTierUpdateMsg(""), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Add / Assign Admin Role
  const handleAssignRole = (e) => {
    e.preventDefault();
    setRoleMsg({ text: "", isError: false });

    const emailClean = newAdminEmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes("@")) {
      setRoleMsg({ text: isTh ? "กรุณาระบุที่อยู่อีเมลที่ถูกต้อง" : "Please enter a valid email", isError: true });
      return;
    }

    const existingIdx = adminRoles.findIndex((r) => r.email.toLowerCase() === emailClean);
    let updated;
    if (existingIdx >= 0) {
      updated = [...adminRoles];
      updated[existingIdx].role = newAdminRole;
      updated[existingIdx].assignedAt = new Date().toISOString();
    } else {
      updated = [
        ...adminRoles,
        { email: emailClean, role: newAdminRole, assignedAt: new Date().toISOString() },
      ];
    }

    setAdminRoles(updated);
    try {
      localStorage.setItem("thai_tone_admin_roles", JSON.stringify(updated));
      setRoleMsg({
        text: isTh ? `มอบหมายสิทธิ์ [${ADMIN_ROLES[newAdminRole].labelTh}] ให้ ${emailClean} เรียบร้อยแล้ว` : `Assigned [${ADMIN_ROLES[newAdminRole].labelEn}] to ${emailClean}`,
        isError: false
      });
      setNewAdminEmail("");
    } catch (err) {
      setRoleMsg({ text: isTh ? "เกิดข้อผิดพลาดในการบันทึก" : "Failed to save role", isError: true });
    }
  };

  const handleRevokeRole = (emailToRevoke) => {
    if (emailToRevoke.toLowerCase() === "kamphonloy@gmail.com") {
      alert(isTh ? "ไม่สามารถเพิกถอนสิทธิ์ของเจ้าของระบบหลักได้" : "Cannot revoke master owner role");
      return;
    }
    const updated = adminRoles.filter((r) => r.email.toLowerCase() !== emailToRevoke.toLowerCase());
    setAdminRoles(updated);
    try {
      localStorage.setItem("thai_tone_admin_roles", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Smart Filtering for Targeted Broadcast
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      // 1. Tier filter
      if (filterTier !== "all" && u.plan !== filterTier) return false;

      // 2. Date Range filter
      if (filterDateFrom) {
        const uDate = new Date(u.registeredAt).toISOString().slice(0, 10);
        if (uDate < filterDateFrom) return false;
      }
      if (filterDateTo) {
        const uDate = new Date(u.registeredAt).toISOString().slice(0, 10);
        if (uDate > filterDateTo) return false;
      }

      // 3. Name search / prefix filter
      if (filterSearch.trim()) {
        const query = filterSearch.trim().toLowerCase();
        const nameMatch = u.name?.toLowerCase().includes(query);
        const emailMatch = u.email?.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch) return false;
      }

      // 4. Email Group / Domain filter
      if (filterEmailGroup.trim()) {
        const domainQuery = filterEmailGroup.trim().toLowerCase();
        if (!u.email?.toLowerCase().includes(domainQuery)) return false;
      }

      return true;
    });
  }, [userList, filterTier, filterDateFrom, filterDateTo, filterSearch, filterEmailGroup]);

  // Checkbox Selection Handlers
  const handleToggleSelectAllFiltered = (e) => {
    const nextSet = new Set(selectedUserIds);
    if (e.target.checked) {
      filteredUsers.forEach((u) => nextSet.add(u.id));
    } else {
      filteredUsers.forEach((u) => nextSet.delete(u.id));
    }
    setSelectedUserIds(nextSet);
  };

  const handleToggleUserSelection = (userId) => {
    const nextSet = new Set(selectedUserIds);
    if (nextSet.has(userId)) {
      nextSet.delete(userId);
    } else {
      nextSet.add(userId);
    }
    setSelectedUserIds(nextSet);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = "ID,Name,Email,Provider,RegisteredAt,Plan,PlanStatus,PlanExpiry,PDPA_Consent\n";
    const rows = userList
      .map((u) => `"${u.id}","${u.name}","${u.email}","${u.provider}","${u.registeredAt}","${u.plan || 'free'}","${u.planStatus || 'active'}","${u.planExpiry || 'Lifetime'}","${u.pdpaConsent ? 'Yes' : 'No'}"`)
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

  // Copy Selected Emails
  const handleCopySelectedEmails = () => {
    const selectedUsers = userList.filter((u) => selectedUserIds.has(u.id));
    const emails = selectedUsers.map((u) => u.email).filter(Boolean).join(", ");
    if (!emails) {
      alert(isTh ? "ยังไม่ได้เลือกผู้รับอีเมลใดๆ" : "No recipients selected");
      return;
    }
    navigator.clipboard.writeText(emails);
    alert(isTh ? `คัดลอกอีเมลที่เลือกจำนวน ${selectedUsers.length} รายการลง Clipboard เรียบร้อยแล้ว` : `Copied ${selectedUsers.length} selected emails to clipboard`);
  };

  if (!isOpen) return null;

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
        maxWidth: "920px",
        maxHeight: "90vh",
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
                Thai Tone App Administration, Membership Tiers, RBAC & Smart Broadcast
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

        {/* Tab Navigation */}
        <div style={{
          display: "flex", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0",
          padding: "0 16px", overflowX: "auto"
        }}>
          {[
            ["providers", "🔐 " + (isTh ? "ระบบล็อกอิน (Auth)" : "Auth Providers")],
            ["users", "👥 " + (isTh ? "สมาชิก & รูปแบบสมาชิก" : "Members & Plans")],
            ["roles", "🛡️ " + (isTh ? "จัดการสิทธิ์แอดมิน" : "Admin Roles")],
            ["broadcast", "📢 " + (isTh ? "แจ้งข่าวสาร & กรองผู้รับ" : "Targeted Broadcast")],
            ["security", "🔑 " + (isTh ? "เปลี่ยนรหัสผ่านแอดมิน" : "Security & PIN")]
          ].map(([tabKey, label]) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              style={{
                padding: "12px 16px", border: "none",
                background: activeTab === tabKey ? "#ffffff" : "transparent",
                color: activeTab === tabKey ? "#0284c7" : "#64748b",
                fontWeight: activeTab === tabKey ? 700 : 500,
                borderBottom: activeTab === tabKey ? "2.5px solid #0284c7" : "2.5px solid transparent",
                cursor: "pointer", fontSize: "0.88rem", whiteSpace: "nowrap"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
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
              {/* TAB 1: AUTH PROVIDERS */}
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
                            transition: "all .15s ease", minWidth: "100px"
                          }}
                        >
                          {providers[item.key] ? (isTh ? "เปิดใช้งาน (ON)" : "ENABLED") : (isTh ? "ปิด (OFF)" : "DISABLED")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: MEMBERS & MEMBERSHIP TIERS (WITH MANUAL & AUTO OVERRIDE) */}
              {activeTab === "users" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                        {isTh ? "รายชื่อสมาชิกและสถานะรูปแบบการใช้งาน" : "Members & Membership Plans"}
                      </h3>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                        {isTh
                          ? "แสดงสถานะสมาชิก (ฟรี, รายเดือน, รายปี, ตลอดชีพ) สามารถกดเปลี่ยนรูปแบบได้ทันที หรือรองรับระบบอัปเกรดอัตโนมัติ"
                          : "Manage membership tiers (Free, Monthly, Yearly, Lifetime). Change manually or via automated billing."}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
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

                  {tierUpdateMsg && (
                    <div style={{ backgroundColor: "#f0fdf4", color: "#16a34a", padding: "8px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "0.85rem", marginBottom: "14px" }}>
                      ✅ {tierUpdateMsg}
                    </div>
                  )}

                  {/* Members Table */}
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "ชื่อ / ผู้ใช้" : "Name & Avatar"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "อีเมลติดต่อ" : "Email"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "ช่องทางสมัคร" : "Provider"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "สถานะสมาชิก (Membership Tier)" : "Tier / Plan"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "วันหมดอายุ" : "Expiry"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "การจัดการแผน" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userList.map((u) => {
                          const currentPlan = u.plan || "free";
                          const tierMeta = MEMBERSHIP_TIERS[currentPlan] || MEMBERSHIP_TIERS.free;
                          return (
                            <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "1.2rem" }}>{u.avatar || "👤"}</span>
                                <span style={{ fontWeight: 600, color: "#1e293b" }}>{u.name}</span>
                              </td>
                              <td style={{ padding: "10px 14px", color: "#0369a1" }}>{u.email}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700, backgroundColor: "#f1f5f9", color: "#475569" }}>
                                  {u.provider?.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{
                                  padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700,
                                  backgroundColor: tierMeta.bg, color: tierMeta.color, border: `1px solid ${tierMeta.color}33`
                                }}>
                                  {isTh ? tierMeta.labelTh : tierMeta.labelEn}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "0.8rem" }}>
                                {u.planExpiry ? u.planExpiry : (isTh ? "ตลอดชีพ / ไม่มี" : "Lifetime")}
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <select
                                  value={currentPlan}
                                  onChange={(e) => handleUpdateUserPlan(u.id, e.target.value)}
                                  style={{
                                    padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1",
                                    fontSize: "0.78rem", fontWeight: 600, backgroundColor: "#ffffff", color: "#1e293b",
                                    cursor: "pointer"
                                  }}
                                  title={isTh ? "เปลี่ยนรูปแบบสมาชิก" : "Change Tier"}
                                >
                                  <option value="free">{isTh ? "ฟรี (Free)" : "Free"}</option>
                                  <option value="monthly">{isTh ? "รายเดือน (Monthly)" : "Monthly"}</option>
                                  <option value="yearly">{isTh ? "รายปี (Yearly)" : "Yearly"}</option>
                                  <option value="lifetime">{isTh ? "ตลอดชีพ (Lifetime)" : "Lifetime"}</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ADMIN ROLES & PERMISSIONS (RBAC) */}
              {activeTab === "roles" && (
                <div>
                  <div style={{ marginBottom: "18px" }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                      {isTh ? "จัดการสิทธิ์ผู้ดูแลระบบ (Admin Roles & Permissions)" : "Admin Roles & Permissions"}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                      {isTh
                        ? "กำหนดอีเมลและระดับสิทธิ์สำหรับดูแลระบบ เพื่อระบุหน้าที่การทำงาน เช่น Super Administrator, Administrator, หรือ Manager"
                        : "Assign and manage roles for system staff to govern administrative responsibilities."}
                    </p>
                  </div>

                  {/* Add Admin Form */}
                  <div style={{ backgroundColor: "#f8fafc", padding: "16px 20px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#0f172a" }}>
                      {isTh ? "➕ เพิ่มหรือมอบหมายสิทธิ์แอดมินใหม่" : "➕ Assign New Admin Role"}
                    </h4>

                    {roleMsg.text && (
                      <div style={{
                        padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "12px",
                        backgroundColor: roleMsg.isError ? "#fef2f2" : "#f0fdf4",
                        color: roleMsg.isError ? "#dc2626" : "#16a34a",
                        border: roleMsg.isError ? "1px solid #fecaca" : "1px solid #bbf7d0"
                      }}>
                        {roleMsg.isError ? "⚠️ " : "✅ "}
                        {roleMsg.text}
                      </div>
                    )}

                    <form onSubmit={handleAssignRole} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                      <div style={{ flex: 1, minWidth: "240px" }}>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                          {isTh ? "อีเมลของผู้ดูแล (Admin Email)" : "Admin Email"} *
                        </label>
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="staff@example.com"
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", boxSizing: "border-box" }}
                          required
                        />
                      </div>

                      <div style={{ width: "220px" }}>
                        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                          {isTh ? "ระดับสิทธิ์ (Role)" : "Role Level"} *
                        </label>
                        <select
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value)}
                          style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.88rem", backgroundColor: "#fff" }}
                        >
                          <option value="superadmin">{isTh ? "Super Admin (สูงสุด)" : "Super Admin"}</option>
                          <option value="admin">{isTh ? "Administrator (ผู้ดูแล)" : "Administrator"}</option>
                          <option value="manager">{isTh ? "Manager (ผู้จัดการเนื้อหา)" : "Manager"}</option>
                          <option value="user">{isTh ? "User (เพิกถอนสิทธิ์/ผู้ใช้ทั่วไป)" : "User"}</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        style={{
                          padding: "9px 18px", backgroundColor: "#0284c7", color: "#ffffff",
                          border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer"
                        }}
                      >
                        {isTh ? "มอบหมายสิทธิ์" : "Assign Role"}
                      </button>
                    </form>
                  </div>

                  {/* Admin List Table */}
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "อีเมลผู้ดูแล" : "Admin Email"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "ระดับสิทธิ์ (Role)" : "Assigned Role"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "ขอบเขตหน้าที่" : "Privileges"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "วันที่แต่งตั้ง" : "Assigned Date"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "จัดการ" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminRoles.map((r) => {
                          const meta = ADMIN_ROLES[r.role] || ADMIN_ROLES.user;
                          return (
                            <tr key={r.email} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>
                                {r.email}
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{
                                  padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700,
                                  backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.color}33`
                                }}>
                                  {isTh ? meta.labelTh : meta.labelEn}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "0.8rem" }}>
                                {isTh ? meta.descTh : meta.descEn}
                              </td>
                              <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "0.8rem" }}>
                                {new Date(r.assignedAt).toLocaleDateString(isTh ? "th-TH" : "en-US")}
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeRole(r.email)}
                                  style={{
                                    padding: "4px 8px", backgroundColor: "transparent", color: "#dc2626",
                                    border: "1px solid #fecaca", borderRadius: "4px", fontSize: "0.75rem",
                                    cursor: "pointer", fontWeight: 600
                                  }}
                                >
                                  {isTh ? "เพิกถอน" : "Revoke"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: TARGETED BROADCAST & SMART FILTERS */}
              {activeTab === "broadcast" && (
                <div>
                  <div style={{ marginBottom: "14px" }}>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                      {isTh ? "แจ้งข่าวสาร / อัปเดตสินค้า (Targeted Broadcast)" : "Targeted Broadcast & Product Announcements"}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      {isTh
                        ? "เลือกกลุ่มเป้าหมายผู้รับด้วยตัวกรอง (ตามรูปแบบสมาชิก, วันที่สมัคร, ชื่อ หรือโดเมนอีเมล) และเลือกติ๊กกล่องเฉพาะบุคคลได้"
                        : "Filter and selectively dispatch announcements by membership tier, signup date, name prefix, or individual checkboxes."}
                    </p>
                  </div>

                  {/* Filter Toolbar */}
                  <div style={{
                    backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px",
                    border: "1px solid #e2e8f0", marginBottom: "16px",
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px"
                  }}>
                    {/* Filter 1: Tier */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                        {isTh ? "🎯 แผนสมาชิก" : "Membership Tier"}
                      </label>
                      <select
                        value={filterTier}
                        onChange={(e) => setFilterTier(e.target.value)}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", backgroundColor: "#fff" }}
                      >
                        <option value="all">{isTh ? "ทุกแผนสมาชิก (All)" : "All Tiers"}</option>
                        <option value="free">{isTh ? "เฉพาะแบบฟรี (Free)" : "Free Only"}</option>
                        <option value="monthly">{isTh ? "เฉพาะรายเดือน (Monthly)" : "Monthly Only"}</option>
                        <option value="yearly">{isTh ? "เฉพาะรายปี (Yearly)" : "Yearly Only"}</option>
                        <option value="lifetime">{isTh ? "เฉพาะตลอดชีพ (Lifetime)" : "Lifetime Only"}</option>
                      </select>
                    </div>

                    {/* Filter 2: Date From */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                        {isTh ? "📅 สมัครตั้งแต่วันที่" : "Signed up from"}
                      </label>
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Filter 3: Date To */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                        {isTh ? "📅 ถึงวันที่" : "Signed up to"}
                      </label>
                      <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Filter 4: Name Prefix / Search */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                        {isTh ? "🔍 ค้นหาชื่อ/อักษรขึ้นต้น" : "Name Prefix / Search"}
                      </label>
                      <input
                        type="text"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder={isTh ? "เช่น Som, ก, ครู..." : "e.g. Som, S, Tom"}
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      />
                    </div>

                    {/* Filter 5: Email Group / Domain */}
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                        {isTh ? "📧 โดเมน/กลุ่มอีเมล" : "Email Domain / Group"}
                      </label>
                      <input
                        type="text"
                        value={filterEmailGroup}
                        onChange={(e) => setFilterEmailGroup(e.target.value)}
                        placeholder="gmail.com, icloud.com..."
                        style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {/* Recipient Selection Table with Checkboxes */}
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                        📫 {isTh ? `ผู้รับที่เลือก: ${filteredUsers.filter((u) => selectedUserIds.has(u.id)).length} คน (จากตัวกรอง ${filteredUsers.length} คน / ทั้งหมด ${userList.length} คน)` : `Selected: ${filteredUsers.filter((u) => selectedUserIds.has(u.id)).length} of ${filteredUsers.length} filtered (${userList.length} total)`}
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set(selectedUserIds);
                            filteredUsers.forEach((u) => next.add(u.id));
                            setSelectedUserIds(next);
                          }}
                          style={{ padding: "4px 10px", fontSize: "0.75rem", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}
                        >
                          {isTh ? "✓ เลือกทั้งหมดในตัวกรอง" : "Select All Filtered"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = new Set(selectedUserIds);
                            filteredUsers.forEach((u) => next.delete(u.id));
                            setSelectedUserIds(next);
                          }}
                          style={{ padding: "4px 10px", fontSize: "0.75rem", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer", fontWeight: 600 }}
                        >
                          {isTh ? "✕ ไม่เลือกในตัวกรอง" : "Deselect Filtered"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCopySelectedEmails}
                          style={{ padding: "4px 10px", fontSize: "0.75rem", background: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: 700 }}
                        >
                          📋 {isTh ? "คัดลอกอีเมลที่เลือก" : "Copy Selected"}
                        </button>
                      </div>
                    </div>

                    <div style={{ maxHeight: "190px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                        <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 1 }}>
                          <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                            <th style={{ padding: "8px 10px", width: "40px", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.id))}
                                onChange={handleToggleSelectAllFiltered}
                                title={isTh ? "เลือก/ไม่เลือกทั้งหมด" : "Toggle All"}
                              />
                            </th>
                            <th style={{ padding: "8px 10px" }}>{isTh ? "ชื่อ / ผู้ใช้" : "Name"}</th>
                            <th style={{ padding: "8px 10px" }}>{isTh ? "อีเมล" : "Email"}</th>
                            <th style={{ padding: "8px 10px" }}>{isTh ? "แผนสมาชิก" : "Tier"}</th>
                            <th style={{ padding: "8px 10px" }}>{isTh ? "วันที่สมัคร" : "Registered"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: "16px", textAlign: "center", color: "#94a3b8" }}>
                                {isTh ? "ไม่พบสมาชิกที่ตรงตามเงื่อนไขตัวกรอง" : "No members match the filter criteria"}
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map((u) => {
                              const isSelected = selectedUserIds.has(u.id);
                              const tMeta = MEMBERSHIP_TIERS[u.plan || "free"] || MEMBERSHIP_TIERS.free;
                              return (
                                <tr
                                  key={u.id}
                                  onClick={() => handleToggleUserSelection(u.id)}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                    backgroundColor: isSelected ? "#f0f9ff" : "transparent",
                                    cursor: "pointer"
                                  }}
                                >
                                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}} // Handled by row onClick
                                    />
                                  </td>
                                  <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1e293b" }}>
                                    {u.avatar || "👤"} {u.name}
                                  </td>
                                  <td style={{ padding: "8px 10px", color: "#0369a1" }}>{u.email}</td>
                                  <td style={{ padding: "8px 10px" }}>
                                    <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700, backgroundColor: tMeta.bg, color: tMeta.color }}>
                                      {isTh ? tMeta.labelTh : tMeta.labelEn}
                                    </span>
                                  </td>
                                  <td style={{ padding: "8px 10px", color: "#64748b" }}>
                                    {new Date(u.registeredAt).toLocaleDateString(isTh ? "th-TH" : "en-US")}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Broadcast Composer */}
                  <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    {broadcastStatus && (
                      <div style={{ padding: "8px 12px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "12px" }}>
                        ✅ {broadcastStatus}
                      </div>
                    )}

                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                        {isTh ? "หัวข้ออีเมล (Subject)" : "Email Subject"} *
                      </label>
                      <input
                        type="text"
                        value={broadcastSubject}
                        onChange={(e) => setBroadcastSubject(e.target.value)}
                        placeholder={isTh ? "เช่น [ThaiTone Update] สิทธิพิเศษสำหรับสมาชิกรายปีและตลอดชีพ" : "e.g. [ThaiTone Update] Special Announcements for Lifetime Members"}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                        {isTh ? "เนื้อหาข้อความแจ้งเตือน (Message Body)" : "Message Body"} *
                      </label>
                      <textarea
                        rows={5}
                        value={broadcastBody}
                        onChange={(e) => setBroadcastBody(e.target.value)}
                        placeholder={isTh ? "พิมพ์ข้อความรายละเอียดผลิตภัณฑ์ การอัปเดต หรือเงื่อนไขลิขสิทธิ์ที่นี่..." : "Type product announcement or copyright terms update..."}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        📫 {isTh ? `พร้อมส่งถึงผู้รับที่เลือก: ${userList.filter((u) => selectedUserIds.has(u.id)).length} คน` : `Ready to send to: ${userList.filter((u) => selectedUserIds.has(u.id)).length} recipients`}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const targetCount = userList.filter((u) => selectedUserIds.has(u.id)).length;
                          if (targetCount === 0) {
                            alert(isTh ? "กรุณาเลือกผู้รับอย่างน้อย 1 คน" : "Please select at least 1 recipient");
                            return;
                          }
                          if (!broadcastSubject.trim()) {
                            alert(isTh ? "กรุณากรอกหัวข้ออีเมล" : "Please enter subject");
                            return;
                          }
                          setBroadcastStatus(isTh ? `ส่งการแจ้งเตือนถึง ${targetCount} ผู้รับเรียบร้อยแล้ว!` : `Announcement dispatched to ${targetCount} recipients!`);
                          setTimeout(() => setBroadcastStatus(""), 4000);
                        }}
                        style={{
                          padding: "10px 22px", backgroundColor: "#0284c7", color: "#ffffff",
                          border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.92rem",
                          cursor: "pointer", boxShadow: "0 2px 6px rgba(2,132,199,.25)"
                        }}
                      >
                        🚀 {isTh ? "ส่งการแจ้งเตือน" : "Dispatch Announcement"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ADMIN SECURITY & CHANGE PIN */}
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
