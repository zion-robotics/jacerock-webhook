import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import type { StaffUser } from '../types';

export function useAuth() {
  const { setUser, setSession, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    async function init() {
      // Check if any admin exists
      const { data: admins } = await supabase
        .from('staff_users')
        .select('id')
        .eq('role', 'ADMIN')
        .limit(1);

      if (!admins || admins.length === 0) {
        setSetupRequired(true);
        setLoading(false);
        return;
      }

      // Check existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: staff } = await supabase
          .from('staff_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (staff) {
          setSession(session);
          setUser(staff as StaffUser);
        } else {
          await supabase.auth.signOut();
          logout();
        }
      }

      setLoading(false);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          logout();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { loading, setupRequired };
}
