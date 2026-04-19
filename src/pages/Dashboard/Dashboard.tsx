// src/pages/Dashboard/Dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Stats {
    sohoadon: number; tongthu: number;
    giatrithbinh: number; tienmat: number;
    chuyenkhoan: number; vidientu: number;
}
interface BanStat { trong: number; cokhach: number; dattruoc: number; tong: number; }
interface PhieuBep { moi: number; danglam: number; sansang: number; }

const filterOptions = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Năm nay', value: 'year' },
    { label: 'Tùy chọn', value: 'custom' },
];

const getDateRange = (filter: string): { tungay: string; denngay: string } => {
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const denngay = fmt(now);

    switch (filter) {
        case 'today':
            return { tungay: fmt(now), denngay };
        case 'week': {
            const d = new Date(now);
            d.setDate(d.getDate() - d.getDay() + 1);
            return { tungay: fmt(d), denngay };
        }
        case 'month': {
            const d = new Date(now.getFullYear(), now.getMonth(), 1);
            return { tungay: fmt(d), denngay };
        }
        case 'year': {
            const d = new Date(now.getFullYear(), 0, 1);
            return { tungay: fmt(d), denngay };
        }
        default:
            return { tungay: fmt(now), denngay };
    }
};

const COLORS = ['#c9973a', '#22c55e', '#3b82f6', '#ef4444', '#a855f7'];

const Dashboard = () => {
    const navigate = useNavigate();
    const toast = useRef<Toast>(null);
    const { user } = useAuth();

    const [filter, setFilter] = useState('today');
    const [customRange, setCustomRange] = useState<[Date | null, Date | null]>([null, null]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [banStat, setBanStat] = useState<BanStat>({ trong: 0, cokhach: 0, dattruoc: 0, tong: 0 });
    const [bepStat, setBepStat] = useState<PhieuBep>({ moi: 0, danglam: 0, sansang: 0 });
    const [barStat, setBarStat] = useState<PhieuBep>({ moi: 0, danglam: 0, sansang: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAll(); }, [filter, customRange]);

    const getRange = () => {
        if (filter === 'custom' && customRange[0] && customRange[1]) {
            return {
                tungay: customRange[0].toISOString().slice(0, 10),
                denngay: customRange[1].toISOString().slice(0, 10),
            };
        }
        return getDateRange(filter);
    };

    const fetchAll = async () => {
        if (filter === 'custom' && (!customRange[0] || !customRange[1])) return;
        setLoading(true);
        try {
            const range = getRange();
            const promises: Promise<any>[] = [
                api.getTables(),
                api.getKitchenByArea('bep'),
                api.getKitchenByArea('bar'),
            ];
            if (user?.vaitro === 'admin') {
                promises.push(api.getRevenueStats(range));
            }

            const [tableRes, bepRes, barRes, statsRes] = await Promise.all(promises);

            const tables = tableRes.data.data || [];
            setBanStat({
                trong: tables.filter((t: any) => t.trangthai === 'trong').length,
                cokhach: tables.filter((t: any) => t.trangthai === 'cokhach').length,
                dattruoc: tables.filter((t: any) => t.trangthai === 'dattruoc').length,
                tong: tables.length,
            });

            const bep = bepRes.data.data || { moi: [], danglam: [], sansang: [] };
            setBepStat({
                moi: bep.moi?.length || 0,
                danglam: bep.danglam?.length || 0,
                sansang: bep.sansang?.length || 0,
            });

            const bar = barRes.data.data || { moi: [], danglam: [], sansang: [] };
            setBarStat({
                moi: bar.moi?.length || 0,
                danglam: bar.danglam?.length || 0,
                sansang: bar.sansang?.length || 0,
            });

            if (statsRes) setStats(statsRes.data.data);
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải dữ liệu' });
        } finally { setLoading(false); }
    };

    // Data cho biểu đồ
    const pieData = stats ? [
        { name: 'Tiền mặt', value: Number(stats.tienmat || 0) },
        { name: 'Chuyển khoản', value: Number(stats.chuyenkhoan || 0) },
        { name: 'Ví điện tử', value: Number(stats.vidientu || 0) },
    ].filter(d => d.value > 0) : [];

    const barData = [
        { name: 'Bếp', 'Món mới': bepStat.moi, 'Đang làm': bepStat.danglam, 'Sẵn sàng': bepStat.sansang },
        { name: 'Bar', 'Món mới': barStat.moi, 'Đang làm': barStat.danglam, 'Sẵn sàng': barStat.sansang },
    ];

    const banData = [
        { name: 'Trống', value: banStat.trong, color: '#22c55e' },
        { name: 'Có khách', value: banStat.cokhach, color: '#ef4444' },
        { name: 'Đặt trước', value: banStat.dattruoc, color: '#eab308' },
    ];

    const StatCard = ({ title, value, sub, color, icon, onClick }: any) => (
        <div onClick={onClick} style={{
            background: '#141414', border: '1px solid #1e1e1e',
            borderTop: `3px solid ${color}`, padding: '16px 18px',
            cursor: onClick ? 'pointer' : 'default', flex: 1, minWidth: 140,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: 10, color: '#666', letterSpacing: 2, marginBottom: 8 }}>{title}</div>
                    <div style={{ fontSize: 22, color, fontWeight: 600 }}>{value}</div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{sub}</div>
                </div>
                <i className={`pi ${icon}`} style={{ fontSize: 20, color, opacity: 0.35 }} />
            </div>
        </div>
    );

    const SectionTitle = ({ title }: { title: string }) => (
        <div style={{ fontSize: 11, color: '#c9973a', letterSpacing: 2, marginBottom: 12, marginTop: 4 }}>{title}</div>
    );

    const fmt = (n: number) => Number(n || 0).toLocaleString('vi-VN');

    return (
        <div style={{ maxWidth: 1100 }}>
            <Toast ref={toast} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                    <div style={{ fontSize: 18, color: '#f0e6d3', marginBottom: 4 }}>
                        Xin chào, <span style={{ color: '#c9973a' }}>{user?.hoten}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#555' }}>
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Filter thời gian */}
                {user?.vaitro === 'admin' && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Dropdown value={filter} options={filterOptions} onChange={e => setFilter(e.value)}
                            style={{ minWidth: 130 }} />
                        {filter === 'custom' && (
                            <Calendar value={customRange} onChange={e => setCustomRange(e.value as [Date, Date])}
                                selectionMode="range" readOnlyInput placeholder="Chọn khoảng ngày"
                                style={{ width: 220 }} />
                        )}
                        <Button icon="pi pi-refresh" size="small" severity="secondary" onClick={fetchAll} />
                    </div>
                )}
            </div>

            {/*  TRẠNG THÁI BÀN  */}
            <SectionTitle title="TRẠNG THÁI BÀN" />
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <StatCard title="TỔNG BÀN" value={banStat.tong} sub="Tất cả khu vực" color="#888" icon="pi-th-large" onClick={() => navigate('/tables')} />
                <StatCard title="TRỐNG" value={banStat.trong} sub="Sẵn sàng phục vụ" color="#22c55e" icon="pi-check-circle" onClick={() => navigate('/tables')} />
                <StatCard title="CÓ KHÁCH" value={banStat.cokhach} sub="Đang phục vụ" color="#ef4444" icon="pi-users" onClick={() => navigate('/tables')} />
                <StatCard title="ĐẶT TRƯỚC" value={banStat.dattruoc} sub="Đã đặt trước" color="#eab308" icon="pi-calendar" onClick={() => navigate('/tables')} />
            </div>

            {/*  BIỂU ĐỒ BÀN + BẾP  */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                {/* Biểu đồ tròn bàn */}
                <div style={{ flex: 1, minWidth: 280, background: '#141414', border: '1px solid #1e1e1e', padding: 16 }}>
                    <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, marginBottom: 12 }}>TỈ LỆ TRẠNG THÁI BÀN</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={banData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                                {banData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#f0e6d3' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Biểu đồ bếp + bar */}
                <div style={{ flex: 2, minWidth: 300, background: '#141414', border: '1px solid #1e1e1e', padding: 16 }}>
                    <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, marginBottom: 12 }}>TÌNH TRẠNG BẾP & BAR</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                            <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#888', fontSize: 11 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#f0e6d3' }} />
                            <Legend wrapperStyle={{ color: '#888', fontSize: 11 }} />
                            <Bar dataKey="Món mới" fill="#888" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Đang làm" fill="#eab308" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Sẵn sàng" fill="#22c55e" radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/*  TÌNH TRẠNG BẾP & BAR  */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                {/* BẾP */}
                <div style={{ flex: 1, minWidth: 200 }}>
                    <SectionTitle title="BẾP" />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <StatCard title="MÓN MỚI" value={bepStat.moi} sub="Chờ xử lý" color="#888" icon="pi-inbox" onClick={() => navigate('/kitchen')} />
                        <StatCard title="ĐANG LÀM" value={bepStat.danglam} sub="Đang chế biến" color="#eab308" icon="pi-cog" onClick={() => navigate('/kitchen')} />
                        <StatCard title="SẴN SÀNG" value={bepStat.sansang} sub="Chờ phục vụ" color="#22c55e" icon="pi-check" onClick={() => navigate('/kitchen')} />
                    </div>
                </div>
                {/* BAR */}
                <div style={{ flex: 1, minWidth: 200 }}>
                    <SectionTitle title="BAR" />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <StatCard title="MÓN MỚI" value={barStat.moi} sub="Chờ xử lý" color="#888" icon="pi-inbox" onClick={() => navigate('/kitchen')} />
                        <StatCard title="ĐANG LÀM" value={barStat.danglam} sub="Đang chế biến" color="#3b82f6" icon="pi-cog" onClick={() => navigate('/kitchen')} />
                        <StatCard title="SẴN SÀNG" value={barStat.sansang} sub="Chờ phục vụ" color="#22c55e" icon="pi-check" onClick={() => navigate('/kitchen')} />
                    </div>
                </div>
            </div>

            {/*  DOANH THU (CHỈ ADMIN)  */}
            {user?.vaitro === 'admin' && (
                <>
                    <SectionTitle title={`DOANH THU - ${filterOptions.find(f => f.value === filter)?.label.toUpperCase()}`} />
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                        <StatCard title="TỔNG THU" value={stats ? `${fmt(stats.tongthu)}đ` : '—'} sub="Tổng doanh thu" color="#c9973a" icon="pi-chart-bar" />
                        <StatCard title="SỐ HÓA ĐƠN" value={stats?.sohoadon || 0} sub="Hóa đơn đã TT" color="#3b82f6" icon="pi-file" />
                        <StatCard title="TRUNG BÌNH" value={stats ? `${fmt(stats.giatrithbinh)}đ` : '—'} sub="Giá trị TB/hóa đơn" color="#a855f7" icon="pi-chart-line" />
                        <StatCard title="TIỀN MẶT" value={stats ? `${fmt(stats.tienmat)}đ` : '—'} sub="Thanh toán TM" color="#22c55e" icon="pi-wallet" />
                        <StatCard title="CHUYỂN KHOẢN" value={stats ? `${fmt(stats.chuyenkhoan)}đ` : '—'} sub="Thanh toán CK" color="#f97316" icon="pi-credit-card" />
                        <StatCard title="VÍ ĐIỆN TỬ" value={stats ? `${fmt(stats.vidientu)}đ` : '—'} sub="Thanh toán VĐT" color="#06b6d4" icon="pi-mobile" />
                    </div>

                    {/* Biểu đồ phương thức thanh toán */}
                    {pieData.length > 0 && (
                        <div style={{ background: '#141414', border: '1px solid #1e1e1e', padding: 16, marginBottom: 24 }}>
                            <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, marginBottom: 12 }}>PHÂN BỔ PHƯƠNG THỨC THANH TOÁN</div>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: '#555' }}>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#f0e6d3' }}
                                        formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')}đ`}
                                    />
                                    <Legend wrapperStyle={{ color: '#888', fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </>
            )}

            {/*  TRUY CẬP NHANH  */}
            <SectionTitle title="TRUY CẬP NHANH" />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button label="Sơ đồ bàn" icon="pi pi-th-large" size="small" severity="secondary" onClick={() => navigate('/tables/map')} />
                <Button label="Đặt món" icon="pi pi-shopping-cart" size="small" severity="secondary" onClick={() => navigate('/pos')} />
                <Button label="Màn hình bếp" icon="pi pi-cog" size="small" severity="secondary" onClick={() => navigate('/kitchen')} />
                <Button label="Đơn hàng" icon="pi pi-list" size="small" severity="secondary" onClick={() => navigate('/orders')} />
                {user?.vaitro === 'admin' && <>
                    <Button label="Thực đơn" icon="pi pi-book" size="small" severity="secondary" onClick={() => navigate('/menu')} />
                    <Button label="Nhân viên" icon="pi pi-users" size="small" severity="secondary" onClick={() => navigate('/users')} />
                </>}
            </div>
        </div>
    );
};

export default Dashboard;