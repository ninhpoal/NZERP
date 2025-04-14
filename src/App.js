import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import authUtils from './utils/authUtils';
import Profile from './pages/Profile';
import Users from './pages/UserManagement';
import MenuStructurePage from './pages/MenuStructurePage';
import AttendanceSystem from './pages/AttendanceSystem';
import DuAnStatistics from './pages/DuanToiuu';
import AddDuan from './pages/AddDuan';
import DanhSachKeHoach from './pages/DanhSachKeHoach';
import ChiPhiStatistics from './pages/ChiPhiStatistics';
import { checkPermission } from './config/menuConfig';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!authUtils.isAuthenticated()) {
    // Lưu lại đường dẫn hiện tại trước khi chuyển hướng
    localStorage.setItem('returnUrl', location.pathname + location.search);
    return <Navigate to="/" replace />;
  }
  return children;
};

// Role-based Protected Route
const RoleProtectedRoute = ({ children, requiredPermissions }) => {
  const location = useLocation();
  const userData = authUtils.getUserData();

  if (!authUtils.isAuthenticated()) {
    localStorage.setItem('returnUrl', location.pathname + location.search);
    return <Navigate to="/" replace />;
  }

  // Kiểm tra nếu có quyền truy cập
  if (checkPermission(requiredPermissions, userData)) {
    return children;
  }

  // Nếu không có quyền truy cập, chuyển hướng đến trang 403 (Forbidden)
  return <Navigate to="/forbidden" replace />;
};

// Page not found component
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
    <h1 className="text-6xl font-bold text-[#04319a]">404</h1>
    <p className="text-xl text-gray-600 mt-4">Trang không tồn tại</p>
    <button
      onClick={() => window.location.href = '/Home'}
      className="mt-6 px-6 py-2 bg-[#04319a] text-white rounded-lg hover:bg-[#4169E1] transition-colors"
    >
      Quay lại trang chủ
    </button>
  </div>
);

// Forbidden page component
const Forbidden = () => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
    <h1 className="text-6xl font-bold text-[#f44336]">403</h1>
    <p className="text-xl text-gray-600 mt-4">Bạn không có quyền truy cập trang này</p>
    <button
      onClick={() => window.location.href = '/Home'}
      className="mt-6 px-6 py-2 bg-[#04319a] text-white rounded-lg hover:bg-[#4169E1] transition-colors"
    >
      Quay lại trang chủ
    </button>
  </div>
);

function App() {
  // Định nghĩa quyền truy cập cho từng route
  const routePermissions = {
    Home: { PhanQuyen: ["All"] }, // Tất cả đều xem được
    profile: { PhanQuyen: ["All"] }, // Tất cả đều xem được
    users: { PhanQuyen: ["Admin"], Phong: ["Hành chánh", "Giám đốc"] },
    addduan: { PhanQuyen: ["Admin"], Phong: ["Hành chánh", "Giám đốc"] },
    thuchi: { PhanQuyen: ["Admin"], Phong: ["Giám đốc"], ChucVu: ["Kế toán"] },
    Chamcong: { PhanQuyen: ["Admin"], Phong: ["Hành chánh", "Giám đốc"] },
    duankho: { PhanQuyen: ["Admin"], Phong: ["Hành chánh", "Giám đốc"] },
    Duantc: { PhanQuyen: ["Admin"], Phong: ["Hành chánh", "Giám đốc"] }
  };

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/forbidden" element={<Forbidden />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  {/* Trang Menu - Tất cả đều xem được sau khi đăng nhập */}
                  <Route path="/Home" element={
                    <RoleProtectedRoute requiredPermissions={routePermissions.Home}>
                      <MenuStructurePage />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang profile - Ai cũng xem được sau khi đăng nhập */}
                  <Route path="/profile" element={
                    <RoleProtectedRoute requiredPermissions={routePermissions.profile}>
                      <Profile />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang quản lý người dùng */}
                  <Route path="/users" element={
                    <RoleProtectedRoute requiredPermissions={routePermissions.users}>
                      <Users />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang thêm dự án */}
                  <Route path="/addduan" element={
                    <RoleProtectedRoute requiredPermissions={routePermissions.addduan}>
                      <AddDuan />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang quản lý thu chi */}
                  <Route path="/chiphi" element={
                    <RoleProtectedRoute requiredPermissions={routePermissions.thuchi}>
                    <ChiPhiStatistics />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang chấm công */}
                  <Route path="/Chamcong" element={
                    <RoleProtectedRoute requiredPermissions={routePermissions.Chamcong}>
                      <AttendanceSystem />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang dự án kho */}
                  <Route path="/duankho" element={
                    <RoleProtectedRoute requiredPermissions={routePermissions.duankho}>
                      <DanhSachKeHoach />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang dự án thống kê */}
                  <Route path="/Duantc" element={
                    <RoleProtectedRoute requiredPermissions={routePermissions.Duantc}>
                      <DuAnStatistics />
                    </RoleProtectedRoute>
                  } />

                  <Route path="/" element={<Navigate to="/Home" replace />} />

                  {/* 404 page for any undefined routes */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;