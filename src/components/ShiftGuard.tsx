// src/components/ShiftGuard.tsx
// Bọc các route của thu ngân — nếu chưa mở ca thì redirect về trang mở ca
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ShiftGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [checking, setChecking]   = useState(true);
  const [coDangMo, setCoDangMo]   = useState(false);

  useEffect(() => {
    if (user?.vaitro !== 'thungan') {
      // Không phải thu ngân → không cần check
      setChecking(false);
      setCoDangMo(true);
      return;
    }
    checkCa();
  }, [user]);

  const checkCa = async () => {
    try {
      const res = await api.getActiveShift();
      setCoDangMo(!!res.data.data);
    } catch {
      setCoDangMo(false);
    } finally { setChecking(false); }
  };

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#c9973a', fontSize: 12, letterSpacing: 2 }}>
      ĐANG KIỂM TRA CA...
    </div>
  );

  // Thu ngân chưa mở ca → redirect về trang shifts để mở ca
  if (user?.vaitro === 'thungan' && !coDangMo) {
    return <Navigate to="/shifts" replace />;
  }

  return <>{children}</>;
};

export default ShiftGuard;