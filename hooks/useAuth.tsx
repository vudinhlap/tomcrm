import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export type UserRole = 'editor' | 'viewer';

export interface UserProfile {
    id: string;
    full_name: string;
    role: UserRole;
    parent_id: string | null;
    invite_code: string | null;
}

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    isEditor: boolean;
    isViewer: boolean;
    /** The effective data owner ID (self for editors, parent for viewers) */
    ownerId: string | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<string | null>;
    signUp: (email: string, password: string, fullName: string, role: UserRole, inviteCode?: string) => Promise<string | null>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, role, parent_id, invite_code')
            .eq('id', userId)
            .single();
        if (error) {
            console.error('Error fetching profile:', error.message);
            setProfile(null);
        } else {
            setProfile(data as UserProfile);
        }
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) fetchProfile(session.user.id);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) fetchProfile(session.user.id);
            else setProfile(null);
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? error.message : null;
    }, []);

    const signUp = useCallback(async (
        email: string, password: string, fullName: string, role: UserRole, inviteCode?: string
    ): Promise<string | null> => {
        // For viewers, validate invite code first
        if (role === 'viewer') {
            if (!inviteCode?.trim()) return 'Vui lòng nhập mã mời từ tài khoản chính';
            const { data: editorProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('invite_code', inviteCode.trim().toUpperCase())
                .eq('role', 'editor')
                .single();
            if (!editorProfile) return 'Mã mời không hợp lệ. Vui lòng kiểm tra lại.';
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role,
                    invite_code: role === 'viewer' ? inviteCode?.trim().toUpperCase() : undefined,
                },
            },
        });
        return error ? error.message : null;
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setProfile(null);
    }, []);

    const ownerId = profile
        ? (profile.role === 'viewer' && profile.parent_id ? profile.parent_id : profile.id)
        : null;

    const value: AuthContextValue = {
        session,
        user: session?.user ?? null,
        profile,
        isEditor: profile?.role === 'editor',
        isViewer: profile?.role === 'viewer',
        ownerId,
        loading,
        signIn,
        signUp,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
