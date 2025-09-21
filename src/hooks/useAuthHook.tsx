import React, { useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthContext, UserProfile } from './auth-context';
import { supabase } from '../lib/supabase-client';
import { devConfig } from '../config/development';
import { isOfflineMode } from '../utils/offlineMode';
import { protectFromExtensionInterference } from '../utils/extensionProtection';

interface AuthProviderProps {
  children: ReactNode;
}

const logDev = (...args: unknown[]) => {
  if (devConfig.enableAuthLogs) {
    console.log('[Auth]', ...args);
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we're in offline mode using centralized detection
  const offlineModeActive = isOfflineMode();

  const createFallbackProfile = useCallback((userId: string, email: string): UserProfile => {
    logDev('Creating fallback profile for:', email);
    return {
      id: userId,
      email: email,
      full_name: email.split('@')[0] || 'User',
      avatar_url: null,
      phone: null,
      company: 'Nawras CRM',
      bio: null,
      role: 'sales_rep' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }, []);



  const fetchUserProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      logDev('Creating user profile from auth data for:', userId);
      
      // Always use fallback profile since we don't have a users table
      if (user?.email) {
        const fallbackProfile = createFallbackProfile(userId, user.email);
        setProfile(fallbackProfile);
      }
      
      setLoading(false);
    } catch (error) {
      logDev('❌ Failed to create user profile:', error instanceof Error ? error.message : 'Unknown error');
      // Use fallback profile on any error
      if (user?.email) {
        const fallbackProfile = createFallbackProfile(userId, user.email);
        setProfile(fallbackProfile);
      }
      setLoading(false);
    }
  }, [user, createFallbackProfile]);

  useEffect(() => {
    const isTestEnvironment = typeof window !== 'undefined' && (import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true');
    
    if (offlineModeActive && !isTestEnvironment) {
      logDev('🔧 Initializing offline mode');
      const offlineSession = localStorage.getItem('offline_session');
      if (offlineSession) {
        try {
          const { user: offlineUser, session: offlineSessionData, profile: offlineProfile } = JSON.parse(offlineSession);
          setUser(offlineUser);
          setSession(offlineSessionData);
          setProfile(offlineProfile);
          logDev('✅ Offline session restored:', offlineUser.email);
        } catch (error) {
          console.error('❌ Failed to parse offline session:', error);
          localStorage.removeItem('offline_session');
        }
      }
      setLoading(false);
      return;
    }

    const initTimeout = setTimeout(() => {
      console.log('⏰ Auth initialization timeout - checking session validity');
      if (session && !user) {
        console.log('🧹 Clearing invalid session data');
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    }, devConfig.authTimeout);

    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        const { data } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            logDev('Auth state changed:', event, session?.user?.email);
            clearTimeout(initTimeout);

            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              await fetchUserProfile(session.user.id);
            } else {
              setProfile(null);
              setLoading(false);
            }
          }
        );
        subscription = data.subscription;
        
        if (isTestEnvironment) {
          const { data: { session } } = await supabase.auth.getSession();
          logDev('Initial session (test):', session?.user?.email);
          clearTimeout(initTimeout);

          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          return;
        }
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          logDev('Initial session:', session?.user?.email);
          clearTimeout(initTimeout);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setLoading(false);
          }
        } catch (error) {
          logDev('❌ Session fetch failed:', error instanceof Error ? error.message : 'Unknown error');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        clearTimeout(initTimeout);
        setLoading(false);
      }
    };

    initializeAuth();
    
    return () => {
      clearTimeout(initTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchUserProfile, createFallbackProfile, isOfflineMode]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting to sign in with:', email);
      
      const isTestEnvironment = typeof window !== 'undefined' && (import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true');
      protectFromExtensionInterference();
      
      if (offlineModeActive && !isTestEnvironment) {
        logDev('🔧 Using offline mock authentication');
        
        const validCredentials = [
          { email: 'test@example.com', password: 'TestPassword123!' },
          { email: 'dev@nawras-crm.com', password: '' }
        ];
        
        const isValidCredential = validCredentials.some(cred => 
          cred.email === email && (cred.password === password || cred.password === '')
        );
        
        if (!isValidCredential && !email.includes('@')) {
          setLoading(false);
          return {
            error: 'Invalid email format'
          };
        }
        
        const mockUserData = {
          id: `offline-user-${Date.now()}`,
          email: email,
          user_metadata: {
            full_name: email === 'test@example.com' ? 'Test User' : 
                      email === 'dev@nawras-crm.com' ? 'Development User' : 
                      email.split('@')[0]
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        };
        
        const mockSessionData = {
          access_token: 'offline-token',
          refresh_token: 'offline-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: mockUserData
        };
        
        const mockProfileData = {
          id: mockUserData.id,
          email: mockUserData.email,
          full_name: mockUserData.user_metadata.full_name,
          avatar_url: null,
          phone: null,
          company: 'Nawras CRM',
          bio: 'Offline development user',
          role: 'admin' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const offlineSession = {
          user: mockUserData,
          session: mockSessionData,
          profile: mockProfileData
        };
        
        localStorage.setItem('offline_session', JSON.stringify(offlineSession));
        
        setUser(mockUserData as unknown as User);
        setSession(mockSessionData as unknown as Session);
        setProfile(mockProfileData);
        setLoading(false);
        
        console.log('✅ Offline sign in successful:', mockUserData.email);
        return { error: undefined };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error.message);
        setLoading(false);
        return { error: error.message };
      }
      
      console.log('✅ Sign in successful:', data.user?.email);
      return { error: undefined };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      setLoading(false);
      return { 
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error?.message };
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🚪 Signing out user');
      
      setUser(null);
      setProfile(null);
      setSession(null);
      
      const isTestEnvironment = typeof window !== 'undefined' && (import.meta.env.MODE === 'test' || import.meta.env.VITEST === 'true');
      if (offlineModeActive && !isTestEnvironment) {
        logDev('🔧 Clearing offline session');
        localStorage.removeItem('offline_session');
        setLoading(false);
        console.log('✅ Offline sign out successful');
        
        if (!isTestEnvironment) {
          window.location.href = '/login';
        }
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error.message);
        setLoading(false);
        throw new Error(error.message);
      }
      
      console.log('✅ Sign out successful');
      setLoading(false);
      
      if (!isTestEnvironment) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('❌ Sign out exception:', error);
      setLoading(false);
      throw error instanceof Error ? error : new Error('Sign out failed');
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user logged in' };
    
    try {
      // Update profile locally since we don't have a users table
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      console.log('✅ Profile updated locally');
      return { error: undefined };
    } catch (error) {
      console.error('❌ Profile update exception:', error);
      return { 
        error: error instanceof Error ? error.message : 'Profile update failed'
      };
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      // Refresh profile from auth data since we don't have a users table
      if (user?.email) {
        const fallbackProfile = createFallbackProfile(user.id, user.email);
        setProfile(fallbackProfile);
      }
      console.log('✅ Profile refreshed from auth data');
    } catch (error) {
      console.error('❌ Profile refresh exception:', error);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}