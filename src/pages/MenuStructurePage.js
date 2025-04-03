import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChartPie,
    Home,
    IdCard,
    BriefcaseBusiness,
    FileBadge2,
    Wallet,
    Settings,
    User,
    AppWindow,
    FileBox,
    Edit,
    ArrowRight,
    LayoutGrid,
    ExternalLink
} from 'lucide-react';
import authUtils from '../utils/authUtils';
import { hasPermission } from '../layouts/MainLayout';

const MenuStructurePage = () => {
    const navigate = useNavigate();
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const userData = authUtils.getUserData();
    console.log(userData);
    // Cấu trúc menu với thông tin phân quyền mở rộng
    const menuItems = [
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
                    permissions: { PhanQuyen: ["All"] }
                },
                {
                    text: 'NZ KHO ',
                    icon: Home,
                    path: 'https://www.appsheet.com/start/269a45b5-ce3b-463a-9ef7-d85322d32b46?refresh=1&platform=desktop',
                    description: 'NZ KHO',
                    count: 0,
                    isExternal: true,
                    permissions: {
                        Phong: ["Hành chánh", "Giám đốc"],
                        ChucVu: ["Đội hàn"],

                    }
                },
                {
                    text: 'NZ Thu chi ',
                    icon: Home,
                    path: 'https://www.appsheet.com/start/1a8d9270-a4ff-46b8-94fc-db1e4632f273?refresh=1&platform=desktop',
                    description: 'NZ KHO',
                    count: 0,
                    isExternal: true,
                    permissions: {
                        Phong: ["Hành chánh", "Giám đốc"],

                    }
                }


            ]
        },
        {
            groupId: 5,
            groupName: "Báo cáo thống kê",
            icon: Wallet,
            permissions: {
                PhanQuyen: ["Admin"],
                Phong: ["Hành chánh", "Giám đốc"],
            },
            items: [
              
                {
                    text: 'Báo cáo dự án ',
                    icon: ChartPie,
                    path: '/Duantc',
                    description: 'Báo cáo dự án',
                    permissions: {
                        PhanQuyen: ["Admin"],
                        Phong: ["Giám đốc"],
                    }
                }
            ]
        },
        {
            groupId: 3,
            groupName: "Quản Lý Dự án",
            icon: Wallet,
            permissions: {
                PhanQuyen: ["Admin"],
                Phong: ["Hành chánh", "Giám đốc"],
            },
            items: [
                {
                    text: 'Dự án',
                    icon: Wallet,
                    path: '/duan',
                    description: 'Quản lý Dự án',
                    permissions: {
                        PhanQuyen: ["Admin"],
                        Phong: ["Hành chánh", "Giám đốc"],
                    }
                },
                {
                    text: 'Chấm công',
                    icon: Wallet,
                    path: '/Chamcong',
                    description: 'Chấm công',
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
            icon: Wallet,
            permissions: {
                PhanQuyen: ["Admin"],
                Phong: ["Hành chánh", "Giám đốc"],
            },
            items: [
                {
                    text: 'Thêm dự án',
                    icon: Wallet,
                    path: '/addduan',
                    description: 'Thêm dự án nhanh',
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
            permissions: { PhanQuyen: ["Admin"], Phong: ["Hành chánh", "Giám đốc"] },
            items: [
                {
                    text: 'Nhân viên',
                    icon: User,
                    path: '/users',
                    description: 'Nhân viên',
                    permissions: { PhanQuyen: ["Admin"], Phong: ["Hành chánh", "Giám đốc"], }
                }

            ]
        }
    ];

    // Hàm kiểm tra quyền truy cập mở rộng bao gồm mã nhân viên
    const checkPermission = (item, user) => {
        // If permissions are not specified, deny access
        if (!item.permissions) return false;

        // If "All" is included in PhanQuyen, allow access to everyone
        if (item.permissions.PhanQuyen && item.permissions.PhanQuyen.includes("All")) {
            return true;
        }

        // Check by employee code
        if (item.permissions.employeeCodes && user['Mã nhân viên']) {
            if (item.permissions.employeeCodes.includes(user['Mã nhân viên'])) {
                return true;
            }
        }

        // Check by role
        if (item.permissions.PhanQuyen && user['Phân quyền']) {
            if (item.permissions.PhanQuyen.includes(user['Phân quyền'])) {
                return true;
            }
        }

        // Check by department
        if (item.permissions.Phong && user['Phòng']) {
            if (item.permissions.Phong.includes(user['Phòng'])) {
                return true;
            }
        }

        // Check by position
        if (item.permissions.ChucVu && user['Chức vụ']) {
            if (item.permissions.ChucVu.includes(user['Chức vụ'])) {
                return true;
            }
        }

        // If none of the conditions match, deny access
        return false;
    };

    // Hàm xử lý khi click vào menu item
    const handleItemClick = (item) => {
        if (item.isLogout) {
            localStorage.removeItem('auth_token');
            navigate('/');
        } else if (item.isExternal) {
            window.open(item.path, '_blank');
        } else {
            navigate(item.path);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Main Content */}
            <div className="mx-auto p-4">
                {menuItems
                    .filter(group => checkPermission(group, userData))
                    .map((group) => {
                        const accessibleItems = group.items.filter(item => checkPermission(item, userData));

                        if (accessibleItems.length === 0) {
                            return null;
                        }

                        const GroupIcon = group.icon;

                        return (
                            <div key={group.groupId} className="mb-6">
                                <div className="flex items-center mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#b7a035] to-[#d99c07] flex items-center justify-center text-white shadow-md mr-2">
                                        <GroupIcon className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-800">{group.groupName}</h2>
                                    <div className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                                        {accessibleItems.length} chức năng
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {accessibleItems.map((item, index) => {
                                        const Icon = item.icon;
                                        return (
                                            <div
                                                key={index}
                                                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-[#d99c07]/30 transition-all cursor-pointer relative group overflow-hidden"
                                                onClick={() => handleItemClick(item)}
                                            >
                                                <div className="absolute top-0 right-0 h-10 w-10 bg-gradient-to-br from-[#b7a035]/10 to-[#d99c07]/10 rounded-bl-full transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform"></div>

                                                <div className="flex items-center">
                                                    {/* Icon bên trái */}
                                                    <div className="bg-gradient-to-br from-[#002266] to-[#003399] p-2 rounded-lg shadow-sm group-hover:shadow-md transition-shadow mr-3">
                                                        <Icon className="h-5 w-5 text-white" />
                                                    </div>

                                                    {/* Nội dung ở giữa */}
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-800 text-sm">{item.text}</h3>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                            {item.description || `Quản lý ${item.text.toLowerCase()}`}
                                                        </p>

                                                        {item.count > 0 && (
                                                            <div className="mt-1 inline-block px-2 py-0.5 bg-blue-50 text-[#003399] text-xs font-medium rounded-full">
                                                                {item.count}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action bên phải */}
                                                    <div className="ml-2">
                                                        <span className="text-[#b7a035] group-hover:text-[#d99c07] flex items-center text-xs font-medium transition-colors whitespace-nowrap">
                                                            {item.isExternal ? (
                                                                <>
                                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                                    Mở liên kết
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Truy cập
                                                                    <ArrowRight className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default MenuStructurePage;