// src/pages/Auth/Login.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Login = () => {
  const [tendangnhap, setTendangnhap] = useState('');
  // Chúng ta vẫn giữ state matkhau để gửi lên API, nhưng mặc định là một giá trị nào đó 
  // hoặc để trống nếu Backend của bạn cho phép.
  const [matkhau] = useState('123456'); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dialog ca làm việc
  const [caDialog, setCaDialog] = useState(false);
  const [caMode, setCaMode] = useState<'moMoi' | 'caCu'>('moMoi');
  const [caCu, setCaCu] = useState<any>(null);
  const [tiendauca, setTiendauca] = useState<number>(0);
  const [savingCa, setSavingCa] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Chỉ cần kiểm tra tên đăng nhập
    if (!tendangnhap) {
      setError('Vui lòng nhập tên tài khoản');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Gửi tên đăng nhập và mật khẩu mặc định (hoặc rỗng) lên server
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

      if (vaitro === 'thungan') {
        await kiemTraCa(result.user);
        return;
      }

      navigate('/tables');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đăng nhập vào tài khoản này');
    } finally {
      setLoading(false);
    }
  };

  // ... (Giữ nguyên logic kiemTraCa, handleMoCaMoi, handleTiepTucCaCu của bạn)
  const kiemTraCa = async (user: any) => {
    try {
      const res = await api.getActiveShift();
      const caHienTai = res.data.data;
      if (!caHienTai) {
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
      if (caCu) await api.closeShift(caCu.id, 0);
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
          <div style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', textTransform: 'uppercase' }}>
             Đăng nhập nhanh (Chế độ Test)
          </div>
        </div>

        {/* Form tối giản - Bỏ ô mật khẩu */}
        <form onSubmit={handleSubmit} className="p-fluid">
          {error && (
            <div className="mb-4">
              <Message severity="error" text={error} className="w-full justify-content-start"
                style={{ background: 'transparent', border: 'none', color: '#ff6b6b' }} />
            </div>
          )}
          <div className="field mb-5">
            <label style={{ fontSize: '10px', color: '#c9973a', letterSpacing: '2px', fontWeight: 'bold' }}>
              NHẬP TÊN TÀI KHOẢN
            </label>
            <span className="p-input-icon-left mt-2">
              <i className="pi pi-user" style={{ color: '#444' }} />
              <InputText value={tendangnhap} onChange={e => setTendangnhap(e.target.value)}
                placeholder="Ví dụ: admin, thungan1..."
                style={{ padding: '12px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', paddingLeft: '35px' }}
                autoFocus />
            </span>
          </div>
          
          <Button type="submit" label={loading ? 'Đang xác thực...' : 'VÀO HỆ THỐNG'} loading={loading}
            style={{ background: '#c9973a', border: 'none', color: '#000', fontWeight: 'bold', padding: '12px', borderRadius: '2px', fontSize: '13px', letterSpacing: '2px' }}
            className="p-button-raised" />
        </form>

        <div className="text-center mt-6" style={{ fontSize: '10px', color: '#444', letterSpacing: '1px' }}>
          HỆ THỐNG NỘI BỘ <br />
          <span className="mt-2 block">© {new Date().getFullYear()} DOANTN</span>
        </div>
      </div>

      {/* ===== DIALOG CA LÀM VIỆC GIỮ NGUYÊN ===== */}
      <Dialog
        header={caMode === 'moMoi' ? 'Mở ca làm việc' : 'Ca làm việc chưa đóng'}
        visible={caDialog}
        style={{ width: 420 }}
        closable={false}
        onHide={() => {}}
      >
        {/* ... nội dung Dialog giống hệt code cũ của bạn ... */}
        {/* Để tiết kiệm không gian mình không lặp lại code Dialog ở đây nhé */}
      </Dialog>
    </div>
  );
};

export default Login;
