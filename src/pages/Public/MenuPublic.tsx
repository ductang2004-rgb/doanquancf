// src/pages/Public/MenuPublic.tsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface MonAn {
  id: number; tenmon: string; giaban: number;
  mota?: string; hinhanh?: string; khuvucchebien: string;
}
interface NhomMon {
  nhommonid: number; tennhom: string; thutu: number;
  monan: MonAn[];
}

const MenuPublic = () => {
  const [menu, setMenu]         = useState<NhomMon[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    api.getMenuByCategory()
      .then(res => setMenu(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = menu.map(nhom => ({
    ...nhom,
    monan: (nhom.monan || []).filter(m =>
      !search || m.tenmon.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(nhom => nhom.monan.length > 0);

  const displayMenu = search ? filtered : menu.filter(n => (n.monan || []).length > 0);
  const activeNhom  = search ? displayMenu : [displayMenu[activeTab]].filter(Boolean);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .mp-root {
          min-height: 100vh;
          background: #1a120b;
          font-family: 'Lato', sans-serif;
          color: #f0e6d3;
        }

        /* Header */
        .mp-header {
          background: linear-gradient(180deg, #0d0905 0%, #1a120b 100%);
          border-bottom: 1px solid #3d2b1a;
          padding: 32px 24px 0;
          text-align: center;
          position: sticky; top: 0; z-index: 100;
        }

        .mp-logo {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          color: #c9973a;
          letter-spacing: 4px;
          margin-bottom: 4px;
        }

        .mp-subtitle {
          font-size: 12px;
          color: #7a5c3a;
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .mp-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .mp-divider-line { width: 60px; height: 1px; background: #3d2b1a; }
        .mp-divider-star { color: #c9973a; font-size: 14px; }

        /* Search */
        .mp-search-wrap {
          max-width: 400px;
          margin: 0 auto 20px;
          position: relative;
        }
        .mp-search {
          width: 100%;
          padding: 10px 16px 10px 40px;
          background: rgba(255,255,255,0.05);
          border: 1px solid #3d2b1a;
          border-radius: 40px;
          color: #f0e6d3;
          font-family: 'Lato', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .mp-search:focus { border-color: #c9973a; }
        .mp-search::placeholder { color: #5a4030; }
        .mp-search-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: #5a4030; font-size: 14px;
        }

        /* Tabs */
        .mp-tabs {
          display: flex;
          gap: 0;
          overflow-x: auto;
          justify-content: center;
          flex-wrap: wrap;
          padding-bottom: 0;
        }
        .mp-tabs::-webkit-scrollbar { display: none; }

        .mp-tab {
          padding: 10px 20px;
          font-family: 'Lato', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #7a5c3a;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .mp-tab:hover { color: #c9973a; }
        .mp-tab.active {
          color: #c9973a;
          border-bottom-color: #c9973a;
        }

        /* Content */
        .mp-content {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px 60px;
        }

        /* Section */
        .mp-section { margin-bottom: 48px; }

        .mp-section-title {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          color: #c9973a;
          text-align: center;
          margin-bottom: 6px;
        }
        .mp-section-sub {
          text-align: center;
          font-size: 11px;
          color: #5a4030;
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .mp-section-line {
          width: 60px; height: 1px;
          background: #3d2b1a;
          margin: 0 auto 28px;
        }

        /* Grid món */
        .mp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        /* Card món */
        .mp-card {
          background: #231810;
          border: 1px solid #3d2b1a;
          border-radius: 4px;
          overflow: hidden;
          transition: transform 0.2s, border-color 0.2s;
          display: flex;
          flex-direction: column;
        }
        .mp-card:hover {
          transform: translateY(-3px);
          border-color: #c9973a;
        }

        .mp-card-img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }
        .mp-card-img-placeholder {
          width: 100%;
          height: 120px;
          background: #2a1c10;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3d2b1a;
          font-size: 32px;
        }

        .mp-card-body {
          padding: 14px 16px 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .mp-card-name {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          color: #f0e6d3;
          margin-bottom: 6px;
          line-height: 1.3;
        }

        .mp-card-desc {
          font-size: 12px;
          color: #7a5c3a;
          line-height: 1.5;
          flex: 1;
          margin-bottom: 10px;
        }

        .mp-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mp-card-price {
          font-size: 17px;
          color: #c9973a;
          font-weight: 700;
          font-family: 'Playfair Display', serif;
        }

        .mp-card-tag {
          font-size: 9px;
          padding: 3px 8px;
          border-radius: 20px;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 700;
        }
        .mp-card-tag.bep {
          background: rgba(249,115,22,0.15);
          color: #f97316;
          border: 1px solid rgba(249,115,22,0.3);
        }
        .mp-card-tag.bar {
          background: rgba(59,130,246,0.15);
          color: #3b82f6;
          border: 1px solid rgba(59,130,246,0.3);
        }

        /* Loading */
        .mp-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #c9973a;
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          letter-spacing: 2px;
        }

        /* Empty */
        .mp-empty {
          text-align: center;
          padding: 60px 20px;
          color: #5a4030;
        }
        .mp-empty-icon { font-size: 40px; margin-bottom: 16px; }
        .mp-empty-text { font-size: 14px; }

        /* Footer */
        .mp-footer {
          text-align: center;
          padding: 24px;
          border-top: 1px solid #2a1c10;
          color: #3d2b1a;
          font-size: 11px;
          letter-spacing: 2px;
        }

        @media (max-width: 600px) {
          .mp-logo { font-size: 26px; }
          .mp-grid { grid-template-columns: 1fr; }
          .mp-tab { padding: 8px 14px; font-size: 11px; }
        }
      `}</style>

      <div className="mp-root">
        {/* Header */}
        <div className="mp-header">
          <div className="mp-logo">RESTAURANT</div>
          <div className="mp-subtitle">Thực đơn</div>
          <div className="mp-divider">
            <div className="mp-divider-line" />
            <span className="mp-divider-star">★★★★★</span>
            <div className="mp-divider-line" />
          </div>

          {/* Search */}
          <div className="mp-search-wrap">
            <i className="pi pi-search mp-search-icon" />
            <input
              className="mp-search"
              placeholder="Tìm món ăn..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Tabs nhóm món */}
          {!search && (
            <div className="mp-tabs">
              {menu.filter(n => (n.monan || []).length > 0).map((nhom, i) => (
                <button
                  key={nhom.nhommonid}
                  className={`mp-tab ${activeTab === i ? 'active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {nhom.tennhom}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mp-content">
          {loading ? (
            <div className="mp-loading">Đang tải thực đơn...</div>
          ) : activeNhom.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty-icon">🔍</div>
              <div className="mp-empty-text">Không tìm thấy món nào</div>
            </div>
          ) : (
            activeNhom.map(nhom => (
              <div key={nhom.nhommonid} className="mp-section">
                <div className="mp-section-title">{nhom.tennhom}</div>
                <div className="mp-section-line" />

                <div className="mp-grid">
                  {(nhom.monan || []).map(mon => (
                    <div key={mon.id} className="mp-card">
                      {mon.hinhanh ? (
                        <img src={mon.hinhanh} alt={mon.tenmon} className="mp-card-img"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="mp-card-img-placeholder">
                          {mon.khuvucchebien === 'bar' ? '🥤' : '🍽️'}
                        </div>
                      )}
                      <div className="mp-card-body">
                        <div className="mp-card-name">{mon.tenmon}</div>
                        {mon.mota && <div className="mp-card-desc">{mon.mota}</div>}
                        <div className="mp-card-footer">
                          <div className="mp-card-price">
                            {Number(mon.giaban).toLocaleString('vi-VN')}đ
                          </div>
                          <span className={`mp-card-tag ${mon.khuvucchebien}`}>
                            {mon.khuvucchebien === 'bar' ? 'Bar' : 'Bếp'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mp-footer">
          © {new Date().getFullYear()} RESTAURANT • Cảm ơn quý khách
        </div>
      </div>
    </>
  );
};

export default MenuPublic;