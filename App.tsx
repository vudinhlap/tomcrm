import React, { useState, useMemo, useCallback } from "react";
import { NotificationState } from "./types";
import { Icons } from "./components/Icons";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useSupabaseData } from "./hooks/useSupabaseData";
import AuthScreen from "./components/AuthScreen";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import OverviewTab from "./components/OverviewTab";
import InputTab from "./components/InputTab";
import TransactionListTab from "./components/TransactionListTab";
import FeedJournalTab from "./components/FeedJournalTab";
import SettingsTab from "./components/SettingsTab";

const TABS = [
  { key: "overview", label: "Tổng quan", icon: Icons.Overview },
  { key: "input", label: "Nhập chi phí", icon: Icons.Input },
  { key: "transactions", label: "Sổ giao dịch", icon: Icons.List },
  { key: "journal", label: "Nhật ký", icon: Icons.Feed },
  { key: "settings", label: "Cài đặt", icon: Icons.Settings },
];

function AppContent() {
  const { session, profile, isEditor, ownerId, signOut } = useAuth();
  const data = useSupabaseData(ownerId);

  const [activeTab, setActiveTab] = useState("overview");
  const [settingsSubTab, setSettingsSubTab] = useState("categories");
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = useCallback((msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const addAuditLog = useCallback(async (action: any, entity: string, entity_id: any, before_data: any, after_data: any) => {
    await data.addAuditLog({
      actor: profile?.full_name || session?.user?.email || "user",
      action, entity, entity_id,
      before_data, after_data,
    });
  }, [data, profile, session]);

  const activeTxns = useMemo(() => data.transactions.filter(t => !t.is_deleted), [data.transactions]);

  /* If not authenticated, show login screen */
  if (!session) return <AuthScreen />;

  /* Loading data */
  if (data.loading) {
    return (
      <div className="min-h-screen font-sans text-text flex items-center justify-center">
        <div style={{ textAlign: 'center', color: '#8a9e96' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🦐</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-text">
      <Header
        userEmail={session.user?.email}
        userName={profile?.full_name}
        userRole={profile?.role}
        inviteCode={profile?.invite_code}
        onSignOut={signOut}
      />

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 rounded-xl text-white font-semibold text-[13px] animate-[slideIn_0.3s_ease] shadow-lg
          ${notification.type === "success" ? "bg-income" : "bg-danger"}`}>
          {notification.msg}
        </div>
      )}

      {/* Content */}
      <div className="max-w-[600px] mx-auto pb-20">
        {activeTab === "overview" && (
          <OverviewTab txns={activeTxns} wallets={data.wallets} categories={data.categories} />
        )}
        {activeTab === "input" && (
          isEditor ? (
            <InputTab
              wallets={data.wallets} categories={data.categories} customFields={data.customFields}
              onSave={async (txn) => {
                const saved = await data.addTransaction(txn);
                if (saved) {
                  await addAuditLog("CREATE", "TRANSACTION", saved.id, null, saved);
                  showNotification("Đã lưu giao dịch thành công!");
                  setActiveTab("transactions");
                } else {
                  showNotification("Lỗi lưu giao dịch!", "error");
                }
              }}
            />
          ) : (
            <div className="p-8 text-center">
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
              <h3 style={{ color: '#333', marginBottom: 8, fontSize: 16, fontWeight: 700 }}>Chỉ đọc</h3>
              <p style={{ color: '#8a9e96', fontSize: 13 }}>
                Tài khoản của bạn chỉ có quyền xem. Liên hệ quản trị viên để được cấp quyền thêm dữ liệu.
              </p>
            </div>
          )
        )}
        {activeTab === "transactions" && (
          <TransactionListTab
            txns={activeTxns} wallets={data.wallets} categories={data.categories} customFields={data.customFields}
            onDelete={isEditor ? async (id) => {
              const txn = data.transactions.find(t => t.id === id);
              const ok = await data.softDeleteTransaction(id);
              if (ok) {
                await addAuditLog("DELETE", "TRANSACTION", id, txn, { is_deleted: true });
                showNotification("Đã xoá giao dịch");
              }
            } : undefined}
          />
        )}
        {activeTab === "journal" && (
          <FeedJournalTab
            feedJournals={data.feedJournals}
            addFeedJournal={data.addFeedJournal}
            deleteFeedJournal={data.deleteFeedJournal}
            uploadFeedImage={data.uploadFeedImage}
            readOnly={!isEditor}
            showNotification={showNotification}
          />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            subTab={settingsSubTab} setSubTab={setSettingsSubTab}
            wallets={data.wallets} setWallets={() => { }}
            categories={data.categories} setCategories={() => { }}
            customFields={data.customFields} setCustomFields={() => { }}
            auditLogs={data.auditLogs} showNotification={showNotification}
            addAuditLog={addAuditLog} transactions={activeTxns}
            feedJournals={data.feedJournals}
            readOnly={!isEditor}
            supabaseData={data}
          />
        )}
      </div>

      <BottomNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}