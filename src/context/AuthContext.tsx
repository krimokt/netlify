'use client';

import { User, AuthError } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError } | undefined>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: AuthError } | undefined>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          console.log("User session found:", sessionData.session.user.id);
          setUser(sessionData.session.user);
          
          // Save user profile data to localStorage for faster profile page loading
          const profileData = {
            first_name: sessionData.session.user.user_metadata?.first_name || "",
            last_name: sessionData.session.user.user_metadata?.last_name || "",
            email: sessionData.session.user.email || "",
            phone: sessionData.session.user.user_metadata?.phone || "",
            country: sessionData.session.user.user_metadata?.country || "",
            avatar_url: sessionData.session.user.user_metadata?.avatar_url || "",
            updated_at: new Date().toISOString()
          };
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('profileData', JSON.stringify(profileData));
            console.log("User profile data saved to localStorage during session check");
          }
        } else {
          console.log("No active session found");
          setUser(null);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial session check
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("User signed in:", session.user.id);
          setUser(session.user);
          
          // Save user profile data to localStorage when signed in
          const profileData = {
            first_name: session.user.user_metadata?.first_name || "",
            last_name: session.user.user_metadata?.last_name || "",
            email: session.user.email || "",
            phone: session.user.user_metadata?.phone || "",
            country: session.user.user_metadata?.country || "",
            avatar_url: session.user.user_metadata?.avatar_url || "",
            updated_at: new Date().toISOString()
          };
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('profileData', JSON.stringify(profileData));
            console.log("User profile data saved to localStorage on auth state change");
          }
          
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setUser(null);
          
          // Clear profile data from localStorage on sign out
          if (typeof window !== 'undefined') {
            localStorage.removeItem('profileData');
            console.log("Profile data removed from localStorage on sign out");
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log("Sign in response:", data ? "Data received" : "No data", error ? "Error occurred" : "No error");
      
      if (error) {
        console.error("Sign in error details:", error);
        return { error: error as AuthError };
      }
      console.log("Sign in successful, user:", data.user?.id);
      
      // Save user profile data to localStorage for faster profile page loading
      if (data.user && typeof window !== 'undefined') {
        const profileData = {
          first_name: data.user.user_metadata?.first_name || "",
          last_name: data.user.user_metadata?.last_name || "",
          email: data.user.email || "",
          phone: data.user.user_metadata?.phone || "",
          country: data.user.user_metadata?.country || "",
          avatar_url: data.user.user_metadata?.avatar_url || "",
          updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('profileData', JSON.stringify(profileData));
        console.log("User profile data saved to localStorage during sign in");
      }
      
      // Force a hard redirect that bypasses middleware
      window.location.href = '/dashboard-home';
      
      return undefined;
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      
      if (error) {
        return { error: error as AuthError };
      }
      return undefined;
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 