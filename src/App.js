import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import authUtils from './utils/authUtils';
import Profile from './pages/Profile';
import Users from './pages/UserManagement';
import MenuStructurePage from './pages/MenuStructurePage';
import AttendanceSystem from './pages/AttendanceSystem';
import DuAnStatistics from './pages/DuAnStatistics';
import AddDuan from './pages/AddDuan';
import DanhSachKeHoach from './pages/DanhSachKeHoach';
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
const RoleProtectedRoute = ({ requiredRoles, requiredDepartments, requiredPositions, allowAll, children }) => {
  const location = useLocation();
  const userData = authUtils.getUserData();

  if (!authUtils.isAuthenticated()) {
    localStorage.setItem('returnUrl', location.pathname + location.search);
    return <Navigate to="/" replace />;
  }

  // Nếu allowAll là true, cho phép tất cả người dùng đã xác thực truy cập
  if (allowAll) {
    return children;
  }

  // Admin luôn có quyền truy cập
  if (userData?.['Phân quyền'] === 'ADMIN') {
    return children;
  }

  // Kiểm tra role
  if (requiredRoles && requiredRoles.length > 0) {
    if (requiredRoles.includes(userData?.['Phân quyền'])) {
      return children;
    }
  }

  // Kiểm tra phòng ban
  if (requiredDepartments && requiredDepartments.length > 0) {
    if (requiredDepartments.includes(userData?.['Phòng']) || requiredDepartments.includes('ALL')) {
      return children;
    }
  }

  // Kiểm tra chức vụ
  if (requiredPositions && requiredPositions.length > 0) {
    if (requiredPositions.includes(userData?.['Chức vụ']) || requiredPositions.includes('ALL')) {
      return children;
    }
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
      onClick={() => window.location.href = '/dashboard'}
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

                  {/* Trang Menu - Chỉ ADMIN và Giám đốc, Trưởng phòng mới xem được */}
                  <Route path="/Home" element={
                    <RoleProtectedRoute

                      allowAll={true}
                    >
                      <MenuStructurePage />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang profile - Ai cũng xem được sau khi đăng nhập */}
                  <Route path="/profile" element={
                    <RoleProtectedRoute allowAll={true}>
                      <Profile />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang quản lý người dùng - Chỉ ADMIN mới xem được */}
                  <Route path="/users" element={
                    <RoleProtectedRoute requiredRoles={["Admin"]}
                      requiredDepartments={["Hành chánh", "Giám đốc"]}>

                      <Users />
                    </RoleProtectedRoute>
                  } />
                   <Route path="/addduan" element={
                    <RoleProtectedRoute requiredRoles={["Admin"]}
                      requiredDepartments={["Hành chánh", "Giám đốc"]}>

                      <AddDuan />
                    </RoleProtectedRoute>
                  } />

                  {/* Trang quản lý thu chi - Chỉ ADMIN, Kế toán, Giám đốc mới xem được */}
                  <Route path="/thuchi" element={
                    <RoleProtectedRoute
                      requiredRoles={["Admin"]}
                      requiredDepartments={["Giám đốc"]}
                      requiredPositions={["Kế toán"]}
                    >
                      {/* Thay bằng component thực tế */}
                      <div>Trang quản lý thu chi</div>
                    </RoleProtectedRoute>
                  } />
                  {/* Trang quản lý người dùng - Chỉ ADMIN mới xem được */}
                  <Route path="/Chamcong" element={
                    <RoleProtectedRoute requiredRoles={["Admin"]}
                      requiredDepartments={["Hành chánh", "Giám đốc"]}>

                      <AttendanceSystem />
                    </RoleProtectedRoute>
                  } />
                    {/* Trang quản lý người dùng - Chỉ ADMIN mới xem được */}
                    <Route path="/duankho" element={
                    <RoleProtectedRoute requiredRoles={["Admin"]}
                      requiredDepartments={["Hành chánh", "Giám đốc"]}>

                      <DanhSachKeHoach />
                    </RoleProtectedRoute>
                  } />
                     {/* Trang quản lý người dùng - Chỉ ADMIN mới xem được */}
                     <Route path="/Duantc" element={
                    <RoleProtectedRoute requiredRoles={["Admin"]}
                      requiredDepartments={["Hành chánh", "Giám đốc"]}>

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