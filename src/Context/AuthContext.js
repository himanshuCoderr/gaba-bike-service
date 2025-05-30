import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const firestore = getFirestore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let unsubscribe;
    const initAuth = async () => {
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        try {
          if (currentUser) {
            // Fetch user role from Firestore
            const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserRole(userData.role);
            }
            setUser(currentUser);
          } else {
            setUser(null);
            setUserRole(null);
            // Only redirect to login if we're not already there
            if (location.pathname !== '/signIn') {
              navigate('/signIn');
            }
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setUser(null);
          setUserRole(null);
        } finally {
          setLoading(false);
        }
      });
    };

    initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [auth, firestore, navigate, location.pathname]);

  const value = {
    user,
    loading,
    userRole,
    isSuperAdmin: () => userRole === 'superadmin',
    isSubAdmin: () => userRole === 'subadmin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

