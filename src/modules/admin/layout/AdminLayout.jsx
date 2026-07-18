// AdminLayout - Layout chính cho phần quản trị viên, chứa sidebar và header
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminHeader from '../components/AdminHeader';

const AdminLayout = () => {
    return (
        <div style={{
            display: 'flex', height: '100vh',
            backgroundColor: '#f4f5f7', fontFamily: 'Inter, sans-serif', overflow: 'hidden'
        }}>
            {/* Sidebar cố định bên trái */}
            <AdminSidebar />

            {/* Vùng bên phải chứa Header và Ruột thay đổi */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <AdminHeader />

                {/* Nội dung từng trang Admin sẽ hiển thị ở đây */}
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;