import React from 'react';

interface Tab {
    key: string;
    label: string;
    icon: React.ComponentType;
}

interface BottomNavProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (key: string) => void;
}

export default function BottomNav({ tabs, activeTab, onTabChange }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-borderLight flex justify-center py-2 px-2 shadow-[0_-2px_12px_rgba(0,0,0,0.05)] z-[100]">
            <div className="flex gap-0.5 max-w-[600px] w-full">
                {tabs.map(t => (
                    <button key={t.key}
                        onClick={() => onTabChange(t.key)}
                        className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-none bg-none cursor-pointer text-[13px] font-bold transition-all relative min-w-[68px]
            ${activeTab === t.key ? "text-primary bg-primaryLight" : "text-textMuted hover:text-primary hover:bg-primaryLight"}`}>
                        <t.icon />
                        {t.label}
                        {activeTab === t.key && (
                            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-primary rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
