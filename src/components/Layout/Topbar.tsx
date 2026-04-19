// src/components/Layout/Topbar.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard':        'Dashboard',
  '/tables':           'Danh sách bàn',
  '/tables/map':       'Sơ đồ bàn',
  '/pos':              'Đặt món',
  '/orders':           'Đơn hàng',
  '/kitchen':          'Màn hình bếp',
  '/payment':          'Thanh toán',
  '/menu':             'Thực đơn',
  '/menu/categories':  'Danh mục món',
};

const Topbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'Restaurant POS';

  return (
    <div style={{
      height: 52,
      background: '#0f0f0f',
      borderBottom: '1px solid #1e1e1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      flexShrink: 0,
    }}>
      {/* Title */}
      <div style={{ fontSize: 13, color: '#888', letterSpacing: 1 }}>
        {title}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Tên user */}
        <div style={{ fontSize: 12, color: '#555' }}>
          <span style={{ color: '#c9973a' }}>{user?.hoten}</span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            background: 'transparent',
            border: '1px solid #2a2a2a',
            color: '#555',
            padding: '5px 12px',
            fontSize: 11,
            cursor: 'pointer',
            letterSpacing: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#c9973a';
            (e.currentTarget as HTMLButtonElement).style.color = '#c9973a';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2a';
            (e.currentTarget as HTMLButtonElement).style.color = '#555';
          }}
        >
          <i className="pi pi-sign-out" style={{ fontSize: 11 }} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Topbar;