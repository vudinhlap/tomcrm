import React, { useState, useRef } from 'react';
import { FeedJournal } from '../types';
import { formatDate } from '../utils';
import { Icons } from './Icons';

interface FeedJournalTabProps {
    feedJournals: FeedJournal[];
    addFeedJournal: (entry: { journal_date: string; image_url: string; note: string; tags: string[] }) => Promise<FeedJournal | null>;
    deleteFeedJournal: (id: string) => Promise<boolean>;
    uploadFeedImage: (file: File) => Promise<string | null>;
    readOnly: boolean;
    showNotification: (msg: string, type?: "success" | "error") => void;
}

export default function FeedJournalTab({
    feedJournals, addFeedJournal, deleteFeedJournal, uploadFeedImage, readOnly, showNotification
}: FeedJournalTabProps) {
    const [journalDate, setJournalDate] = useState(formatDate(new Date()));
    const [note, setNote] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [expandedImg, setExpandedImg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSave = async () => {
        if (!selectedFile) {
            showNotification("Vui lòng chọn hình ảnh!", "error");
            return;
        }
        setSaving(true);
        try {
            const url = await uploadFeedImage(selectedFile);
            if (!url) {
                showNotification("Lỗi tải hình lên!", "error");
                setSaving(false);
                return;
            }
            const result = await addFeedJournal({
                journal_date: journalDate,
                image_url: url,
                note,
                tags: selectedTags,
            });
            if (result) {
                showNotification("Đã lưu nhật ký thức ăn!");
                setNote("");
                setSelectedTags([]);
                setPreviewUrl(null);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                showNotification("Lỗi lưu nhật ký!", "error");
            }
        } catch {
            showNotification("Lỗi không xác định!", "error");
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Xoá nhật ký này?")) return;
        const ok = await deleteFeedJournal(id);
        if (ok) showNotification("Đã xoá");
        else showNotification("Lỗi xoá!", "error");
    };

    const sorted = [...feedJournals].sort((a, b) => b.journal_date.localeCompare(a.journal_date) || b.created_at.localeCompare(a.created_at));

    return (
        <div className="p-4 animate-[fadeIn_0.3s_ease]">
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #0d6e5b 0%, #0a8754 100%)',
                borderRadius: 18,
                padding: '24px 24px',
                marginBottom: 16,
                color: '#fff',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(13,110,91,0.2)',
            }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🦐</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>Nhật ký thức ăn</div>
                <div style={{ fontSize: 15, opacity: 0.85, marginTop: 4, fontWeight: 500 }}>Ghi chép hàng ngày</div>
            </div>

            {/* Add new entry form */}
            {!readOnly && (
                <div className="bg-white rounded-[14px] border border-borderLight shadow-sm p-5 mb-4">
                    <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>Thêm mới</div>

                    {/* Image upload */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 15, fontWeight: 700, color: '#5a7068', display: 'block', marginBottom: 8 }}>
                            Hình ảnh
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '2px dashed #d4e0db',
                                borderRadius: 12,
                                padding: previewUrl ? 0 : '28px 16px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: '#f7faf9',
                                transition: 'all 0.2s',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" style={{
                                    width: '100%',
                                    maxHeight: 220,
                                    objectFit: 'cover',
                                    display: 'block',
                                    borderRadius: 10,
                                }} />
                            ) : (
                                <>
                                    <div style={{ color: '#8a9e96', marginBottom: 8 }}>
                                        <Icons.Camera />
                                    </div>
                                    <div style={{ fontSize: 16, color: '#8a9e96', fontWeight: 700 }}>
                                        Nhấn để chọn hình
                                    </div>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Date */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 15, fontWeight: 700, color: '#5a7068', display: 'block', marginBottom: 8 }}>Ngày</label>
                        <input
                            type="date"
                            value={journalDate}
                            onChange={e => setJournalDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                border: '1.5px solid #d4e0db',
                                borderRadius: 10,
                                fontSize: 16,
                                background: '#f7faf9',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Tags */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 15, fontWeight: 700, color: '#5a7068', display: 'block', marginBottom: 8 }}>Loại</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['Nước', 'Thức ăn', 'Thuốc'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 20,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        border: '1.5px solid',
                                        borderColor: selectedTags.includes(tag) ? '#0d6e5b' : '#d4e0db',
                                        background: selectedTags.includes(tag) ? '#eafcf8' : '#fff',
                                        color: selectedTags.includes(tag) ? '#0d6e5b' : '#5a7068',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div style={{ marginBottom: 18 }}>
                        <label style={{ fontSize: 15, fontWeight: 700, color: '#5a7068', display: 'block', marginBottom: 8 }}>Ghi chú</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={2}
                            placeholder="Ghi chú về thức ăn, liều lượng..."
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                border: '1.5px solid #d4e0db',
                                borderRadius: 10,
                                fontSize: 16,
                                background: '#f7faf9',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex justify-center items-center gap-2 p-4 bg-primary text-white rounded-lg font-bold text-[17px] hover:bg-primaryDark active:scale-95 transition-all disabled:opacity-50"
                    >
                        {saving ? "Đang lưu..." : <><Icons.Check /> Lưu nhật ký</>}
                    </button>
                </div>
            )}

            {/* Journal entries */}
            {sorted.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#8a9e96',
                }}>
                    <div style={{ fontSize: 48, marginBottom: 10 }}>📷</div>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>Chưa có nhật ký nào</div>
                    <div style={{ fontSize: 15, marginTop: 6 }}>Bắt đầu ghi chép thức ăn cho tôm</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {sorted.map(entry => (
                        <div key={entry.id} className="bg-white rounded-[14px] border border-borderLight shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                minHeight: 140,
                            }}>
                                {/* Left: Image */}
                                <div
                                    style={{ position: 'relative', cursor: 'pointer' }}
                                    onClick={() => setExpandedImg(entry.image_url)}
                                >
                                    <img
                                        src={entry.image_url}
                                        alt="Feed"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            minHeight: 140,
                                            display: 'block',
                                        }}
                                    />
                                </div>

                                {/* Right: Date + Note */}
                                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    {entry.tags && entry.tags.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                                            {entry.tags.map(tag => (
                                                <span key={tag} style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: '#0d6e5b',
                                                    background: '#ffffff',
                                                    border: '1px solid #0d6e5b',
                                                    padding: '4px 10px',
                                                    borderRadius: 16,
                                                    boxShadow: '0 1px 2px rgba(13, 110, 91, 0.1)'
                                                }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{
                                        fontSize: 15,
                                        fontWeight: 800,
                                        color: '#0d6e5b',
                                        marginBottom: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}>
                                        <Icons.Clock />
                                        {entry.journal_date}
                                    </div>
                                    {entry.note && (
                                        <div style={{
                                            fontSize: 15,
                                            color: '#1a2e28',
                                            lineHeight: 1.6,
                                            wordBreak: 'break-word',
                                        }}>
                                            {entry.note}
                                        </div>
                                    )}
                                    {!readOnly && (
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            style={{
                                                marginTop: 12,
                                                padding: '6px 14px',
                                                fontSize: 14,
                                                color: '#c4432b',
                                                background: '#fce8e4',
                                                border: 'none',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                fontWeight: 700,
                                                alignSelf: 'flex-start',
                                            }}
                                        >
                                            Xoá
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image zoom modal */}
            {expandedImg && (
                <div
                    onClick={() => setExpandedImg(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                        cursor: 'zoom-out',
                    }}
                >
                    <img
                        src={expandedImg}
                        alt="Expanded"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            borderRadius: 12,
                            objectFit: 'contain',
                        }}
                    />
                </div>
            )}
        </div>
    );
}
