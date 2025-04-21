// src/config/menuConfig.js

import {
    ChartPie, Home, IdCard, BriefcaseBusiness, FileBadge2, Wallet,
    Settings, User, AppWindow, FileBox, Edit, LayoutGrid
} from 'lucide-react';

// Định nghĩa cấu trúc menu chung cho toàn ứng dụng
const menuConfig = [
    {
        groupId: 1,
        groupName: "APPSHEET",
        icon: AppWindow,
        permissions: { PhanQuyen: ["All"] },
        items: [
            {
                text: 'NZ ERP',
                icon: Home,
                path: 'https://www.appsheet.com/start/509dd5b5-bc8b-4962-8122-bbc6d3cf3f55?refresh=1&platform=desktop',
                description: 'NZ ERP',
                count: 0,
                isExternal: true,
                showInSidebar: false, // Không hiện trên sidebar
                permissions: { PhanQuyen: ["All"] }
            },
            {
                text: 'Dự án kho',
                icon: Home,
                path: '/duankho',
                description: 'NZ KHO',
                count: 0,
                showInSidebar: true, // Hiện trên sidebar
                permissions: {
                    Phong: ["Hành chánh", "Giám đốc"],
                    ChucVu: ["Kho"],
                }
            },
            {
                text: 'NZ KHO',
                icon: Home,
                path: 'https://www.appsheet.com/start/269a45b5-ce3b-463a-9ef7-d85322d32b46?refresh=1&platform=desktop',
                description: 'NZ KHO',
                count: 0,
                isExternal: true,
                showInSidebar: false, // Không hiện trên sidebar
                permissions: {
                    Phong: ["Hành chánh", "Giám đốc"],
                    ChucVu: ["Đội hàn"],
                }
            },
            {
                text: 'NZ Thu chi',
                icon: Home,
                path: 'https://www.appsheet.com/start/1a8d9270-a4ff-46b8-94fc-db1e4632f273?refresh=1&platform=desktop',
                description: 'NZ KHO',
                count: 0,
                isExternal: true,
                showInSidebar: false, // Không hiện trên sidebar
                permissions: {
                    Phong: ["Hành chánh", "Giám đốc"],
                }
            }
        ]
    },
    {
        groupId: 5,
        groupName: "Báo cáo thống kê",
        icon: ChartPie,
        permissions: {
            PhanQuyen: ["Admin"],
            Phong: ["Hành chánh", "Giám đốc"],
        },
        items: [
            {
                text: 'Báo cáo dự án',
                icon: ChartPie,
                path: '/Duantc',
                description: 'Báo cáo dự án',
                showInSidebar: true, // Hiện trên sidebar
                permissions: {
                    PhanQuyen: ["Admin"],
                    Phong: ["Giám đốc"],
                }
            }
        ]
    },
    {
        groupId: "Thuchi",
        groupName: "Thu chi",
        icon: Wallet,
        permissions: {
            PhanQuyen: ["Admin"],
            Phong: ["Hành chánh", "Giám đốc"],
        },
        items: [
            {
                text: 'Chi phí',
                icon: Wallet,
                path: '/chiphi',
                description: 'Chi phí công ty',
                showInSidebar: true, // Hiện trên sidebar
                permissions: {
                    PhanQuyen: ["Admin"],
                    Phong: ["Giám đốc"],
                }
            }, 
            {
                text: 'Thu nhập',
                icon: Wallet,
                path: '/thunhap',
                description: 'Thu nhập',
                showInSidebar: true, // Hiện trên sidebar
                permissions: {
                    PhanQuyen: ["Admin"],
                    Phong: ["Giám đốc"],
                }
            },
            {
                text: 'Lương thực tế',
                icon: Wallet,
                path: '/Luongthucte',
                description: 'Lương thực tế',
                showInSidebar: true, // Hiện trên sidebar
            }
        ]
    },
    {
        groupId: 3,
        groupName: "Quản Lý Dự án",
        icon: BriefcaseBusiness,
        permissions: {
            PhanQuyen: ["Admin"],
            Phong: ["Hành chánh", "Giám đốc"],
        },
        items: [
            {
                text: 'Dự án',
                icon: FileBox,
                path: '/duan',
                description: 'Quản lý Dự án',
                showInSidebar: true, // Hiện trên sidebar
                permissions: {
                    PhanQuyen: ["Admin"],
                    Phong: ["Hành chánh", "Giám đốc"],
                }
            },
            {
                text: 'Chấm công',
                icon: IdCard,
                path: '/Chamcong',
                description: 'Chấm công',
                showInSidebar: false,
                permissions: {
                    PhanQuyen: ["Admin"],
                    Phong: ["Hành chánh", "Giám đốc"],
                }
            },
        ]
    },
    {
        groupId: 4,
        groupName: "Tools",
        icon: Settings,
        permissions: {
            PhanQuyen: ["Admin"],
            Phong: ["Hành chánh", "Giám đốc"],
        },
        items: [
            {
                text: 'Thêm dự án',
                icon: Edit,
                path: '/addduan',
                description: 'Thêm dự án nhanh',
                showInSidebar: false,
                permissions: {
                    PhanQuyen: ["Admin"],
                    Phong: ["Hành chánh", "Giám đốc"],
                }
            },
            {
                text: 'Đổi tên hình ảnh',
                icon: Edit,
                path: '/toolupanh',
                description: 'đổi tên hình nhanh',
                showInSidebar: false,
                permissions: {
                    PhanQuyen: ["Admin"],
                    Phong: ["Hành chánh", "Giám đốc"],
                }
            },
            {
                text: 'File HSHC',
                icon: Edit,
                path: '/addhshc',
                description: 'đổi tên hình nhanh',
                showInSidebar: false,
                permissions: {
                    PhanQuyen: ["Admin"],
                    Phong: ["Hành chánh", "Giám đốc"],
                }
            },
        ]
    },
    {
        groupId: 7,
        groupName: "Cài Đặt",
        icon: Settings,
        permissions: { 
            PhanQuyen: ["Admin"], 
            Phong: ["Hành chánh", "Giám đốc"] 
        },
        items: [
            {
                text: 'Nhân viên',
                icon: User,
                path: '/users',
                description: 'Nhân viên',
                showInSidebar: true, // Hiện trên sidebar
                permissions: { 
                    PhanQuyen: ["Admin"], 
                    Phong: ["Hành chánh", "Giám đốc"] 
                }
            }
        ]
    }
];

// Hàm kiểm tra quyền truy cập chung - chấp nhận cả item/permissions và userData
export const checkPermission = (itemOrPermissions, userData) => {
    // Xác định đối tượng permissions (có thể là item.permissions hoặc chính là permissions)
    const permissions = itemOrPermissions.permissions || itemOrPermissions;
    
  
    
    // Nếu không có thông tin phân quyền hoặc item đó cho phép tất cả
    if (!permissions) return false;

    // Nếu PhanQuyen có "All", cho phép mọi người dùng
    if (permissions.PhanQuyen && permissions.PhanQuyen.includes("All")) {
     
        return true;
    }

    // Nếu là ADMIN, luôn được quyền truy cập
    if (userData?.['Phân quyền'] === 'Admin') {
    
        return true;
    }

    // Kiểm tra theo PhanQuyen
    if (permissions.PhanQuyen && userData?.['Phân quyền']) {
        if (permissions.PhanQuyen.includes(userData['Phân quyền'])) {
      
        }
    }

    // Kiểm tra theo Phong (phòng ban)
    if (permissions.Phong && userData?.['Phòng']) {
        if (permissions.Phong.includes(userData['Phòng'])) {
        
            return true;
        }
    }

    // Kiểm tra theo ChucVu
    if (permissions.ChucVu && userData?.['Chức vụ']) {
        if (permissions.ChucVu.includes(userData['Chức vụ'])) {
           
            return true;
        }
    }

    // Kiểm tra mã nhân viên cụ thể
    if (permissions.employeeCodes && userData?.['Mã nhân viên']) {
        if (permissions.employeeCodes.includes(userData['Mã nhân viên'])) {
          
            return true;
        }
    }

  
    return false;
};

// Lấy menu dạng phẳng cho sidebar
export const getFlatMenu = () => {
    const flatMenu = [];
    
    // Thêm trang chủ vào đầu
    flatMenu.push({
        text: 'Trang chủ',
        icon: Home,
        path: '/Home',
        description: 'Tổng hợp chức năng',
        showInSidebar: true, // Hiện trên sidebar
        permissions: { PhanQuyen: ["All"] }
    });
    
    // Chuyển đổi từ menu nhóm sang menu phẳng
    menuConfig.forEach(group => {
        group.items.forEach(item => {
            // Chỉ thêm các item chưa có trong flatMenu
            if (!flatMenu.find(x => x.path === item.path)) {
                flatMenu.push({
                    ...item,
                    // Kế thừa permissions từ group nếu item không có
                    permissions: item.permissions || group.permissions,
                    // Nếu không có showInSidebar, mặc định là true
                    showInSidebar: item.showInSidebar !== undefined ? item.showInSidebar : true
                });
            }
        });
    });
    
    return flatMenu;
};

// Lấy menu dạng phẳng CHỈ cho sidebar (lọc theo showInSidebar)
export const getSidebarMenu = () => {
    return getFlatMenu().filter(item => item.showInSidebar === true);
};

export default menuConfig;