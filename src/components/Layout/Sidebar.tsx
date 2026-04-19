// src/components/Layout/Sidebar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  roles?: string[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: 'pi-chart-bar', path: '/dashboard' },
  { label: 'Sơ đồ bàn', icon: 'pi-th-large', path: '/tables/map' },
  { label: 'Danh sách bàn', icon: 'pi-list', path: '/tables' },
  { label: 'Đặt món (POS)', icon: 'pi-shopping-cart', path: '/pos' },
  { label: 'Bếp', icon: 'pi-fire', path: '/kitchen', roles: ['bep', 'bar', 'admin'] },
  { label: 'Thanh toán', icon: 'pi-credit-card', path: '/payment' },
  { label: 'Thực đơn', icon: 'pi-book', path: '/menu', roles: ['admin'] },
  { label: 'MenuPublic', icon: 'pi-menu', path: '/menu-public'},
  { label: 'Nhân viên', icon: 'pi-users', path: '/users', roles: ['admin'] },
  { label: 'Khuyến mãi', icon: 'pi-tags', path: '/promotions', roles: ['admin'] },
  { label: 'Nguyên liệu', icon: 'pi-box', path: '/materials', roles: ['admin'] },
  { label: 'Ca Làm việc', icon: 'pi-clock', path: '/shifts', roles: ['thungan', 'admin'] }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const filtered = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.vaitro || '')
  );

  return (
    <div style={{
      width: 220,
      minHeight: '100vh',
      background: '#0f0f0f',
      borderRight: '1px solid #1e1e1e',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32,
          border: '1px solid #c9973a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="pi pi-home" style={{ color: '#c9973a', fontSize: 14 }} />
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#f0e6d3', letterSpacing: 2, fontFamily: 'Georgia, serif' }}>
            RESTAURANT
          </div>
          <div style={{ fontSize: 9, color: '#5a5a5a', letterSpacing: 2 }}>POS SYSTEM</div>
        </div>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {filtered.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                cursor: 'pointer',
                background: isActive ? 'rgba(201,151,58,0.1)' : 'transparent',
                borderLeft: isActive ? '2px solid #c9973a' : '2px solid transparent',
                color: isActive ? '#c9973a' : '#666',
                fontSize: 13,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.color = '#aaa';
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.color = '#666';
              }}
            >
              <i className={`pi ${item.icon}`} style={{ fontSize: 14, width: 16 }} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* User info */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #1e1e1e',
        fontSize: 12,
        color: '#444',
      }}>
        <div style={{ color: '#888', marginBottom: 2 }}>{user?.hoten}</div>
        <div style={{ fontSize: 10, color: '#333', letterSpacing: 1, textTransform: 'uppercase' }}>
          {user?.vaitro}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;