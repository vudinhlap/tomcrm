import React, { useState } from 'react';
import { useAuth, UserRole } from '../hooks/useAuth';

export default function AuthScreen() {
    const { signIn, signUp, loading } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<UserRole>('editor');
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        let err: string | null;
        if (mode === 'login') {
            err = await signIn(email, password);
        } else {
            if (!fullName.trim()) { setError('Vui lòng nhập họ tên'); setSubmitting(false); return; }
            err = await signUp(email, password, fullName, role, role === 'viewer' ? inviteCode : undefined);
        }

        if (err) setError(err);
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #094d3f 0%, #0d6e5b 50%, #0f8267 100%)' }}>
                <div style={{ color: 'white', fontSize: 18, fontWeight: 600 }}>Đang tải...</div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #094d3f 0%, #0d6e5b 50%, #0f8267 100%)',
            padding: 16,
        }}>
            <div style={{
                width: '100%',
                maxWidth: 420,
                background: 'rgba(255,255,255,0.97)',
                borderRadius: 20,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #094d3f, #0d6e5b)',
                    padding: '32px 24px 28px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: 56, height: 56,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                        backdropFilter: 'blur(10px)',
                        fontSize: 28,
                    }}>
                        🦐
                    </div>
                    <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0, fontFamily: 'serif', letterSpacing: -0.5 }}>
                        TômCRM
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '4px 0 0', fontWeight: 500 }}>
                        Quản lý tài chính nuôi tôm
                    </p>
                </div>

                {/* Tab toggle */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e8efeb', background: '#f7faf9' }}>
                    {(['login', 'register'] as const).map(m => (
                        <button key={m} onClick={() => { setMode(m); setError(null); }}
                            style={{
                                flex: 1, padding: '14px 0', border: 'none', background: 'none',
                                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                color: mode === m ? '#0d6e5b' : '#8a9e96',
                                borderBottom: mode === m ? '2.5px solid #0d6e5b' : '2.5px solid transparent',
                                transition: 'all 0.2s ease',
                            }}>
                            {m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {mode === 'register' && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Họ tên</label>
                            <input
                                type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                placeholder="Nguyễn Văn A" style={inputStyle} required
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="email@example.com" style={inputStyle} required
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Mật khẩu</label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" style={inputStyle} required minLength={6}
                        />
                    </div>

                    {mode === 'register' && (
                        <>
                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Vai trò</label>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {([
                                        { value: 'editor' as UserRole, label: '✏️ Biên tập', desc: 'Tạo & quản lý dữ liệu' },
                                        { value: 'viewer' as UserRole, label: '👁️ Xem', desc: 'Chỉ xem dữ liệu' },
                                    ]).map(r => (
                                        <button key={r.value} type="button" onClick={() => setRole(r.value)}
                                            style={{
                                                flex: 1, border: role === r.value ? '2px solid #0d6e5b' : '2px solid #e8efeb',
                                                borderRadius: 12, padding: '12px 8px', cursor: 'pointer',
                                                background: role === r.value ? '#e8f5e9' : 'white',
                                                transition: 'all 0.2s ease', textAlign: 'center',
                                            }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: role === r.value ? '#0d6e5b' : '#333' }}>
                                                {r.label}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#8a9e96', marginTop: 4 }}>{r.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {role === 'viewer' && (
                                <div style={{ marginBottom: 16 }}>
                                    <label style={labelStyle}>Mã mời</label>
                                    <input
                                        type="text" value={inviteCode}
                                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                        placeholder="Nhập mã mời từ tài khoản chính"
                                        style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase' }}
                                        required maxLength={8}
                                    />
                                    <div style={{ fontSize: 11, color: '#8a9e96', marginTop: 4 }}>
                                        Liên hệ quản trị viên để nhận mã mời
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                            padding: '10px 14px', marginBottom: 16, color: '#c4432b',
                            fontSize: 13, fontWeight: 600,
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={submitting}
                        style={{
                            width: '100%', padding: '14px', border: 'none', borderRadius: 12,
                            background: submitting ? '#8a9e96' : 'linear-gradient(135deg, #094d3f, #0d6e5b)',
                            color: 'white', fontWeight: 700, fontSize: 15, cursor: submitting ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: submitting ? 'none' : '0 4px 14px rgba(13,110,91,0.3)',
                        }}>
                        {submitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: '#8a9e96', marginBottom: 6, textTransform: 'uppercase',
    letterSpacing: '0.5px',
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e8efeb',
    borderRadius: 10, fontSize: 14, outline: 'none',
    transition: 'all 0.2s ease', background: 'white',
    boxSizing: 'border-box',
};
