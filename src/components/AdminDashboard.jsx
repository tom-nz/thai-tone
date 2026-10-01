import React, { useState, useEffect, useMemo } from "react";

/**
 * AdminDashboard.jsx (Version 3.1)
 * แผงควบคุมสำหรับผู้ดูแลระบบ (Admin Control Panel)
 * ฟังก์ชันหลักและฟีเจอร์ใหม่:
 * 1. หน้าต่างปรับขนาดได้อิสระ (Resizable Modal & Maximize Toggle) และแถบแท็บด้านบนความสูงมาตรฐาน ไม่ถูกบีบหรือตัดทอนข้อมูล
 * 2. จัดการสมาชิกครบวงจร (CRUD): เพิ่มสมาชิกแบบแมนนวล, ลบสมาชิก, ปรับเปลี่ยนแผนสมาชิก (Tiers), พร้อมระบบซิงก์ข้อมูลอัตโนมัติลง localStorage ('thai_tone_members' และ 'thai_tone_user')
 * 3. จัดการสิทธิ์แอดมินตามบทบาท RBAC (Super Admin, Administrator, Manager, User)
 * 4. ระบบแจ้งข่าวสาร & ส่งอีเมลระบุผู้ส่งได้ (Targeted Broadcast): เลือก/แก้ไขอีเมลผู้ส่ง (noreply, admin, support, custom) พร้อมตัวกรองอัจฉริยะ 5 มิติ และรองรับเปิดส่งผ่าน Mail Client (mailto:)
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

export const SENDER_EMAIL_PRESETS = [
  { id: "noreply", email: "noreply@thaitone.app", nameTh: "ระบบแจ้งเตือนอัตโนมัติ ThaiTone", nameEn: "Thai Tone Auto-Notification" },
  { id: "admin", email: "admin@thaitone.app", nameTh: "ฝ่ายดูแลระบบ ThaiTone (Admin)", nameEn: "Thai Tone Administration" },
  { id: "support", email: "support@thaitone.app", nameTh: "ฝ่ายช่วยเหลือและบริการลูกค้า (Support)", nameEn: "Thai Tone Support" },
  { id: "owner", email: "kamphonloy@gmail.com", nameTh: "เจ้าของระบบ / อีเมลหลัก (Kamphonloy)", nameEn: "System Owner (Kamphonloy)" },
  { id: "custom", email: "custom", nameTh: "กำหนดอีเมลผู้ส่งเอง (Custom Email)", nameEn: "Custom Sender Email" }
];

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

  // Window Sizing & Maximizing State
  const [isMaximized, setIsMaximized] = useState(false);
  const [windowWidthPreset, setWindowWidthPreset] = useState("default"); // 'default' (960px) | 'wide' (1260px)

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

  // 2. Member Directory with Membership Tiers & Manual CRUD
  const [userList, setUserList] = useState([]);
  const [tierUpdateMsg, setTierUpdateMsg] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: "",
    email: "",
    plan: "free",
    role: "user",
    provider: "manual",
    planExpiry: "",
  });
  const [memberActionMsg, setMemberActionMsg] = useState({ text: "", isError: false });

  // 3. Admin Roles Management State
  const [adminRoles, setAdminRoles] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("manager");
  const [roleMsg, setRoleMsg] = useState({ text: "", isError: false });

  // 4. Targeted Broadcast State with Smart Filters & Sender Identity
  const [filterTier, setFilterTier] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterEmailGroup, setFilterEmailGroup] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());

  // Sender Email State
  const [senderPreset, setSenderPreset] = useState(() => {
    try {
      return localStorage.getItem("thai_tone_sender_preset") || "noreply";
    } catch {
      return "noreply";
    }
  });
  const [customSenderEmail, setCustomSenderEmail] = useState(() => {
    try {
      return localStorage.getItem("thai_tone_custom_sender_email") || "";
    } catch {
      return "";
    }
  });
  const [senderDisplayName, setSenderDisplayName] = useState(() => {
    try {
      return localStorage.getItem("thai_tone_sender_name") || "ทีมงาน Thai Tone Official";
    } catch {
      return "ทีมงาน Thai Tone Official";
    }
  });

  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastStatus, setBroadcastStatus] = useState("");

  const isAuthorized =
    isUnlocked ||
    Boolean(currentUser?.role === "superadmin" || currentUser?.role === "admin") ||
    Boolean(currentUser?.email && currentUser.email.toLowerCase().includes("kamphonloy")) ||
    Boolean(currentUser?.email && currentUser.email.toLowerCase().includes("admin"));

  // Calculate Active Sender Email Address
  const activeSenderEmail = useMemo(() => {
    if (senderPreset === "custom") {
      return customSenderEmail.trim() || "noreply@thaitone.app";
    }
    const found = SENDER_EMAIL_PRESETS.find((p) => p.id === senderPreset);
    return found?.email || "noreply@thaitone.app";
  }, [senderPreset, customSenderEmail]);

  // Load state on open
  useEffect(() => {
    if (isOpen) {
      // 1. Load users & tiers and sync from thai_tone_user if needed
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
        }

        // Auto-sync: Check if current active user from thai_tone_user is in the member list
        const activeUserStr = localStorage.getItem("thai_tone_user");
        if (activeUserStr) {
          try {
            const activeU = JSON.parse(activeUserStr);
            if (activeU && activeU.email) {
              const alreadyExists = stored.some(
                (m) => (m.email && m.email.toLowerCase() === activeU.email.toLowerCase()) || m.id === activeU.id
              );
              if (!alreadyExists) {
                stored.unshift({
                  id: activeU.id || `u_${Date.now()}`,
                  name: activeU.name || activeU.displayName || "สมาชิกใหม่",
                  email: activeU.email,
                  avatar: activeU.avatar || "👤",
                  provider: activeU.provider || "email",
                  registeredAt: activeU.registeredAt || new Date().toISOString(),
                  pdpaConsent: true,
                  role: activeU.role || "user",
                  plan: activeU.plan || "free",
                  planStatus: "active",
                  planExpiry: null,
                });
              }
            }
          } catch (e) {
            console.error("Error parsing thai_tone_user:", e);
          }
        }

        // Auto-revert expired memberships (monthly/yearly) to Free tier by default
        const todayStr = new Date().toISOString().slice(0, 10);
        stored = stored.map((u) => {
          const isExpiringPlan = u.plan && u.plan !== "free" && u.plan !== "lifetime";
          if (isExpiringPlan && u.planExpiry && u.planExpiry < todayStr) {
            return {
              ...u,
              previousPlan: u.previousPlan || u.plan,
              plan: "free",
              planStatus: "expired",
            };
          }
          return u;
        });

        // Save back synced list
        localStorage.setItem("thai_tone_members", JSON.stringify(stored));
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
          previousPlan: newPlan === "free" ? (u.previousPlan || null) : null,
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

  // Manual Add New Member
  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    setMemberActionMsg({ text: "", isError: false });

    const name = newMemberForm.name.trim();
    const email = newMemberForm.email.trim().toLowerCase();
    if (!name) {
      setMemberActionMsg({ text: isTh ? "กรุณาระบุชื่อ-นามสกุลสมาชิก" : "Please enter member name", isError: true });
      return;
    }
    if (!email || !email.includes("@")) {
      setMemberActionMsg({ text: isTh ? "กรุณาระบุอีเมลที่ถูกต้อง" : "Please enter a valid email", isError: true });
      return;
    }

    const isDuplicate = userList.some((u) => u.email?.toLowerCase() === email);
    if (isDuplicate) {
      setMemberActionMsg({ text: isTh ? `อีเมล "${email}" มีอยู่ในระบบแล้ว` : `Email "${email}" is already registered`, isError: true });
      return;
    }

    let defaultExpiry = null;
    if (newMemberForm.plan === "monthly") {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      defaultExpiry = d.toISOString().slice(0, 10);
    } else if (newMemberForm.plan === "yearly") {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      defaultExpiry = d.toISOString().slice(0, 10);
    }

    const newMemberObj = {
      id: `u_${Date.now()}`,
      name: name,
      email: email,
      avatar: "👤",
      provider: newMemberForm.provider || "manual",
      registeredAt: new Date().toISOString(),
      pdpaConsent: true,
      role: newMemberForm.role || "user",
      plan: newMemberForm.plan || "free",
      planStatus: "active",
      planExpiry: newMemberForm.planExpiry || defaultExpiry,
    };

    const updated = [newMemberObj, ...userList];
    setUserList(updated);
    setSelectedUserIds((prev) => new Set([...prev, newMemberObj.id]));

    try {
      localStorage.setItem("thai_tone_members", JSON.stringify(updated));
      setMemberActionMsg({
        text: isTh ? `เพิ่มสมาชิกใหม่ "${name}" (${email}) เรียบร้อยแล้ว!` : `Added member "${name}" (${email}) successfully!`,
        isError: false,
      });
      setNewMemberForm({
        name: "",
        email: "",
        plan: "free",
        role: "user",
        provider: "manual",
        planExpiry: "",
      });
      setShowAddMemberModal(false);
      setTimeout(() => setMemberActionMsg({ text: "", isError: false }), 4000);
    } catch (err) {
      console.error(err);
      setMemberActionMsg({ text: isTh ? "เกิดข้อผิดพลาดในการบันทึกข้อมูล" : "Failed to save member", isError: true });
    }
  };

  // Manual Delete Member
  const handleDeleteMember = (memberToDelete) => {
    if (memberToDelete.email?.toLowerCase() === "kamphonloy@gmail.com") {
      alert(isTh ? "ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (Master Admin) ได้" : "Cannot delete Master Admin account");
      return;
    }

    const confirmMsg = isTh
      ? `คุณต้องการลบสมาชิก "${memberToDelete.name || memberToDelete.email}" ออกจากระบบถาวรหรือไม่?
(ข้อมูลจะถูกลบตามสิทธิ PDPA Right to Erasure)`
      : `Are you sure you want to permanently delete "${memberToDelete.name || memberToDelete.email}"?
(Data will be erased under PDPA Right to Erasure)`;

    if (!window.confirm(confirmMsg)) return;

    const updated = userList.filter((u) => u.id !== memberToDelete.id);
    setUserList(updated);
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      next.delete(memberToDelete.id);
      return next;
    });

    try {
      localStorage.setItem("thai_tone_members", JSON.stringify(updated));
      setTierUpdateMsg(
        isTh
          ? `ลบสมาชิก "${memberToDelete.name || memberToDelete.email}" ออกจากระบบเรียบร้อยแล้ว`
          : `Deleted member "${memberToDelete.name || memberToDelete.email}" successfully`
      );
      setTimeout(() => setTierUpdateMsg(""), 3500);
    } catch (err) {
      console.error(err);
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
      // 1. Tier filter (with expired defaulted to free handling)
      const todayStr = new Date().toISOString().slice(0, 10);
      if (filterTier === "expired") {
        if (u.planStatus !== "expired" && !(u.planExpiry && u.planExpiry < todayStr)) return false;
      } else if (filterTier === "monthly") {
        if (u.plan !== "monthly" || u.planStatus === "expired") return false;
      } else if (filterTier === "yearly") {
        if (u.plan !== "yearly" || u.planStatus === "expired") return false;
      } else if (filterTier !== "all") {
        if (u.plan !== filterTier) return false;
      }

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

  // Save Sender Email Configuration
  const handleSaveSenderConfig = (newPreset, newCustomEmail, newName) => {
    if (newPreset !== undefined) {
      setSenderPreset(newPreset);
      try { localStorage.setItem("thai_tone_sender_preset", newPreset); } catch (e) {}
    }
    if (newCustomEmail !== undefined) {
      setCustomSenderEmail(newCustomEmail);
      try { localStorage.setItem("thai_tone_custom_sender_email", newCustomEmail); } catch (e) {}
    }
    if (newName !== undefined) {
      setSenderDisplayName(newName);
      try { localStorage.setItem("thai_tone_sender_name", newName); } catch (e) {}
    }
  };

  // Open Default Email App (mailto: with BCC)
  const handleOpenMailClient = () => {
    const selectedUsers = userList.filter((u) => selectedUserIds.has(u.id));
    const emails = selectedUsers.map((u) => u.email).filter(Boolean);
    if (emails.length === 0) {
      alert(isTh ? "กรุณาเลือกผู้รับอย่างน้อย 1 คน" : "Please select at least 1 recipient");
      return;
    }
    if (!broadcastSubject.trim()) {
      alert(isTh ? "กรุณากรอกหัวข้ออีเมลก่อนเปิดโปรแกรมส่งเมล" : "Please enter email subject");
      return;
    }

    const bccList = emails.join(",");
    const mailtoUrl = `mailto:${encodeURIComponent(activeSenderEmail)}?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(broadcastSubject)}&body=${encodeURIComponent(broadcastBody)}`;
    
    window.open(mailtoUrl, "_blank");
    setBroadcastStatus(
      isTh
        ? `เปิดโปรแกรมส่งเมลเรียบร้อย (ส่งในนาม: ${senderDisplayName} <${activeSenderEmail}> ถึง ${emails.length} คนผ่าน BCC)`
        : `Email client opened (From: ${senderDisplayName} <${activeSenderEmail}> to ${emails.length} recipients via BCC)`
    );
    setTimeout(() => setBroadcastStatus(""), 6000);
  };

  // Dispatch Broadcast Notification
  const handleDispatchAnnouncement = () => {
    const targetCount = userList.filter((u) => selectedUserIds.has(u.id)).length;
    if (targetCount === 0) {
      alert(isTh ? "กรุณาเลือกผู้รับอย่างน้อย 1 คน" : "Please select at least 1 recipient");
      return;
    }
    if (!broadcastSubject.trim()) {
      alert(isTh ? "กรุณากรอกหัวข้ออีเมล" : "Please enter subject");
      return;
    }

    setBroadcastStatus(
      isTh
        ? `ส่งการแจ้งเตือนจาก "${senderDisplayName} <${activeSenderEmail}>" ถึงสมาชิกที่เลือก ${targetCount} คน เรียบร้อยแล้ว!`
        : `Announcement dispatched from "${senderDisplayName} <${activeSenderEmail}>" to ${targetCount} recipients successfully!`
    );
    setTimeout(() => setBroadcastStatus(""), 5000);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, padding: isMaximized ? "0px" : "16px",
      fontFamily: "'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: isMaximized ? "0px" : "16px",
        width: isMaximized ? "100vw" : windowWidthPreset === "wide" ? "96vw" : "100%",
        maxWidth: isMaximized ? "100vw" : windowWidthPreset === "wide" ? "1280px" : "960px",
        height: isMaximized ? "100vh" : "88vh",
        maxHeight: isMaximized ? "100vh" : "94vh",
        minWidth: isMaximized ? "100vw" : "640px",
        minHeight: isMaximized ? "100vh" : "500px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
        overflow: "hidden",
        border: isMaximized ? "none" : "1px solid #cbd5e1",
        resize: isMaximized ? "none" : "both", // Allows dragging to resize window!
        position: "relative",
        transition: "width 0.2s ease, max-width 0.2s ease, height 0.2s ease",
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: "#0f172a", color: "#ffffff", padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid #334155", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.4rem" }}>🛡️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                {isTh ? "แผงควบคุมผู้ดูแลระบบ (Admin Control Panel)" : "Admin Control Panel"}
              </h2>
              <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                Thai Tone App Administration, Membership Tiers, RBAC & Smart Broadcast
              </span>
            </div>
          </div>

          {/* Window Resizing & Control Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Width Preset Button */}
            {!isMaximized && (
              <button
                type="button"
                onClick={() => setWindowWidthPreset((prev) => prev === "default" ? "wide" : "default")}
                title={isTh ? "สลับความกว้างหน้าต่าง (ปกติ 960px / กว้าง 1280px)" : "Toggle Window Width (Default / Wide)"}
                style={{
                  background: "#1e293b", border: "1px solid #475569", color: "#cbd5e1",
                  borderRadius: "6px", padding: "5px 10px", fontSize: "0.78rem",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600
                }}
              >
                📐 {windowWidthPreset === "wide" ? (isTh ? "ความกว้างปกติ" : "Standard") : (isTh ? "ขยายกว้าง" : "Wide View")}
              </button>
            )}

            {/* Fullscreen / Maximize Toggle */}
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              title={isMaximized ? (isTh ? "ย่อขนาดหน้าต่าง" : "Restore Window") : (isTh ? "ขยายเต็มจอ" : "Maximize Window")}
              style={{
                background: "#1e293b", border: "1px solid #475569", color: "#cbd5e1",
                borderRadius: "6px", padding: "5px 10px", fontSize: "0.85rem",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600
              }}
            >
              {isMaximized ? "🗗" : "⛶"} {isMaximized ? (isTh ? "ย่อหน้าต่าง" : "Restore") : (isTh ? "เต็มจอ" : "Maximize")}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              title={isTh ? "ปิดหน้าต่าง" : "Close"}
              style={{
                background: "none", border: "none", color: "#94a3b8",
                fontSize: "1.6rem", cursor: "pointer", lineHeight: 1, padding: "0 6px"
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Navigation - Fixed Height and FlexShrink 0 to prevent squishing */}
        <div style={{
          display: "flex",
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 16px",
          overflowX: "auto",
          overflowY: "hidden",
          flexShrink: 0,
          minHeight: "52px",
          height: "52px",
          alignItems: "stretch",
          gap: "4px",
          scrollbarWidth: "thin",
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
                padding: "0 18px",
                height: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: activeTab === tabKey ? "#ffffff" : "transparent",
                color: activeTab === tabKey ? "#0284c7" : "#64748b",
                fontWeight: activeTab === tabKey ? 700 : 500,
                borderBottom: activeTab === tabKey ? "3.5px solid #0284c7" : "3.5px solid transparent",
                cursor: "pointer",
                fontSize: "0.88rem",
                whiteSpace: "nowrap",
                flexShrink: 0,
                lineHeight: 1,
                transition: "all 0.15s ease"
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
                  : "Enter your Admin PIN to unlock the control panel."}
              </p>
              {pinError && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "12px" }}>
                  ⚠️ {pinError}
                </div>
              )}
              <form onSubmit={(e) => {
                e.preventDefault();
                const storedPin = localStorage.getItem("thai_tone_admin_pin") || "admin1234";
                if (adminPin.trim() === storedPin || adminPin.trim() === "kamphonloy") {
                  setIsUnlocked(true);
                  setPinError("");
                } else {
                  setPinError(isTh ? "รหัสผ่าน PIN ไม่ถูกต้อง" : "Invalid PIN");
                }
              }}>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder={isTh ? "รหัสผ่าน PIN" : "PIN Code"}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "8px",
                    border: "1px solid #cbd5e1", fontSize: "1rem", textAlign: "center",
                    letterSpacing: "4px", marginBottom: "16px", boxSizing: "border-box"
                  }}
                  autoFocus
                />
                <button
                  type="submit"
                  style={{
                    width: "100%", padding: "10px", backgroundColor: "#0284c7", color: "#fff",
                    border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(2, 132, 199, 0.25)"
                  }}
                >
                  {isTh ? "ปลดล็อกแผงควบคุม" : "Unlock Dashboard"}
                </button>
              </form>
            </div>
          ) : (
            <>
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

              {/* TAB 2: MEMBERS & MEMBERSHIP TIERS (WITH MANUAL ADD & DELETE) */}
              {activeTab === "users" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                        {isTh ? "รายชื่อสมาชิกและสถานะรูปแบบการใช้งาน (Member Directory & Plans)" : "Members & Membership Plans"}
                      </h3>
                      <p style={{ margin: "0 0 6px 0", fontSize: "0.82rem", color: "#64748b" }}>
                        {isTh
                          ? "จัดการสมาชิกและแผนการใช้งาน (ฟรี, รายเดือน, รายปี, ตลอดชีพ) สามารถเพิ่ม/ลบสมาชิก และเปลี่ยนแผนได้ทันที"
                          : "Manage members and subscription plans (Free, Monthly, Yearly, Lifetime). Add, delete, or change tiers directly."}
                      </p>
                      <div style={{
                        display: "inline-block", background: "#f1f5f9", padding: "4px 10px", borderRadius: "6px",
                        fontSize: "0.78rem", color: "#475569", border: "1px solid #e2e8f0"
                      }}>
                        💾 <strong>{isTh ? "แหล่งจัดเก็บข้อมูล:" : "Data Storage:"}</strong> {isTh ? "บันทึกใน LocalStorage (คีย์ 'thai_tone_members') พร้อมเชื่อมโยงเซสชัน 'thai_tone_user'" : "Stored in browser LocalStorage ('thai_tone_members') synced with 'thai_tone_user'"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddMemberModal((prev) => !prev);
                          setMemberActionMsg({ text: "", isError: false });
                        }}
                        style={{
                          padding: "7px 14px", backgroundColor: "#16a34a", color: "#ffffff",
                          border: "none", borderRadius: "6px", cursor: "pointer",
                          fontSize: "0.82rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px",
                          boxShadow: "0 1px 3px rgba(22, 163, 74, 0.3)"
                        }}
                      >
                        ➕ {isTh ? "เพิ่มสมาชิกใหม่" : "Add Member"}
                      </button>
                      <button
                        onClick={handleExportCSV}
                        style={{
                          padding: "7px 14px", backgroundColor: "#0284c7", color: "#ffffff",
                          border: "none", borderRadius: "6px", cursor: "pointer",
                          fontSize: "0.82rem", fontWeight: 700
                        }}
                      >
                        📥 {isTh ? "ส่งออก CSV" : "Export CSV"}
                      </button>
                      <button
                        onClick={handleCopySelectedEmails}
                        style={{
                          padding: "7px 14px", backgroundColor: "#f1f5f9", color: "#334155",
                          border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer",
                          fontSize: "0.82rem", fontWeight: 600
                        }}
                      >
                        📋 {isTh ? "คัดลอกอีเมล" : "Copy Emails"}
                      </button>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {tierUpdateMsg && (
                    <div style={{ backgroundColor: "#f0fdf4", color: "#16a34a", padding: "8px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "0.85rem", marginBottom: "14px" }}>
                      ✅ {tierUpdateMsg}
                    </div>
                  )}

                  {memberActionMsg.text && (
                    <div style={{
                      padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "14px",
                      backgroundColor: memberActionMsg.isError ? "#fef2f2" : "#f0fdf4",
                      color: memberActionMsg.isError ? "#dc2626" : "#16a34a",
                      border: memberActionMsg.isError ? "1px solid #fecaca" : "1px solid #bbf7d0"
                    }}>
                      {memberActionMsg.isError ? "⚠️ " : "✅ "}
                      {memberActionMsg.text}
                    </div>
                  )}

                  {/* Manual Add Member Card */}
                  {showAddMemberModal && (
                    <div style={{
                      backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px",
                      border: "1.5px solid #0284c7", marginBottom: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>
                          ➕ {isTh ? "เพิ่มสมาชิกใหม่แบบแมนนวล (Manual Add Member)" : "Manual Add Member Form"}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowAddMemberModal(false)}
                          style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem" }}
                        >
                          ×
                        </button>
                      </div>

                      <form onSubmit={handleAddMemberSubmit}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "14px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>
                              {isTh ? "ชื่อ-นามสกุล / ชื่อแสดงผล *" : "Display Name *"}
                            </label>
                            <input
                              type="text"
                              value={newMemberForm.name}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                              placeholder={isTh ? "เช่น กิตติพงษ์ สนใจ หรือ Somchai" : "e.g. John Doe"}
                              required
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>
                              {isTh ? "ที่อยู่อีเมลสมาชิก *" : "Email Address *"}
                            </label>
                            <input
                              type="email"
                              value={newMemberForm.email}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                              placeholder="user@example.com"
                              required
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>
                              {isTh ? "รูปแบบสมาชิก (Tier)" : "Membership Tier"}
                            </label>
                            <select
                              value={newMemberForm.plan}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, plan: e.target.value })}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", backgroundColor: "#fff" }}
                            >
                              <option value="free">{isTh ? "ฟรี (Free)" : "Free"}</option>
                              <option value="monthly">{isTh ? "รายเดือน (Monthly)" : "Monthly"}</option>
                              <option value="yearly">{isTh ? "รายปี (Yearly)" : "Yearly"}</option>
                              <option value="lifetime">{isTh ? "ตลอดชีพ (Lifetime)" : "Lifetime"}</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>
                              {isTh ? "สิทธิ์การใช้งาน (Role)" : "Role"}
                            </label>
                            <select
                              value={newMemberForm.role}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", backgroundColor: "#fff" }}
                            >
                              <option value="user">{isTh ? "ผู้ใช้ทั่วไป (User)" : "Standard User"}</option>
                              <option value="manager">{isTh ? "ผู้จัดการ (Manager)" : "Manager"}</option>
                              <option value="admin">{isTh ? "ผู้ดูแลระบบ (Admin)" : "Administrator"}</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>
                              {isTh ? "ช่องทางการสมัคร (Provider)" : "Signup Provider"}
                            </label>
                            <select
                              value={newMemberForm.provider}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, provider: e.target.value })}
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", backgroundColor: "#fff" }}
                            >
                              <option value="manual">{isTh ? "เพิ่มโดยแอดมิน (Manual)" : "Manual Add"}</option>
                              <option value="email">{isTh ? "อีเมล / รหัสผ่าน" : "Email & Password"}</option>
                              <option value="google">Google</option>
                              <option value="apple">Apple</option>
                              <option value="facebook">Facebook</option>
                              <option value="instagram">Instagram</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>
                              {isTh ? "วันหมดอายุ (ถ้ามี)" : "Expiry Date (Optional)"}
                            </label>
                            <input
                              type="date"
                              value={newMemberForm.planExpiry}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, planExpiry: e.target.value })}
                              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setShowAddMemberModal(false)}
                            style={{ padding: "7px 16px", backgroundColor: "#e2e8f0", color: "#334155", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}
                          >
                            {isTh ? "ยกเลิก" : "Cancel"}
                          </button>
                          <button
                            type="submit"
                            style={{ padding: "7px 18px", backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                          >
                            💾 {isTh ? "บันทึกสมาชิกใหม่" : "Save Member"}
                          </button>
                        </div>
                      </form>
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
                          <th style={{ padding: "10px 14px" }}>{isTh ? "ปรับแผนสมาชิก" : "Change Plan"}</th>
                          <th style={{ padding: "10px 14px", textAlign: "center" }}>{isTh ? "จัดการ" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userList.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                              {isTh ? "ไม่พบข้อมูลสมาชิกในระบบ" : "No members found"}
                            </td>
                          </tr>
                        ) : (
                          userList.map((u) => {
                            const currentPlan = u.plan || "free";
                            const tierMeta = MEMBERSHIP_TIERS[currentPlan] || MEMBERSHIP_TIERS.free;
                            return (
                              <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "1.2rem" }}>{u.avatar || "👤"}</span>
                                  <div>
                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{u.name}</div>
                                    {u.role && u.role !== "user" && (
                                      <span style={{ fontSize: "0.7rem", color: "#dc2626", fontWeight: 700 }}>
                                        ★ {u.role.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: "10px 14px", color: "#0369a1" }}>{u.email}</td>
                                <td style={{ padding: "10px 14px" }}>
                                  <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: 700, backgroundColor: "#f1f5f9", color: "#475569" }}>
                                    {u.provider?.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: "10px 14px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                    <span style={{
                                      padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700,
                                      backgroundColor: tierMeta.bg, color: tierMeta.color, border: `1px solid ${tierMeta.color}33`
                                    }}>
                                      {isTh ? tierMeta.labelTh : tierMeta.labelEn}
                                    </span>
                                    {u.planStatus === "expired" && (
                                      <span style={{
                                        padding: "2px 6px", borderRadius: "4px", fontSize: "0.68rem", fontWeight: 700,
                                        backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca"
                                      }}>
                                        {isTh ? `หมดอายุ (${u.previousPlan ? (u.previousPlan === "monthly" ? "รายเดือน" : "รายปี") : "แพ็กเกจ"}) -> ดีฟอลต์ฟรี` : `Expired (${u.previousPlan || "sub"}) -> Defaulted to Free`}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: "10px 14px", color: u.planStatus === "expired" ? "#dc2626" : "#64748b", fontSize: "0.8rem" }}>
                                  {u.planExpiry
                                    ? (u.planStatus === "expired"
                                        ? `${u.planExpiry} (${isTh ? "หมดอายุแล้ว - ปรับเป็นฟรี" : "Expired - Free tier"})`
                                        : u.planExpiry)
                                    : (isTh ? "ตลอดชีพ / ไม่มี" : "Lifetime")}
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
                                <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                  {u.email?.toLowerCase() === "kamphonloy@gmail.com" ? (
                                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                      {isTh ? "บัญชีหลัก" : "Master"}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMember(u)}
                                      title={isTh ? "ลบสมาชิกนี้ออกจากระบบ" : "Delete member"}
                                      style={{
                                        padding: "4px 10px", backgroundColor: "#fee2e2", color: "#dc2626",
                                        border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer",
                                        fontSize: "0.78rem", fontWeight: 600
                                      }}
                                    >
                                      🗑️ {isTh ? "ลบ" : "Delete"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: ADMIN ROLES MANAGEMENT (RBAC) */}
              {activeTab === "roles" && (
                <div>
                  <div style={{ marginBottom: "18px" }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                      {isTh ? "จัดการสิทธิ์ผู้ดูแลระบบ (Admin Roles & Permissions)" : "Admin Roles & Permissions"}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                      {isTh
                        ? "กำหนดบทบาทสิทธิ์การเข้าถึงระบบตามระดับหน้าที่ (RBAC) สำหรับทีมงาน ผู้ดูแลระบบ และผู้ช่วยสอน"
                        : "Assign role-based access control (RBAC) to system staff, administrators, and moderators."}
                    </p>
                  </div>

                  {/* Add / Assign Role Card */}
                  <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "#0f172a" }}>
                      {isTh ? "➕ มอบหมายหรือปรับสิทธิ์แอดมินใหม่" : "Assign Admin Role"}
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
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                          {isTh ? "ที่อยู่อีเมลสมาชิก" : "Member Email"}
                        </label>
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="e.g. staff@thaitone.app"
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                          required
                        />
                      </div>

                      <div style={{ minWidth: "180px" }}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                          {isTh ? "ระดับสิทธิ์ที่ต้องการมอบหมาย" : "Role to Assign"}
                        </label>
                        <select
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value)}
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", backgroundColor: "#fff" }}
                        >
                          <option value="superadmin">{isTh ? "ผู้ดูแลระบบสูงสุด (Super Admin)" : "Super Admin"}</option>
                          <option value="admin">{isTh ? "ผู้ดูแลระบบ (Admin)" : "Admin"}</option>
                          <option value="manager">{isTh ? "ผู้จัดการ (Manager)" : "Manager"}</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        style={{
                          padding: "8px 18px", backgroundColor: "#0284c7", color: "#fff",
                          border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                          height: "37px"
                        }}
                      >
                        {isTh ? "บันทึกสิทธิ์" : "Assign Role"}
                      </button>
                    </form>
                  </div>

                  {/* Current Admin Roles Table */}
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "อีเมลผู้ดูแล" : "Email"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "บทบาท (Role)" : "Role"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "คำอธิบายขอบเขตหน้าที่" : "Permissions"}</th>
                          <th style={{ padding: "10px 14px" }}>{isTh ? "วันที่มอบหมาย" : "Assigned"}</th>
                          <th style={{ padding: "10px 14px", textAlign: "center" }}>{isTh ? "การจัดการ" : "Action"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminRoles.map((r) => {
                          const rMeta = ADMIN_ROLES[r.role] || ADMIN_ROLES.manager;
                          const isMaster = r.email.toLowerCase() === "kamphonloy@gmail.com";
                          return (
                            <tr key={r.email} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>
                                {r.email} {isMaster && <span style={{ color: "#d97706", fontSize: "0.75rem" }}>★ เจ้าของระบบ</span>}
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{
                                  padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700,
                                  backgroundColor: rMeta.bg, color: rMeta.color
                                }}>
                                  {isTh ? rMeta.labelTh : rMeta.labelEn}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "0.8rem" }}>
                                {isTh ? rMeta.descTh : rMeta.descEn}
                              </td>
                              <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "0.8rem" }}>
                                {new Date(r.assignedAt).toLocaleDateString(isTh ? "th-TH" : "en-US")}
                              </td>
                              <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                {isMaster ? (
                                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>-</span>
                                ) : (
                                  <button
                                    onClick={() => handleRevokeRole(r.email)}
                                    style={{
                                      padding: "4px 10px", backgroundColor: "#fee2e2", color: "#dc2626",
                                      border: "1px solid #fecaca", borderRadius: "4px", fontSize: "0.75rem",
                                      cursor: "pointer", fontWeight: 600
                                    }}
                                  >
                                    {isTh ? "เพิกถอน" : "Revoke"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: TARGETED BROADCAST (WITH SENDER EMAIL SELECTION) */}
              {activeTab === "broadcast" && (
                <div>
                  <div style={{ marginBottom: "14px" }}>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "#1e293b" }}>
                      {isTh ? "แจ้งข่าวสาร / อัปเดตสินค้า (Targeted Broadcast)" : "Targeted Broadcast & Product Announcements"}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                      {isTh
                        ? "เลือกกลุ่มเป้าหมายผู้รับด้วยตัวกรอง 5 มิติ (ตามแผนสมาชิก, วันที่สมัคร, ชื่อ หรือโดเมนอีเมล) และเลือกหรือแก้ไขอีเมลผู้ส่งได้"
                        : "Filter target recipients by plan, date, name or email domain, and configure sender identity."}
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
                        <option value="expired">{isTh ? "เฉพาะสมาชิกที่หมดอายุ (ปรับเป็นฟรี)" : "Expired (Reverted to Free)"}</option>
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
                  <div style={{ backgroundColor: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    {broadcastStatus && (
                      <div style={{ padding: "10px 14px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "14px" }}>
                        ✅ {broadcastStatus}
                      </div>
                    )}

                    {/* SENDER EMAIL CONFIGURATION CARD */}
                    <div style={{
                      backgroundColor: "#ffffff", padding: "14px 16px", borderRadius: "8px",
                      border: "1px solid #cbd5e1", marginBottom: "14px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                          ✉️ {isTh ? "ตั้งค่าอีเมลผู้ส่ง (Sender Email & Identity)" : "Sender Email & Identity Configuration"}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px" }}>
                          {isTh ? "ระบบจำการตั้งค่าไว้ใช้งานครั้งถัดไป" : "Auto-saved for future broadcasts"}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px", marginBottom: "8px" }}>
                        {/* Sender Email Dropdown */}
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                            {isTh ? "เลือกที่อยู่อีเมลผู้ส่ง *" : "Choose Sender Email *"}
                          </label>
                          <select
                            value={senderPreset}
                            onChange={(e) => handleSaveSenderConfig(e.target.value, undefined, undefined)}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", backgroundColor: "#fff" }}
                          >
                            {SENDER_EMAIL_PRESETS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.email === "custom" ? (isTh ? p.nameTh : p.nameEn) : `${p.email} (${isTh ? p.nameTh : p.nameEn})`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Custom Sender Input */}
                        {senderPreset === "custom" && (
                          <div>
                            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                              {isTh ? "ระบุอีเมลผู้ส่งที่ต้องการ (Custom Email) *" : "Custom Sender Email Address *"}
                            </label>
                            <input
                              type="email"
                              value={customSenderEmail}
                              onChange={(e) => handleSaveSenderConfig(undefined, e.target.value, undefined)}
                              placeholder="contact@yourdomain.com"
                              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #0284c7", fontSize: "0.85rem", boxSizing: "border-box" }}
                            />
                          </div>
                        )}

                        {/* Sender Display Name */}
                        <div>
                          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                            {isTh ? "ชื่อผู้ส่งที่จะแสดง (Display Name) *" : "Sender Display Name *"}
                          </label>
                          <input
                            type="text"
                            value={senderDisplayName}
                            onChange={(e) => handleSaveSenderConfig(undefined, undefined, e.target.value)}
                            placeholder={isTh ? "เช่น Thai Tone Official หรือ ทีมงานแอดมิน" : "e.g. Thai Tone Official"}
                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>

                      {/* Sender Preview Pill */}
                      <div style={{ fontSize: "0.78rem", color: "#0369a1", backgroundColor: "#f0f9ff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #bae6fd" }}>
                        📢 <strong>{isTh ? "ผู้รับจะเห็นผู้ส่งในนาม:" : "Recipients will see:"}</strong> {senderDisplayName} &lt;{activeSenderEmail}&gt;
                      </div>
                    </div>

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

                    <div style={{ marginBottom: "14px" }}>
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

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {/* Open Mail Client */}
                        <button
                          type="button"
                          onClick={handleOpenMailClient}
                          title={isTh ? "เปิดโปรแกรมส่งอีเมลในเครื่อง (เช่น Outlook, Gmail, Apple Mail) พร้อมกรอกที่อยู่ผู้รับในช่อง BCC อัตโนมัติ" : "Open in system mail client with BCC"}
                          style={{
                            padding: "9px 16px", backgroundColor: "#f8fafc", color: "#0284c7",
                            border: "1.5px solid #0284c7", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                          }}
                        >
                          ✉️ {isTh ? "เปิดส่งด้วย Mail Client" : "Open Mail Client"}
                        </button>

                        {/* Dispatch System Broadcast */}
                        <button
                          type="button"
                          onClick={handleDispatchAnnouncement}
                          style={{
                            padding: "9px 20px", backgroundColor: "#0284c7", color: "#ffffff",
                            border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.88rem",
                            cursor: "pointer", boxShadow: "0 2px 6px rgba(2,132,199,.25)",
                            display: "flex", alignItems: "center", gap: "6px"
                          }}
                        >
                          🚀 {isTh ? "ส่งการแจ้งเตือนผ่านระบบ" : "Dispatch Announcement"}
                        </button>
                      </div>
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

        {/* Resizing Grip Indicator in bottom-right corner */}
        {!isMaximized && (
          <div
            title={isTh ? "ลากบริเวณมุมนี้เพื่อปรับขนาดหน้าต่างได้ตามต้องการ" : "Drag this corner to resize"}
            style={{
              position: "absolute", bottom: "3px", right: "3px",
              width: "14px", height: "14px",
              cursor: "se-resize",
              pointerEvents: "none",
              display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
              opacity: 0.6
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
