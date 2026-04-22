// src/pages/Auth/Login.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Login = () => {
  const [tendangnhap, setTendangnhap] = useState('');
  const [matkhau, setMatkhau]         = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  // Dialog ca làm việc
  const [caDialog, setCaDialog]       = useState(false);
  const [caMode, setCaMode]           = useState<'moMoi' | 'caCu'>('moMoi');
  const [caCu, setCaCu]               = useState<any>(null);
  const [tiendauca, setTiendauca]     = useState<number>(0);
  const [savingCa, setSavingCa]       = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const toast     = useRef<Toast>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tendangnhap || !matkhau) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await login(tendangnhap, matkhau);
      if (!result.success) {
        setError(result.message);
        return;
      }

      const vaitro = result.user?.vaitro;

      if (vaitro === 'bep') {
        navigate('/kitchen');
        return;
      }

      // Thu ngân → kiểm tra ca
      if (vaitro === 'thungan') {
        await kiemTraCa(result.user);
        return;
      }

      navigate('/tables');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  const kiemTraCa = async (user: any) => {
    try {
      const res = await api.getActiveShift();
      const caHienTai = res.data.data;

      if (!caHienTai) {
        // Không có ca đang mở → bắt buộc mở ca mới
        setCaMode('moMoi');
        setCaCu(null);
        setCaDialog(true);
        return;
      }

      if (caHienTai.nguoidungid === user.id) {
        navigate('/tables');
        return;
      }

      setCaMode('caCu');
      setCaCu(caHienTai);
      setCaDialog(true);
    } catch {
      navigate('/tables');
    }
  };

  const handleMoCaMoi = async () => {
    setSavingCa(true);
    try {
      if (caCu) {
        await api.closeShift(caCu.id, 0);
      }
      await api.openShift(tiendauca);
      setCaDialog(false);
      navigate('/tables');
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: e.response?.data?.message });
    } finally { setSavingCa(false); }
  };

  const handleTiepTucCaCu = () => {
    setCaDialog(false);
    navigate('/tables');
  };

  return (
    <div className="min-h-screen flex align-items-center justify-content-center p-3"
      style={{ background: 'radial-gradient(circle, #1a1a1a 0%, #080808 100%)' }}>
      <Toast ref={toast} />

      <div className="p-5 shadow-8" style={{
        width: '100%', maxWidth: '400px', background: '#121212',
        border: '1px solid rgba(201, 151, 58, 0.2)', borderRadius: '4px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex align-items-center justify-content-center mb-3"
            style={{ width: '56px', height: '56px', border: '1px solid #c9973a', transform: 'rotate(45deg)', marginBottom: '2rem' }}>
            <i className="pi pi-home" style={{ color: '#c9973a', fontSize: '1.5rem', transform: 'rotate(-45deg)' }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#f0e6d3', letterSpacing: '4px', margin: '0 0 10px 0', fontWeight: '400' }}>
            DCOFFE
          </h2>
          <div style={{ fontSize: '10px', color: '#888', letterSpacing: '5px', textTransform: 'uppercase' }}>
            Hệ thống quản lý quán cà phê
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-fluid">
          {error && (
            <div className="mb-4">
              <Message severity="error" text={error} className="w-full justify-content-start"
                style={{ background: 'transparent', border: 'none', color: '#ff6b6b' }} />
            </div>
          )}
          <div className="field mb-4">
            <label style={{ fontSize: '10px', color: '#c9973a', letterSpacing: '2px', fontWeight: 'bold' }}>
              TÊN ĐĂNG NHẬP
            </label>
            <span className="p-input-icon-left mt-2">
              <i className="pi pi-user" style={{ color: '#444' }} />
              <InputText value={tendangnhap} onChange={e => setTendangnhap(e.target.value)}
                placeholder="Username"
                style={{ padding: '5px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', paddingLeft: '30px' }}
                autoFocus />
            </span>
          </div>
          <div className="field mb-5">
            <label style={{ fontSize: '10px', color: '#c9973a', letterSpacing: '2px', fontWeight: 'bold' }}>
              MẬT KHẨU
            </label>
            <span className="p-input-icon-left mt-2">
              <i className="pi pi-lock" style={{ color: '#444', zIndex: 1 }} />
              <Password value={matkhau} onChange={e => setMatkhau(e.target.value)}
                placeholder="Password"
                inputStyle={{ padding: '5px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', paddingLeft: '25px' }}
                toggleMask feedback={false} />
            </span>
          </div>
          <Button type="submit" label={loading ? 'Đang đăng nhập...' : 'Đăng nhập'} loading={loading}
            style={{ background: '#c9973a', border: 'none', color: '#000', fontWeight: 'bold', padding: '10px', borderRadius: '2px', fontSize: '13px', letterSpacing: '2px' }}
            className="p-button-raised" />
        </form>

        <div className="text-center mt-6" style={{ fontSize: '10px', color: '#444', letterSpacing: '1px' }}>
          CUA HANG COFFE CUA DUC <br />
          <span className="mt-2 block">© {new Date().getFullYear()} DOANTN</span>
        </div>
      </div>

      {/*  DIALOG CA LÀM VIỆC  */}
      <Dialog
        header={caMode === 'moMoi' ? 'Mở ca làm việc' : 'Ca làm việc chưa đóng'}
        visible={caDialog}
        style={{ width: 420 }}
        closable={false} 
        onHide={() => {}}
      >
        <div style={{ paddingTop: 8 }}>
          {/* Cảnh báo ca cũ */}
          {caMode === 'caCu' && caCu && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef4444', padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}>
                <i className="pi pi-exclamation-triangle" style={{ marginRight: 6 }} />
                Có ca làm việc chưa đóng
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>
                Nhân viên: <span style={{ color: '#f0e6d3' }}>{caCu.hoten}</span>
              </div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                Bắt đầu: <span style={{ color: '#f0e6d3' }}>{new Date(caCu.thoigianbatdau).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          )}

          {caMode === 'moMoi' && (
            <>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                Vui lòng mở ca trước khi bắt đầu làm việc.
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#c9973a', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                  TIỀN ĐẦU CA (đ)
                </label>
                <InputNumber className="w-full" value={tiendauca}
                  onValueChange={e => setTiendauca(e.value || 0)}
                  locale="vi-VN" min={0} />
                <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
                  Số tiền mặt có trong két khi bắt đầu ca
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <Button label="Mở ca" icon="pi pi-check" size="small" loading={savingCa}
                  style={{ background: '#22c55e', border: 'none', color: '#000' }}
                  onClick={handleMoCaMoi} />
              </div>
            </>
          )}

          {caMode === 'caCu' && (
            <>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                Chọn một trong hai cách xử lý:
              </div>

              {/* Option 1: Đóng ca cũ + mở ca mới */}
              <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#f0e6d3', fontWeight: 600, marginBottom: 8 }}>
                  Đóng ca cũ và mở ca mới
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#c9973a', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                    TIỀN ĐẦU CA MỚI (đ)
                  </label>
                  <InputNumber className="w-full" value={tiendauca}
                    onValueChange={e => setTiendauca(e.value || 0)}
                    locale="vi-VN" min={0} />
                </div>
                <Button label="Đóng ca cũ & Mở ca mới" icon="pi pi-refresh" size="small"
                  loading={savingCa} severity="warning"
                  style={{ marginTop: 10, width: '100%' }}
                  onClick={handleMoCaMoi} />
              </div>

              {/* Option 2: Tiếp tục ca cũ */}
              <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', padding: 14 }}>
                <div style={{ fontSize: 12, color: '#f0e6d3', fontWeight: 600, marginBottom: 4 }}>
                  Tiếp tục ca hiện tại
                </div>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
                  Gộp vào ca đang mở của {caCu?.hoten}
                </div>
                <Button label="Tiếp tục ca hiện tại" icon="pi pi-arrow-right" size="small"
                  severity="secondary" style={{ width: '100%' }}
                  onClick={handleTiepTucCaCu} />
              </div>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
};

export default Login;
