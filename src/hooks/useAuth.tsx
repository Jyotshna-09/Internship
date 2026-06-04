import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  signInAsGuest: (name: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Load guest name if exists
  useEffect(() => {
    const guestName = localStorage.getItem("moonlight_guest_name");
    if (guestName) {
      setIsGuest(true);
      setProfile({
        id: "guest",
        name: guestName,
        email: "guest@offline.local",
        avatar_url: null,
        created_at: new Date().toISOString(),
      });
    }
  }, []);

  const refreshProfile = async () => {
    if (!hasSupabaseConfig) return;
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (currentUser) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    }
  };

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        // Fetch profile
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setProfile(data);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          setIsGuest(false);
          localStorage.removeItem("moonlight_guest_name"); // Clear guest on login
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentSession.user.id)
            .single();
          if (!error && data) {
            setProfile(data);
          }
        } else {
          setProfile(null);
          localStorage.removeItem("moonlight_garden_v1");
          window.dispatchEvent(new Event("moonlight:update"));
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isGuest) {
      localStorage.removeItem("moonlight_guest_name");
      localStorage.removeItem("moonlight_garden_v1");
      setIsGuest(false);
      setProfile(null);
      // Dispatch update to trigger game state reset
      window.dispatchEvent(new Event("moonlight:update"));
      return;
    }
    if (hasSupabaseConfig) {
      localStorage.removeItem("moonlight_garden_v1");
      await supabase.auth.signOut();
    }
  };

  const signInAsGuest = (name: string) => {
    localStorage.setItem("moonlight_guest_name", name);
    setIsGuest(true);
    setProfile({
      id: "guest",
      name: name,
      email: "guest@offline.local",
      avatar_url: null,
      created_at: new Date().toISOString(),
    });
    // Dispatch update to trigger game state load
    window.dispatchEvent(new Event("moonlight:update"));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isGuest,
        signOut,
        signInAsGuest,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
