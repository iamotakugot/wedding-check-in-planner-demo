/**
 * Custom hook สำหรับ Admin Authentication
 */

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AuthService } from '@/services/firebase/AuthService';

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const authService = AuthService.getInstance();
    
    const unsubscribe = authService.onAuthStateChange(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        const adminStatus = await authService.checkIsAdmin(authUser.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    const authService = AuthService.getInstance();
    await authService.logout();
    setUser(null);
    setIsAdmin(false);
  };

  return {
    user,
    isAdmin,
    isLoading,
    logout,
  };
};

