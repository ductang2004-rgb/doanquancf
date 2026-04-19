// src/pages/Orders/POS.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import socketClient from '../../services/socketClient';
import { BienThe } from '../../types';

interface MonAn {
  id: number; mamon: string; tenmon: string;
  giaban: number; hinhanh?: string; trangthai: string;
  khuvucchebien: 'bep' | 'bar';
  bienthe?: BienThe[];
}
interface NhomMon {
  nhommonid: number; tennhom: string; thutu: number;
  monan: MonAn[];
}
interface ChiTiet {
  id: number; monanid: number; tenmon: string;
  soluong: number; dongia: number; thanhtien: number;
  ghichu?: string; trangthai: string;
}
interface DonHang {
  id: number; madon: string; banid: number; tenban: string;
  trangthai: string; tongtien: number; tongthanhtoan: number;
  chitiet: ChiTiet[];
}

const trangThaiColor: Record<string, string> = {
  moi:      '#888',
  danglam:  '#eab308',
  sansang:  '#22c55e',
  daphucvu: '#3b82f6',
};
const trangThaiLabel: Record<string, string> = {
  moi: 'Mới', danglam: 'Đang làm', sansang: 'Sẵn sàng', daphucvu: 'Đã phục vụ',
};

const POS = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const toast       = useRef<Toast>(null);

  const [menu, setMenu]           = useState<NhomMon[]>([]);
  const [order, setOrder]         = useState<DonHang | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);

  const [noteDialog, setNoteDialog] = useState(false);
  const [noteItem, setNoteItem]     = useState<ChiTiet | null>(null);
  const [noteText, setNoteText]     = useState('');

  const [createDialog, setCreateDialog] = useState(false);
  const [loaiDon, setLoaiDon]           = useState<'taiban' | 'mangdi'>('taiban');
  const [creating, setCreating]         = useState(false);

  const [variantDialog, setVariantDialog] = useState(false);
  const [selectedMon, setSelectedMon]     = useState<MonAn | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<BienThe | null>(null);

  useEffect(() => {
    fetchAll();

    if (user?.id) socketClient.joinWaiterRoom(user.id);

    socketClient.onOrderUpdated(() => fetchOrder());
    socketClient.onTicketUpdated((data) => {
      fetchOrder();
      if (data?.data?.trangthai === 'sansang') {
        toast.current?.show({
          severity: 'success',
          summary: '🔔 Món sẵn sàng!',
          detail: `${data.data.tenmon} - ${data.data.tenban} đã sẵn sàng phục vụ!`,
          life: 5000
        });
      }
    });
    socketClient.onTableUpdated(() => fetchOrder());

    return () => { socketClient.removeAllListeners(); };
  }, [tableId, user?.id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMenu(), fetchOrder()]);
    } finally { setLoading(false); }
  };

  const fetchMenu = async () => {
    const res = await api.getMenuByCategory();
    setMenu(res.data.data || []);
  };

  const fetchOrder = async () => {
    if (!tableId) return;
    try {
      const res = await api.getOrderByTable(Number(tableId));
      setOrder(res.data.data);
    } catch { setOrder(null); }
  };

  const handleCreateOrder = async () => {
    setCreating(true);
    try {
      const res = await api.createOrder({ loai: loaiDon, banid: Number(tableId) });
      setOrder(res.data.data);
      setCreateDialog(false);
      toast.current?.show({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo đơn hàng' });
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    } finally { setCreating(false); }
  };

  const handleAddItem = async (mon: MonAn) => {
    if (!order) { setCreateDialog(true); return; }
    if (mon.bienthe && mon.bienthe.length > 0) {
      setSelectedMon(mon);
      setSelectedVariant(null);
      setVariantDialog(true);
      return;
    }
    try {
      await api.addItemToOrder(order.id, { monanid: mon.id, soluong: 1, dongia: mon.giaban });
      fetchOrder();
      toast.current?.show({ severity: 'success', summary: 'Đã thêm', detail: mon.tenmon, life: 1500 });
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    }
  };

  const handleAddWithVariant = async () => {
    if (!order || !selectedMon || !selectedVariant) return;
    try {
      await api.addItemToOrder(order.id, { monanid: selectedMon.id, soluong: 1, dongia: selectedVariant.giathem, bientheid: selectedVariant.id });
      fetchOrder();
      toast.current?.show({ severity: 'success', summary: 'Đã thêm', detail: `${selectedMon.tenmon} - ${selectedVariant.tenbienthe}`, life: 1500 });
      setVariantDialog(false);
      setSelectedMon(null);
      setSelectedVariant(null);
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    }
  };

  const handleQty = async (item: ChiTiet, delta: number) => {
    const newQty = Number(item.soluong) + delta;
    if (newQty <= 0) { handleDeleteItem(item); return; }
    try {
      await api.updateOrderItem(item.id, { soluong: newQty });
      fetchOrder();
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    }
  };

  const handleDeleteItem = async (item: ChiTiet) => {
    try {
      await api.deleteOrderItem(item.id);
      fetchOrder();
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    }
  };

  // Đánh dấu đã phục vụ - dùng updateOrderItem thay vì markAsServed
  const handleServed = async (item: ChiTiet) => {
    try {
      await api.updateOrderItem(item.id, { trangthai: 'daphucvu' });
      fetchOrder();
      toast.current?.show({ severity: 'info', summary: 'Đã phục vụ', detail: item.tenmon, life: 2000 });
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    }
  };

  const openNote = (item: ChiTiet) => {
    setNoteItem(item); setNoteText(item.ghichu || ''); setNoteDialog(true);
  };

  const saveNote = async () => {
    if (!noteItem) return;
    try {
      await api.updateOrderItem(noteItem.id, { ghichu: noteText });
      fetchOrder();
      setNoteDialog(false);
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    }
  };

  const handleSendToKitchen = async () => {
    if (!order) return;
    const moiIds = order.chitiet.filter(c => c.trangthai === 'moi').map(c => c.id);
    if (moiIds.length === 0) {
      toast.current?.show({ severity: 'warn', summary: 'Không có món mới', detail: 'Tất cả món đã gửi bếp' });
      return;
    }
    setSending(true);
    try {
      await api.sendToKitchen(order.id, moiIds);
      fetchOrder();
      toast.current?.show({ severity: 'success', summary: 'Đã gửi bếp', detail: `${moiIds.length} món` });
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    } finally { setSending(false); }
  };

  const handlePayment = () => {
    if (!order) return;
    navigate(`/payment?orderId=${order.id}`);
  };

  const tongtien = order?.chitiet?.reduce((s, c) => s + Number(c.thanhtien), 0) || 0;
  const soMonMoi = order?.chitiet?.filter(c => c.trangthai === 'moi').length || 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#c9973a' }}>
      Đang tải...
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 100px)' }}>
      <Toast ref={toast} />

      {/* MENU TRÁI */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#141414', border: '1px solid #1e1e1e', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#c9973a', fontSize: 11, letterSpacing: 2 }}>THỰC ĐƠN</div>
          <Button icon="pi pi-arrow-left" size="small" severity="secondary" label="Quay lại"
            onClick={() => navigate('/tables')} />
        </div>

        <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #1e1e1e', flexWrap: 'wrap' }}>
          {menu.map((nhom, i) => (
            <button key={nhom.nhommonid} onClick={() => setActiveTab(i)}
              style={{
                padding: '4px 12px', fontSize: 12, cursor: 'pointer',
                background: activeTab === i ? '#c9973a' : 'transparent',
                color: activeTab === i ? '#000' : '#888',
                border: `1px solid ${activeTab === i ? '#c9973a' : '#2a2a2a'}`,
                borderRadius: 2,
              }}>
              {nhom.tennhom}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {(menu[activeTab]?.monan || []).map(mon => (
              <div key={mon.id} onClick={() => handleAddItem(mon)}
                style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', padding: 12, cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#c9973a'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a2a'}>
                <div style={{ fontSize: 13, color: '#f0e6d3', marginBottom: 4, lineHeight: 1.3 }}>{mon.tenmon}</div>
                <div style={{ fontSize: 9, color: mon.khuvucchebien === 'bar' ? '#3b82f6' : '#f97316', marginBottom: 6 }}>
                  {mon.khuvucchebien === 'bar' ? '● BAR' : '● BẾP'}
                </div>
                <div style={{ fontSize: 13, color: '#c9973a', fontWeight: 500 }}>
                  {Number(mon.giaban).toLocaleString('vi-VN')}đ
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ORDER PHẢI */}
      <div style={{ width: 340, display: 'flex', flexDirection: 'column', background: '#141414', border: '1px solid #1e1e1e', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e1e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#c9973a', fontSize: 11, letterSpacing: 2 }}>
              {order ? `ĐƠN - ${order.madon}` : 'CHƯA CÓ ĐƠN'}
            </div>
            {order && <span style={{ fontSize: 10, color: '#888' }}>{order.tenban}</span>}
          </div>
          {!order && (
            <Button label="Tạo đơn mới" icon="pi pi-plus" size="small"
              style={{ marginTop: 8, width: '100%', background: '#c9973a', border: 'none', color: '#000' }}
              onClick={() => setCreateDialog(true)} />
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {!order || order.chitiet?.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#444', fontSize: 12, marginTop: 40 }}>Chưa có món nào</div>
          ) : (
            order.chitiet.map(item => (
              <div key={item.id} style={{
                background: '#0f0f0f', border: '1px solid #1e1e1e',
                padding: '8px 10px', marginBottom: 6,
                borderLeft: `3px solid ${trangThaiColor[item.trangthai] || '#888'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#f0e6d3' }}>{item.tenmon}</div>
                    <div style={{ fontSize: 10, color: trangThaiColor[item.trangthai], marginTop: 2 }}>
                      {trangThaiLabel[item.trangthai]}
                    </div>
                    {item.ghichu && (
                      <div style={{ fontSize: 10, color: '#666', marginTop: 2, fontStyle: 'italic' }}>{item.ghichu}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#c9973a' }}>
                    {Number(item.thanhtien).toLocaleString('vi-VN')}đ
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  {item.trangthai === 'moi' && (
                    <>
                      <button onClick={() => handleQty(item, -1)}
                        style={{ width: 24, height: 24, background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#f0e6d3', cursor: 'pointer', fontSize: 14 }}>−</button>
                      <span style={{ color: '#f0e6d3', fontSize: 13, minWidth: 20, textAlign: 'center' }}>{item.soluong}</span>
                      <button onClick={() => handleQty(item, 1)}
                        style={{ width: 24, height: 24, background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#f0e6d3', cursor: 'pointer', fontSize: 14 }}>+</button>
                      <button onClick={() => openNote(item)}
                        style={{ marginLeft: 4, background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                        <i className="pi pi-pencil" style={{ fontSize: 11 }} />
                      </button>
                      <button onClick={() => handleDeleteItem(item)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <i className="pi pi-trash" style={{ fontSize: 12 }} />
                      </button>
                    </>
                  )}
                  {item.trangthai === 'danglam' && (
                    <span style={{ fontSize: 11, color: '#eab308' }}>🔥 Đang chế biến... SL: {item.soluong}</span>
                  )}
                  {item.trangthai === 'sansang' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                      <span style={{ fontSize: 11, color: '#22c55e', flex: 1 }}>✓ Sẵn sàng - SL: {item.soluong}</span>
                      <button onClick={() => handleServed(item)}
                        style={{ padding: '4px 10px', background: '#22c55e', border: 'none', color: '#000', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
                        Đã phục vụ
                      </button>
                    </div>
                  )}
                  {item.trangthai === 'daphucvu' && (
                    <span style={{ fontSize: 11, color: '#3b82f6' }}>✓ Đã phục vụ - SL: {item.soluong}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {order && (
          <div style={{ padding: 12, borderTop: '1px solid #1e1e1e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Tổng tiền:</span>
              <span style={{ fontSize: 15, color: '#c9973a', fontWeight: 500 }}>
                {tongtien.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                label={`Gửi bếp${soMonMoi > 0 ? ` (${soMonMoi})` : ''}`}
                icon="pi pi-send" size="small" loading={sending} disabled={soMonMoi === 0}
                style={{ flex: 1, background: soMonMoi > 0 ? '#f97316' : '#2a2a2a', border: 'none', color: soMonMoi > 0 ? '#fff' : '#555' }}
                onClick={handleSendToKitchen}
              />
              <Button label="Thanh toán" icon="pi pi-credit-card" size="small"
                style={{ flex: 1, background: '#c9973a', border: 'none', color: '#000' }}
                onClick={handlePayment}
              />
            </div>
          </div>
        )}
      </div>

      {/* DIALOG TẠO ĐƠN */}
      <Dialog header="Tạo đơn hàng mới" visible={createDialog}
        style={{ width: 320 }} onHide={() => setCreateDialog(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
          <div style={{ fontSize: 13, color: '#888' }}>Loại đơn hàng:</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ label: 'Tại bàn', value: 'taiban' }, { label: 'Mang đi', value: 'mangdi' }].map(opt => (
              <button key={opt.value} onClick={() => setLoaiDon(opt.value as any)}
                style={{
                  flex: 1, padding: '10px 0', cursor: 'pointer',
                  background: loaiDon === opt.value ? '#c9973a' : 'transparent',
                  border: `1px solid ${loaiDon === opt.value ? '#c9973a' : '#2a2a2a'}`,
                  color: loaiDon === opt.value ? '#000' : '#888', fontSize: 13,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button label="Hủy" severity="secondary" size="small" onClick={() => setCreateDialog(false)} />
            <Button label="Tạo đơn" size="small" loading={creating}
              style={{ background: '#c9973a', border: 'none', color: '#000' }}
              onClick={handleCreateOrder} />
          </div>
        </div>
      </Dialog>

      {/* DIALOG GHI CHÚ */}
      <Dialog header="Ghi chú món" visible={noteDialog}
        style={{ width: 320 }} onHide={() => setNoteDialog(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
          <div style={{ fontSize: 13, color: '#c9973a' }}>{noteItem?.tenmon}</div>
          <InputTextarea value={noteText} onChange={e => setNoteText(e.target.value)}
            rows={3} placeholder="Ghi chú cho món ăn..." className="w-full" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button label="Hủy" severity="secondary" size="small" onClick={() => setNoteDialog(false)} />
            <Button label="Lưu" size="small"
              style={{ background: '#c9973a', border: 'none', color: '#000' }}
              onClick={saveNote} />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default POS;