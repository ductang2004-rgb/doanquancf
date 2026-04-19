import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import api from '../../services/api';

interface ChiTiet {
  id: number; tenmon: string; soluong: number;
  dongia: number; thanhtien: number;
}
interface DonHang {
  id: number; madon: string; tenban?: string; loai: string;
  trangthai: string; tongtien: number; tiengiam: number;
  thue: number; tongthanhtoan: number; chitiet: ChiTiet[];
}
interface HoaDon {
  id: number; mahoadon: string; tongtien: number;
  phuongthucthanhtoan: string; thoigianthanhtoan: string;
  tenthungan: string; tienkhacdua: number; tienthua: number;
}
interface IKhuyenMai {
  id: number; makm: string; tenkm: string;
  loai: 'giamphantra' | 'giamtien' | 'combo';
  giatri: number; trangthai: string;
}

const phuongThucOptions = [
  { label: 'Tiền mặt', value: 'tienmat', icon: 'pi-wallet' },
  { label: 'Chuyển khoản', value: 'chuyenkhoan', icon: 'pi-credit-card' },
  { label: 'Ví điện tử', value: 'vidientu', icon: 'pi-mobile' },
];

const tinhTienGiam = (km: IKhuyenMai, tongTien: number): number => {
  if (km.loai === 'giamphantra') return Math.round((tongTien * km.giatri) / 100);
  if (km.loai === 'giamtien') return Math.min(km.giatri, tongTien);
  return km.giatri;
};

const PaymentScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<DonHang | null>(null);
  const [loading, setLoading] = useState(true);
  const [phuongThuc, setPhuongThuc] = useState('tienmat');
  const [tienKhachDua, setTienKhachDua] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  // Khuyến mãi
  const [danhSachKM, setDanhSachKM] = useState<IKhuyenMai[]>([]);
  const [selectedKM, setSelectedKM] = useState<IKhuyenMai | null>(null);
  const [showKMDialog, setShowKMDialog] = useState(false);

  // Dialog hóa đơn
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoice, setInvoice] = useState<HoaDon | null>(null);

  useEffect(() => {
    if (orderId) fetchOrder();
    else setLoading(false);
    fetchKhuyenMai();
  }, [orderId]);

  useEffect(() => {
    if (order) setTienKhachDua(Math.ceil(tongThanhToan / 1000) * 1000);
  }, [order, selectedKM]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await api.getOrder(Number(orderId));
      setOrder(res.data.data);
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không tìm thấy đơn hàng' });
    } finally { setLoading(false); }
  };

  const fetchKhuyenMai = async () => {
    try {
      const res = await api.getKhuyenMaiHieuLuc();
      setDanhSachKM(res.data.data);
    } catch { /* không hiện lỗi, KM là optional */ }
  };

  // Tính toán tiền
  const tongTien = Number(order?.tongtien) || 0;
  const thue = Number(order?.thue) || 0;

  // Nếu có chọn KM thì tính lại, không thì dùng tongthanhtoan từ DB
  const tienGiam = selectedKM
    ? tinhTienGiam(selectedKM, tongTien)
    : 0;

  const tongThanhToan = selectedKM
    ? Math.max(0, tongTien - tienGiam + thue)
    : Number(order?.tongthanhtoan) || 0;
  const tienThua = phuongThuc === 'tienmat' ? Math.max(0, tienKhachDua - tongThanhToan) : 0;

  const handleChonKM = (km: IKhuyenMai) => {
    setSelectedKM(km);
    setShowKMDialog(false);
    toast.current?.show({ severity: 'success', summary: 'Áp dụng thành công', detail: `Đã áp dụng "${km.tenkm}"` });
  };

  const handleBoKM = () => {
    setSelectedKM(null);
    toast.current?.show({ severity: 'info', summary: 'Đã bỏ khuyến mãi' });
  };

  const handlePayment = async () => {
    if (!order) return;
    if (phuongThuc === 'tienmat' && tienKhachDua < tongThanhToan) {
      toast.current?.show({ severity: 'warn', summary: 'Không đủ tiền', detail: 'Tiền khách đưa không đủ' });
      return;
    }
    setProcessing(true);
    try {
      const res = await api.processPayment({
        donhangid: order.id,
        phuongthucthanhtoan: phuongThuc,
        tienkhacdua: phuongThuc === 'tienmat' ? tienKhachDua : tongThanhToan,
        tienthua: tienThua,
        khuyenmaiid: selectedKM?.id || null,
        tiengiam: tienGiam,
        tongthanhtoan: tongThanhToan,
      });
      setInvoice(res.data.data);
      setInvoiceDialog(true);
      toast.current?.show({ severity: 'success', summary: 'Thanh toán thành công!' });
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    } finally { setProcessing(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#c9973a' }}>
      Đang tải...
    </div>
  );

  if (!order && !orderId) return (
    <div style={{ textAlign: 'center', color: '#555', marginTop: 60 }}>
      <i className="pi pi-info-circle" style={{ fontSize: 32, marginBottom: 16, display: 'block' }} />
      <div>Không có đơn hàng nào để thanh toán</div>
      <Button label="Quay lại" size="small" severity="secondary"
        style={{ marginTop: 16 }} onClick={() => navigate('/tables')} />
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 16, maxWidth: 900, margin: '0 auto' }}>
      <Toast ref={toast} />

      {/* ===== CHI TIẾT ĐƠN HÀNG ===== */}
      <div style={{ flex: 1, background: '#141414', border: '1px solid #1e1e1e', padding: 20 }}>
        <div style={{ color: '#c9973a', fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>CHI TIẾT ĐƠN HÀNG</div>

        {order && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Mã đơn:</span>
              <span style={{ fontSize: 12, color: '#f0e6d3' }}>{order.madon}</span>
            </div>
            {order.tenban && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#888' }}>Bàn:</span>
                <span style={{ fontSize: 12, color: '#f0e6d3' }}>{order.tenban}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Loại:</span>
              <span style={{ fontSize: 12, color: '#f0e6d3' }}>
                {order.loai === 'taiban' ? 'Tại bàn' : 'Mang đi'}
              </span>
            </div>

            {/* Danh sách món */}
            <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 12, marginBottom: 12 }}>
              {order.chitiet?.map(item => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: '1px solid #111'
                }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#f0e6d3' }}>{item.tenmon}</span>
                    <span style={{ fontSize: 11, color: '#666', marginLeft: 8 }}>x{item.soluong}</span>
                  </div>
                  <span style={{ fontSize: 13, color: '#c9973a' }}>
                    {Number(item.thanhtien).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>

            {/* Tổng tiền */}
            <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#888' }}>Tạm tính:</span>
                <span style={{ fontSize: 12, color: '#f0e6d3' }}>
                  {Number(tongTien).toLocaleString('vi-VN')}đ
                </span>
              </div>

              {/* Khuyến mãi */}
              {tienGiam > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#888' }}>
                    Giảm giá {selectedKM ? `(${selectedKM.tenkm})` : ''}:
                  </span>
                  <span style={{ fontSize: 12, color: '#22c55e' }}>
                    -{Number(tienGiam).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}

              {thue > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#888' }}>Thuế (10%):</span>
                  <span style={{ fontSize: 12, color: '#f0e6d3' }}>
                    {Number(thue).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #2a2a2a' }}>
                <span style={{ fontSize: 14, color: '#f0e6d3', fontWeight: 500 }}>Tổng cộng:</span>
                <span style={{ fontSize: 18, color: '#c9973a', fontWeight: 700 }}>
                  {Number(tongThanhToan).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== THANH TOÁN ===== */}
      <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Khuyến mãi */}
        <div style={{ background: '#141414', border: '1px solid #1e1e1e', padding: 16 }}>
          <div style={{ color: '#c9973a', fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>KHUYẾN MÃI</div>
          {selectedKM ? (
            <div style={{
              background: 'rgba(34,197,94,0.08)', border: '1px solid #22c55e',
              padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>{selectedKM.tenkm}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  -{Number(tienGiam).toLocaleString('vi-VN')}đ
                </div>
              </div>
              <Button icon="pi pi-times" size="small" severity="danger" text onClick={handleBoKM} />
            </div>
          ) : (
            <Button
              label={danhSachKM.length > 0 ? `Chọn khuyến mãi (${danhSachKM.length})` : 'Không có KM hiệu lực'}
              icon="pi pi-tag"
              size="small" severity="secondary"
              disabled={danhSachKM.length === 0}
              className="w-full"
              onClick={() => setShowKMDialog(true)}
            />
          )}
        </div>

        {/* Phương thức */}
        <div style={{ background: '#141414', border: '1px solid #1e1e1e', padding: 16 }}>
          <div style={{ color: '#c9973a', fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>PHƯƠNG THỨC</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {phuongThucOptions.map(opt => (
              <button key={opt.value} onClick={() => setPhuongThuc(opt.value)}
                style={{
                  padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                  background: phuongThuc === opt.value ? 'rgba(201,151,58,0.1)' : 'transparent',
                  border: `1px solid ${phuongThuc === opt.value ? '#c9973a' : '#2a2a2a'}`,
                  color: phuongThuc === opt.value ? '#c9973a' : '#888',
                  fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                <i className={`pi ${opt.icon}`} style={{ fontSize: 14 }} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tiền mặt */}
        {phuongThuc === 'tienmat' && order && (
          <div style={{ background: '#141414', border: '1px solid #1e1e1e', padding: 16 }}>
            <div style={{ color: '#c9973a', fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>TIỀN MẶT</div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>Tiền khách đưa</label>
              <InputNumber className="w-full" value={tienKhachDua}
                onValueChange={e => setTienKhachDua(e.value || 0)}
                locale="vi-VN" min={0} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {[50000, 100000, 200000, 500000].map(amount => (
                <button key={amount} onClick={() => setTienKhachDua(amount)}
                  style={{
                    padding: '4px 8px', fontSize: 11, cursor: 'pointer',
                    background: tienKhachDua === amount ? '#c9973a' : 'transparent',
                    border: `1px solid ${tienKhachDua === amount ? '#c9973a' : '#2a2a2a'}`,
                    color: tienKhachDua === amount ? '#000' : '#888',
                  }}>
                  {amount / 1000}k
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#888' }}>Tiền thừa:</span>
              <span style={{ fontSize: 14, color: tienThua >= 0 ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                {tienThua.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        )}

        <Button
          label="XÁC NHẬN THANH TOÁN" icon="pi pi-check"
          loading={processing} disabled={!order}
          style={{ background: '#c9973a', border: 'none', color: '#000', fontWeight: 700, padding: 14, letterSpacing: 1 }}
          onClick={handlePayment}
        />
        <Button label="Quay lại" severity="secondary" size="small" onClick={() => navigate(-1)} />
      </div>

      {/* ===== DIALOG CHỌN KHUYẾN MÃI ===== */}
      <Dialog header="Chọn khuyến mãi" visible={showKMDialog}
        style={{ width: 420 }} onHide={() => setShowKMDialog(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
          {danhSachKM.map(km => (
            <button key={km.id} onClick={() => handleChonKM(km)}
              style={{
                padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                background: '#0f0f0f', border: '1px solid #1e1e1e',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9973a')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e1e')}
            >
              <div>
                <div style={{ fontSize: 13, color: '#f0e6d3', marginBottom: 2 }}>{km.tenkm}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{km.makm}</div>
              </div>
              <Tag
                value={km.loai === 'giamphantra' ? `${km.giatri}%` : `${Number(km.giatri).toLocaleString('vi-VN')}đ`}
                severity="success"
              />
            </button>
          ))}
        </div>
      </Dialog>

      {/* ===== DIALOG HÓA ĐƠN ===== */}
      <Dialog header="Thanh toán thành công" visible={invoiceDialog}
        style={{ width: 420 }} onHide={() => { setInvoiceDialog(false); navigate('/tables'); }}>
        {invoice && (
          <div style={{ fontFamily: 'monospace' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <i className="pi pi-check-circle" style={{ fontSize: 40, color: '#22c55e', display: 'block', marginBottom: 8 }} />
              <div style={{ fontSize: 16, color: '#f0e6d3', fontWeight: 500 }}>Đã thanh toán!</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>#{invoice.mahoadon}</div>
            </div>
            <div style={{ background: '#0f0f0f', padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#888' }}>Tổng tiền:</span>
                <span style={{ fontSize: 14, color: '#c9973a', fontWeight: 600 }}>
                  {Number(invoice.tongtien).toLocaleString('vi-VN')}đ
                </span>
              </div>
              {tienGiam > 0 && selectedKM && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#888' }}>Khuyến mãi:</span>
                  <span style={{ fontSize: 12, color: '#22c55e' }}>
                    -{Number(tienGiam).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#888' }}>Thanh toán:</span>
                <span style={{ fontSize: 12, color: '#f0e6d3' }}>
                  {phuongThucOptions.find(p => p.value === invoice.phuongthucthanhtoan)?.label}
                </span>
              </div>
              {invoice.phuongthucthanhtoan === 'tienmat' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#888' }}>Tiền khách đưa:</span>
                    <span style={{ fontSize: 12, color: '#f0e6d3' }}>
                      {Number(invoice.tienkhacdua).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#888' }}>Tiền thừa:</span>
                    <span style={{ fontSize: 12, color: '#22c55e' }}>
                      {Number(invoice.tienthua).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button label="In hóa đơn" icon="pi pi-print" size="small" severity="secondary"
                style={{ flex: 1 }} onClick={() => window.print()} />
              <Button label="Về danh sách bàn" icon="pi pi-home" size="small"
                style={{ flex: 1, background: '#c9973a', border: 'none', color: '#000' }}
                onClick={() => { setInvoiceDialog(false); navigate('/tables'); }} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default PaymentScreen;