// src/utils/permissionConfig.js
const permissions = {
  // Định nghĩa các quyền theo nhóm chức năng
  menuGroups: {
    appsheet: {
      roles: ["All"],
      departments: ["ALL"],
      positions: ["ALL"],
    },
    finance: {
      roles: ["Admin"],
      departments: ["Kế toán", "Tài chính"],
      positions: ["Giám đốc", "Trưởng phòng", "Kế toán viên"],
      employeeCodes: ["NV001", "NV002", "NV003", "NZ - Toàn LT"]
    },
    settings: {
      roles: ["Admin"],
      positions: ["Giám đốc"],
      employeeCodes: ["NZ - Toàn LT"]
    }
  },
  
  // Định nghĩa phân quyền cụ thể cho từng trang hoặc tính năng
  pages: {
    home: {
      all: true
    },
    profile: {
      all: true
    },
    users: {
      roles: ["Admin"],
      employeeCodes: ["NZ - Toàn LT"]
    },
    thuchi: {
      roles: ["Admin"],
      departments: ["Kế toán", "Tài chính"],
      positions: ["Giám đốc", "Trưởng phòng", "Kế toán viên"],
      employeeCodes: ["NV001", "NV002"]
    },
    financeReports: {
      roles: ["Admin"],
      departments: ["Kế toán"],
      positions: ["Giám đốc", "Trưởng phòng"],
      employeeCodes: ["NV001"]
    }
  }
};

// Hàm kiểm tra quyền truy cập chung
export const checkPermission = (permissionConfig, userData) => {
  // Nếu cho phép tất cả
  if (permissionConfig.all === true) {
    return true;
  }
  
  // Nếu người dùng là Admin
  if (userData?.['Phân quyền'] === 'Admin') {
    return true;
  }
  
  // Kiểm tra role
  if (permissionConfig.roles && permissionConfig.roles.length > 0) {
    if (permissionConfig.roles.includes(userData?.['Phân quyền']) || permissionConfig.roles.includes("All")) {
      return true;
    }
  }
  
  // Kiểm tra phòng ban
  if (permissionConfig.departments && permissionConfig.departments.length > 0) {
    if (permissionConfig.departments.includes(userData?.['Phòng']) || permissionConfig.departments.includes("ALL")) {
      return true;
    }
  }
  
  // Kiểm tra chức vụ
  if (permissionConfig.positions && permissionConfig.positions.length > 0) {
    if (permissionConfig.positions.includes(userData?.['Chức vụ']) || permissionConfig.positions.includes("ALL")) {
      return true;
    }
  }
  
  // Kiểm tra mã nhân viên
  if (permissionConfig.employeeCodes && permissionConfig.employeeCodes.length > 0) {
    if (permissionConfig.employeeCodes.includes(userData?.['Mã nhân viên'])) {
      return true;
    }
  }
  
  return false;
};

// Lấy cấu hình phân quyền cho một trang cụ thể
export const getPagePermission = (pageName) => {
  return permissions.pages[pageName] || { all: false };
};

// Lấy cấu hình phân quyền cho một nhóm menu
export const getMenuGroupPermission = (groupName) => {
  return permissions.menuGroups[groupName] || { all: false };
};

export default permissions;