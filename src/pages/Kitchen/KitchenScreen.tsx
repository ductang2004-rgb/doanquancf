// src/pages/Kitchen/KitchenScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Badge } from 'primereact/badge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import socketClient from '../../services/socketClient';

interface Ticket {
  id: number; maphieu: string;
  tenmon: string; soluong: number;
  ghichumon?: string; tenban: string; madon: string;
  trangthai: 'moi' | 'danglam' | 'sansang';
  thoigiantao: string; thoigianbatdau?: string; thoigianhoanthanh?: string;
  bienthe?: { tenbienthe: string }[];
}

interface KitchenData { moi: Ticket[]; danglam: Ticket[]; sansang: Ticket[]; }

const KitchenScreen = () => {
  const [khuvuc, setKhuvuc] = useState<'bep' | 'bar'>('bep');
  const [data, setData]     = useState<KitchenData>({ moi: [], danglam: [], sansang: [] });
  const [loading, setLoading] = useState(true);
  const toast = useRef<Toast>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    socketClient.joinKitchenRoom(khuvuc);
    socketClient.onNewTicket(() => fetchData());
    socketClient.onTicketUpdated(() => fetchData());
    return () => { socketClient.removeAllListeners(); };
  }, [khuvuc]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getKitchenByArea(khuvuc);
      setData(res.data.data || { moi: [], danglam: [], sansang: [] });
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải dữ liệu' });
    } finally { setLoading(false); }
  };

  const handleStart = async (id: number) => {
    try {
      await api.startCooking(id);
      fetchData();
      toast.current?.show({ severity: 'info', summary: 'Bắt đầu làm', life: 1500 });
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    }
  };

  const handleFinish = async (id: number) => {
    try {
      await api.finishCooking(id);
      fetchData();
      toast.current?.show({ severity: 'success', summary: 'Món sẵn sàng!', life: 2000 });
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    }
  };

  const getWaitTime = (thoigiantao: string) => {
    const diff = Math.floor((Date.now() - new Date(thoigiantao).getTime()) / 1000 / 60);
    return diff;
  };

  const getTimeColor = (minutes: number) => {
    if (minutes < 5)  return '#22c55e';
    if (minutes < 10) return '#eab308';
    return '#ef4444';
  };

  const TicketCard = ({ ticket, col }: { ticket: Ticket; col: 'moi' | 'danglam' | 'sansang' }) => {
    const wait = getWaitTime(ticket.thoigiantao);
    return (
      <div style={{
        background: '#141414',
        border: `1px solid ${col === 'moi' ? '#2a2a2a' : col === 'danglam' ? '#eab30840' : '#22c55e40'}`,
        padding: 12, marginBottom: 8,
        borderLeft: `3px solid ${col === 'moi' ? '#888' : col === 'danglam' ? '#eab308' : '#22c55e'}`,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#c9973a', letterSpacing: 1 }}>{ticket.maphieu}</span>
          <span style={{ fontSize: 11, color: getTimeColor(wait), fontWeight: 500 }}>{wait} phút</span>
        </div>

        {/* Tên món */}
        <div style={{ fontSize: 16, color: '#f0e6d3', fontWeight: 500, marginBottom: 4 }}>
          {ticket.tenmon}
          <span style={{ fontSize: 13, color: '#c9973a', marginLeft: 8 }}>x{ticket.soluong}</span>
        </div>

        {/* Biến thể */}
        {ticket.bienthe && ticket.bienthe.length > 0 && (
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
            {ticket.bienthe.map(b => b.tenbienthe).join(', ')}
          </div>
        )}

        {/* Ghi chú */}
        {ticket.ghichumon && (
          <div style={{ fontSize: 11, color: '#f97316', fontStyle: 'italic', marginBottom: 8 }}>
            ⚠ {ticket.ghichumon}
          </div>
        )}

        {/* Bàn */}
        <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>
          {ticket.tenban} • {ticket.madon}
        </div>

        {/* Nút action */}
        {col === 'moi' && (
          <Button label="Bắt đầu làm" icon="pi pi-play" size="small"
            style={{ width: '100%', background: '#eab308', border: 'none', color: '#000' }}
            onClick={() => handleStart(ticket.id)} />
        )}
        {col === 'danglam' && (
          <Button label="Hoàn thành" icon="pi pi-check" size="small"
            style={{ width: '100%', background: '#22c55e', border: 'none', color: '#000' }}
            onClick={() => handleFinish(ticket.id)} />
        )}
        {col === 'sansang' && (
          <div style={{ fontSize: 11, color: '#22c55e', textAlign: 'center', padding: '4px 0' }}>
            ✓ Sẵn sàng phục vụ
          </div>
        )}
      </div>
    );
  };

  const colStyle = (color: string): React.CSSProperties => ({
    flex: 1, display: 'flex', flexDirection: 'column',
    background: '#0f0f0f', border: `1px solid #1e1e1e`,
    borderTop: `3px solid ${color}`, overflow: 'hidden',
  });

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Toast ref={toast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ color: '#c9973a', fontSize: 11, letterSpacing: 3 }}>MÀN HÌNH BẾP</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(['bep', 'bar'] as const).map(k => (
            <button key={k} onClick={() => setKhuvuc(k)}
              style={{
                padding: '6px 20px', cursor: 'pointer', fontSize: 12, letterSpacing: 1,
                background: khuvuc === k ? '#c9973a' : 'transparent',
                border: `1px solid ${khuvuc === k ? '#c9973a' : '#2a2a2a'}`,
                color: khuvuc === k ? '#000' : '#888',
              }}>
              {k === 'bep' ? 'BẾP' : 'BAR'}
            </button>
          ))}
          <Button icon="pi pi-refresh" size="small" severity="secondary" onClick={fetchData} />
        </div>
      </div>

      {/* Kanban */}
      <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden' }}>

        {/* CỘT MÓN MỚI */}
        <div style={colStyle('#888')}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#888', letterSpacing: 2 }}>MÓN MỚI</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#888' }}>{data.moi.length}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
            {loading ? <div style={{ color: '#555', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Đang tải...</div>
              : data.moi.length === 0 ? <div style={{ color: '#333', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Không có món</div>
              : data.moi.map(t => <TicketCard key={t.id} ticket={t} col="moi" />)}
          </div>
        </div>

        {/* CỘT ĐANG LÀM */}
        <div style={colStyle('#eab308')}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#eab308', letterSpacing: 2 }}>ĐANG LÀM</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#eab308' }}>{data.danglam.length}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
            {loading ? <div style={{ color: '#555', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Đang tải...</div>
              : data.danglam.length === 0 ? <div style={{ color: '#333', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Không có món</div>
              : data.danglam.map(t => <TicketCard key={t.id} ticket={t} col="danglam" />)}
          </div>
        </div>

        {/* CỘT SẴN SÀNG */}
        <div style={colStyle('#22c55e')}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#22c55e', letterSpacing: 2 }}>SẴN SÀNG</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>{data.sansang.length}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
            {loading ? <div style={{ color: '#555', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Đang tải...</div>
              : data.sansang.length === 0 ? <div style={{ color: '#333', fontSize: 12, textAlign: 'center', marginTop: 20 }}>Không có món</div>
              : data.sansang.map(t => <TicketCard key={t.id} ticket={t} col="sansang" />)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenScreen;