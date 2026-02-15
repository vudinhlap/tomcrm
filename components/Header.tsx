import React, { useState } from 'react';
import { Icons } from './Icons';

interface HeaderProps {
    title?: string;
    subtitle?: string;
    userEmail?: string;
    userName?: string;
    userRole?: string;
    inviteCode?: string | null;
    onSignOut?: () => void;
}

export default function Header({
    title = "TômCRM",
    subtitle = "Quản lý tài chính nuôi tôm",
    userEmail,
    userName,
    userRole,
    inviteCode,
    onSignOut,
}: HeaderProps) {
    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="bg-gradient-to-br from-primaryDark via-primary to-[#0f8267] px-5 py-4 text-white">
            <div className="flex items-center gap-2.5 max-w-[600px] mx-auto">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
                    <Icons.Shrimp />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xl font-extrabold tracking-tighter font-serif">{title}</div>
                    <div className="text-[13px] opacity-80 font-medium">{subtitle}</div>
                </div>
                {userEmail && (
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <div className="text-[14px] font-semibold truncate max-w-[140px]">{userName || userEmail}</div>
                            <div className="text-[12px] opacity-70 font-medium">
                                {userRole === 'editor' ? '✏️ Biên tập' : '👁️ Xem'}
                            </div>
                        </div>
                        {onSignOut && (
                            <button onClick={onSignOut} title="Đăng xuất"
                                style={{
                                    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10,
                                    padding: '8px 10px', cursor: 'pointer', color: 'white', fontSize: 14,
                                    display: 'flex', alignItems: 'center', backdropFilter: 'blur(10px)',
                                }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Invite code banner for editors */}
            {userRole === 'editor' && inviteCode && (
                <div className="max-w-[600px] mx-auto mt-2">
                    <button onClick={() => setShowCode(!showCode)}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 10, padding: '6px 12px', cursor: 'pointer', color: 'white',
                            fontSize: 11, fontWeight: 600, width: '100%', textAlign: 'left',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                        <span>📋 Mã mời cho viewer</span>
                        <span style={{ opacity: 0.7 }}>{showCode ? '▲' : '▼'}</span>
                    </button>
                    {showCode && (
                        <div style={{
                            background: 'rgba(255,255,255,0.15)', borderRadius: '0 0 10px 10px',
                            padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            <code style={{ fontSize: 18, fontWeight: 800, letterSpacing: 3 }}>{inviteCode}</code>
                            <button onClick={copyCode}
                                style={{
                                    background: copied ? 'rgba(10,135,84,0.8)' : 'rgba(255,255,255,0.2)',
                                    border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                                    color: 'white', fontSize: 11, fontWeight: 600,
                                }}>
                                {copied ? '✓ Đã copy' : 'Copy'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
