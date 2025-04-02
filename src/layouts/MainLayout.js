import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FileBox,
    User,
    Gauge, IdCard, BriefcaseBusiness, FileBadge2, Wallet,
    ChevronLeft,
    ChartPie,
    LogOut,
    Menu as MenuIcon,
    Warehouse,
    Truck,
    ClipboardList,
    Settings,
    Bell,
    Search,
    HelpCircle,
    Home,
    ChevronDown,
    ChevronRight,
    Mail,
    Phone,
    Calendar,
    Clock,
    Shield,
    Globe
} from 'lucide-react';
import authUtils from '../utils/authUtils';

const isMobileDevice = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Hàm kiểm tra quyền truy cập cho menu item
export const hasPermission = (item, userData) => {
    // Nếu không có thông tin phân quyền trong menu hoặc item đó cho phép tất cả
    if (!item.permissions || item.permissions.all === true) {
        return true;
    }

    // Nếu là ADMIN, luôn được quyền truy cập
    if (userData?.['Phân quyền'] === 'Admin') {
        return true;
    }

    // Kiểm tra quyền dựa trên phân quyền (ADMIN/USER)
    if (item.permissions.roles && item.permissions.roles.includes(userData?.['Phân quyền'])) {
        return true;
    }

    // Kiểm tra quyền dựa trên phòng ban
    if (item.permissions.departments) {
        if (item.permissions.departments.includes(userData?.['Phòng']) ||
            item.permissions.departments.includes('ALL')) {
            return true;
        }
    }

    // Kiểm tra quyền dựa trên chức vụ
    if (item.permissions.positions) {
        if (item.permissions.positions.includes(userData?.['Chức vụ']) ||
            item.permissions.positions.includes('ALL')) {
            return true;
        }
    }

    // Kiểm tra quyền dựa trên khu vực
    if (item.permissions.areas) {
        if (item.permissions.areas.includes(userData?.['Khu vực']) ||
            item.permissions.areas.includes('ALL')) {
            return true;
        }
    }

    return false;
};

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize sidebar state based on screen size
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobileDevice());
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const [searchQuery, setSearchQuery] = useState('');
    // State for collapsed menu groups
    const [collapsedGroups, setCollapsedGroups] = useState({});

    // State for page actions from child components
    const [pageActions, setPageActions] = useState([]);

    const userData = authUtils.getUserData();

    // Add resize listener
    useEffect(() => {
        const handleResize = () => {
            const mobile = isMobileDevice();
            setIsMobile(mobile);

            // Automatically close sidebar on mobile when resizing
            if (mobile && isSidebarOpen) {
                setIsSidebarOpen(false);
            } else if (!mobile && !isSidebarOpen) {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    // Method for child pages to register buttons
    useEffect(() => {
        window.registerPageActions = (actions) => {
            setPageActions(actions);
        };

        window.clearPageActions = () => {
            setPageActions([]);
        };

        return () => {
            delete window.registerPageActions;
            delete window.clearPageActions;
        };
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileMenuOpen && !event.target.closest('.profile-menu-container')) {
                setIsProfileMenuOpen(false);
            }
            if (isNotificationsOpen && !event.target.closest('.notifications-container')) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileMenuOpen, isNotificationsOpen]);

    // Standalone menu items that don't need to be in a group
    const standaloneMenuItems = [
        {
            text: 'Trang chủ',
            icon: Home,
            path: '/Home',
            description: 'Tổng hợp chức năng',
            permissions: { all: true } // Everyone can see Home
        }
    ];

    // Định nghĩa menu với thông tin phân quyền (grouped items)
    const menuItems = [
        {
            groupName: "Quản Lý Tài Chính",
            icon: Wallet,
            permissions: {
                roles: ["Admin"],
                departments: ["Giám đốc", "Tài chính"],
                positions: ["Kế toán"]
            },
            items: [
                {
                    text: 'Thu chi',
                    icon: Wallet,
                    path: '/thuchi',
                    description: 'Quản lý thu chi',
                    permissions: {
                        roles: ["Admin"],
                        departments: ["Giám đốc", "Tài chính"],
                        positions: ["Kế toán"]
                    }
                },
            ]
        },
        {
            groupName: "Cài Đặt",
            icon: Settings,
            permissions: {
                roles: ["Admin"],
                departments: ["Giám đốc", "Hành chánh"],
                positions: ["Kế toán"]
            },
            items: [
                {
                    text: 'Quản lý người dùng',
                    icon: User,
                    path: '/users',
                    description: 'Quản lý người dùng',
                    permissions: {
                        roles: ["Admin"],
                        departments: ["Giám đốc", "Hành chánh"],
                        positions: ["Kế toán"]
                    }
                }
            ]
        }
    ];

    // Function to toggle group collapse
    const toggleGroupCollapse = (groupName) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

    const handleLogout = () => {
        authUtils.logout();
        navigate('/');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const userInitial = userData?.username?.[0]?.toUpperCase() || '?';

    // Sample notifications for demo
    const notifications = [
        { id: 1, title: 'Chức năng đang xây dựng', message: 'Chức năng đang xây dựng', time: 'vừa xong', unread: true },

    ];



    // Check if any menu item in a group is active
    const isGroupActive = (group) => {
        return group.items.some(item => location.pathname === item.path);
    };

    // Check if current page is in this group to auto-expand it
    useEffect(() => {
        menuItems.forEach(group => {
            if (isGroupActive(group) && collapsedGroups[group.groupName]) {
                setCollapsedGroups(prev => ({
                    ...prev,
                    [group.groupName]: false // Expand the group
                }));
            }
        });
    }, [location.pathname]);

    const Sidebar = () => (
        <div className="flex flex-col h-full bg-white shadow-xl">
            {/* Logo & Brand */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-[#ffffff] to-[#d3b929]">
                <div className="flex items-center">
                    <img src="/logo1.png" alt="NZ Logo" className="h-9 drop-shadow-md" />
                    <div className="ml-2">
                        <h1 className="text-[14px] font-bold text-[#000000]">NZ ERP</h1>
                        <p className="text-[12px] text-[#000000]/80">Hệ thống quản lý doanh nghiệp</p>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-b bg-gradient-to-r from-[#f4f6fa] to-white">
                <div
                    className="flex items-center space-x-3 cursor-pointer hover:bg-white/90 p-2 rounded-lg transition-all duration-200"
                    onClick={() => {
                        navigate('/profile');
                        isMobile && setIsSidebarOpen(false);
                    }}
                >
                    {userData?.Image ? (
                        <img
                            src={userData?.Image}
                            alt="Profile Picture"
                            className="w-10 h-10 rounded-full object-cover shadow-md border-2 border-white"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#b7a035] to-[#d99c07] flex items-center justify-center text-white font-semibold shadow-md">
                            {userInitial}
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-gray-800">
                            {userData?.['Mã nhân viên'] || userData?.username}
                        </p>
                        <p className="text-sm text-[#b7a035]">
                            {userData?.['Chức vụ'] || 'Nhân viên'} - {userData?.['Phòng'] || 'Không xác định'}
                        </p>
                    </div>
                </div>
            </div>



            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                {/* Render standalone menu items first */}
                {standaloneMenuItems
                    .filter(item => hasPermission(item, userData))
                    .map((item, index) => {
                        const Icon = item.icon;
                        const isItemActive = location.pathname === item.path;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (item.isLogout) {
                                        handleLogout();
                                    }
                                    else if (item.isExternal) {
                                        if (item.requiresUserParam && userData) {
                                            const finalUrl = `${item.path}`;
                                            window.location.href = finalUrl;
                                        } else {
                                            window.open(item.path, '_blank');
                                        }
                                    } else {
                                        navigate(item.path);
                                    }
                                    isMobile && setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group mb-1
                                    ${isItemActive
                                        ? 'bg-gradient-to-r from-[#002266]/10 to-[#003399]/10 text-[#003399] shadow-sm border-l-3 border-[#003399]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }
                                `}
                                title={item.description}
                            >
                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isItemActive ? 'bg-gradient-to-r from-[#537988] to-[#003399] text-white' : 'bg-gray-100 text-gray-500 group-hover:text-[#003399] group-hover:bg-gray-200'} transition-colors`}>
                                    <Icon className="h-4.5 w-4.5" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className={`font-medium ${isItemActive ? 'text-[#003399]' : 'text-gray-700'}`}>
                                        {item.text}
                                    </span>
                                    {isItemActive && item.description && (
                                        <span className="text-xs text-gray-400 mt-0.5">{item.description}</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}

                {/* Divider between standalone items and groups */}
                <div className="border-t my-2"></div>

                {/* Then render grouped menu items */}
                {menuItems
                    // Filter groups user has permission to access
                    .filter(group => hasPermission(group, userData))
                    .map((group, groupIndex) => {
                        const GroupIcon = group.icon;
                        const isActive = isGroupActive(group);
                        const isCollapsed = collapsedGroups[group.groupName];

                        // Filter items user has permission to access
                        const accessibleItems = group.items.filter(item => hasPermission(item, userData));

                        // Don't show group if no accessible items
                        if (accessibleItems.length === 0) {
                            return null;
                        }

                        return (
                            <div key={groupIndex} className="mb-2">
                                {/* Group Header */}
                                <button
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200
                                        ${isActive ? 'bg-[#002266]/5 text-[#003399]' : 'text-gray-600 hover:bg-gray-50'}`}
                                    onClick={() => toggleGroupCollapse(group.groupName)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className={`flex items-center justify-center w-6 h-6 rounded-md ${isActive ? 'bg-gradient-to-r from-[#002266] to-[#003399] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            <GroupIcon className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-wider">
                                            {group.groupName}
                                        </span>
                                    </div>
                                    <div className={`rounded-full p-1 ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                        {isCollapsed ?
                                            <ChevronRight className="h-3.5 w-3.5 text-gray-500" /> :
                                            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                                        }
                                    </div>
                                </button>

                                {/* Group Items */}
                                {!isCollapsed && (
                                    <div className="ml-3 mt-1 space-y-1">
                                        {accessibleItems.map((item) => {
                                            const Icon = item.icon;
                                            const isItemActive = location.pathname === item.path;
                                            return (
                                                <button
                                                    key={item.text}
                                                    onClick={() => {
                                                        if (item.isLogout) {
                                                            handleLogout();
                                                        }
                                                        else if (item.isExternal) {
                                                            if (item.requiresUserParam && userData) {
                                                                const finalUrl = `${item.path}`;
                                                                window.location.href = finalUrl;
                                                            } else {
                                                                window.open(item.path, '_blank');
                                                            }
                                                        } else {
                                                            navigate(item.path);
                                                        }
                                                        isMobile && setIsSidebarOpen(false);
                                                    }}
                                                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
                                                        ${isItemActive
                                                            ? 'bg-gradient-to-r from-[#b7a035]/10 to-[#d99c07]/10 text-[#b7a035] shadow-sm'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                        }
                                                    `}
                                                    title={item.description}
                                                >
                                                    <div className={`flex items-center justify-center w-7 h-7 rounded-md ${isItemActive ? 'bg-gradient-to-r from-[#b7a035] to-[#d99c07] text-white' : 'bg-gray-100 text-gray-500 group-hover:text-[#b7a035] group-hover:bg-gray-200'} transition-colors`}>
                                                        <Icon className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className={`font-medium text-sm ${isItemActive ? 'text-[#b7a035]' : 'text-gray-700'}`}>
                                                            {item.text}
                                                        </span>
                                                        {isItemActive && item.description && (
                                                            <span className="text-xs text-gray-400 mt-0.5">{item.description}</span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </nav>

            {/* Footer */}
            <div className="px-6 py-3 border-t bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col items-center text-center">
                    <div className="flex items-center space-x-3 mb-2">

                    </div>
                    <p className="text-xs text-gray-500">© 2025 CÔNG TY TNHH TM&DV NZ</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-gray-800/60 z-40 backdrop-blur-sm"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full transform transition-transform duration-300 ease-in-out z-50 
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-xl overflow-hidden`}
                style={{ width: '280px' }}
            >
                <Sidebar />
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:pl-[280px]' : 'pl-0'}`}>
                {/* Header */}
                <header className={`fixed top-0 right-0 left-0 ${isSidebarOpen ? 'lg:left-[280px]' : 'left-0'} z-20 transition-all duration-300`}>
                    <div className="h-16 bg-white border-b px-4 flex items-center justify-between shadow-sm">
                        {/* Sidebar Toggle & Page Title */}
                        <div className="flex items-center space-x-3">
                            <button
                                className="p-1.5 rounded-lg text-[#003399] hover:bg-[#002266]/10 hover:text-[#002266] transition-colors"
                                onClick={toggleSidebar}
                                aria-label={isSidebarOpen ? "Đóng menu" : "Mở menu"}
                            >
                                {isSidebarOpen ? <ChevronLeft className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                            </button>

                            {/* Breadcrumb & Page title */}
                            <div className="flex items-center space-x-2">
                                <a onClick={() => {
                                    navigate('/Home');
                                    setIsProfileMenuOpen(false);
                                }} className="text-sm text-gray-500 hover:text-[#b7a035] transition-colors">Trang chủ</a>
                                {location.pathname !== '/Home' && (
                                    <>
                                        <span className="text-gray-400">/</span>
                                        <h2 className="text-base font-medium text-gray-800">
                                            {location.pathname === '/profile'
                                                ? 'Thông tin cá nhân' :
                                                location.pathname === '/notifications'
                                                    ? 'Thông báo' :
                                                    location.pathname === '/support'
                                                        ? 'Hỗ trợ' :
                                                        location.pathname === '/settings'
                                                            ? 'Cài đặt'
                                                            : [...standaloneMenuItems, ...menuItems.flatMap(group => group.items)].find(item => item.path === location.pathname)?.text || 'Trang khác'}
                                        </h2>
                                    </>
                                )}
                            </div>
                        </div>


                        {/* Right - Notifications & User Menu */}
                        <div className="flex items-center space-x-1">
                            {/* Current time */}
                            <div className="hidden md:flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full mr-1">
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                <span>
                                    {`${new Date().toLocaleDateString('vi-VN', { weekday: 'long' })}, ${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                                </span>
                                <span className="mx-1.5 text-gray-300">|</span>
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                <span>
                                    {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Notifications */}
                            <div className="relative notifications-container">
                                <button
                                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                    className="p-2 rounded-full hover:bg-[#002266]/5 relative"
                                    aria-label="Thông báo"
                                >
                                    <Bell className="h-5 w-5 text-gray-600" />
                                    {notifications.some(n => n.unread) && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {isNotificationsOpen && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border py-1 z-50">
                                        <div className="px-4 py-2 border-b">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-medium text-gray-800">Thông báo</h3>
                                                <button className="text-xs text-[#b7a035] hover:underline">
                                                    Đánh dấu tất cả đã đọc
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.map(notification => (
                                                    <div
                                                        key={notification.id}
                                                        className={`px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 ${notification.unread ? 'bg-[#002266]/5' : ''}`}
                                                    >
                                                        <div className="flex items-start">
                                                            <div className={`w-2 h-2 rounded-full mt-2 mr-2 ${notification.unread ? 'bg-[#b7a035]' : 'bg-gray-300'}`}></div>
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-medium text-gray-800">{notification.title}</h4>
                                                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-6 text-center text-gray-500">
                                                    <p>Không có thông báo mới</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-4 py-2 border-t">
                                            <button
                                                className="w-full text-center text-sm text-[#b7a035] hover:underline"
                                                onClick={() => navigate('/Home')}
                                            >
                                                Xem tất cả thông báo
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Menu */}
                            <div className="relative profile-menu-container">
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center space-x-2 hover:bg-[#002266]/5 rounded-lg py-1.5 pl-2 pr-3 ml-1"
                                    aria-label="Menu người dùng"
                                >
                                    {userData?.Image ? (
                                        <img
                                            src={userData?.Image}
                                            alt="Profile Picture"
                                            className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#b7a035] to-[#d99c07] flex items-center justify-center text-white font-semibold shadow-sm">
                                            {userInitial}
                                        </div>
                                    )}
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-700 leading-tight">
                                            {userData?.['Họ và Tên']?.split(' ').pop() || userData?.username || 'Người dùng'}
                                        </p>
                                        <p className="text-xs text-gray-500 leading-tight">
                                            {userData?.['Chức vụ'] || 'Nhân viên'}
                                        </p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
                                </button>

                                {/* User Dropdown Menu */}
                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border py-1 z-50">
                                        <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
                                            <div className="flex items-center space-x-3">
                                                {userData?.Image ? (
                                                    <img
                                                        src={userData?.Image}
                                                        alt="Profile Picture"
                                                        className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#b7a035] to-[#d99c07] flex items-center justify-center text-white text-lg font-semibold shadow-md">
                                                        {userInitial}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {userData?.['Họ và Tên'] || userData?.username}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {userData?.Email || 'Không xác định'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-1">
                                                <div className="text-xs text-gray-500 flex items-center">
                                                    <Shield className="h-3 w-3 mr-1 text-gray-400" />
                                                    <span>{userData?.['Phân quyền'] || 'User'}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center">
                                                    <BriefcaseBusiness className="h-3 w-3 mr-1 text-gray-400" />
                                                    <span>{userData?.['Phòng'] || 'Chưa có'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    navigate('/profile');
                                                    setIsProfileMenuOpen(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#002266]/5 flex items-center space-x-2"
                                            >
                                                <User className="h-4 w-4 text-gray-500" />
                                                <span>Thông tin cá nhân</span>
                                            </button>

                                        </div>

                                        <div className="border-t my-1"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                        >
                                            <LogOut className="h-4 w-4 text-red-500" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Page actions bar - only show when actions are available */}
                    {pageActions.length > 0 && (
                        <div className="h-12 bg-white border-b shadow-sm px-4 flex items-center space-x-2 overflow-x-auto">
                            {pageActions.map((action, index) => (
                                action.component ? (
                                    <div key={index} className="flex-shrink-0">
                                        {action.component}
                                    </div>
                                ) : (
                                    <button
                                        key={index}
                                        onClick={action.onClick}
                                        className={`${action.className || 'px-3 py-1.5 bg-gradient-to-r from-[#b7a035] to-[#d99c07] hover:from-[#d99c07] hover:to-[#e4ac16] text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all'} 
                                        flex items-center space-x-2 flex-shrink-0`}
                                        title={action.title || action.text}
                                        disabled={action.disabled}
                                    >
                                        {action.icon && action.icon}
                                        <span className={isMobile && action.text && action.icon ? 'hidden sm:inline' : ''}>
                                            {action.text}
                                        </span>
                                    </button>
                                )
                            ))}
                        </div>
                    )}
                </header>

                {/* Main Content */}
                <main className={`mt-16 ${pageActions.length > 0 ? 'pt-12' : 'pt-0'}`}>
                    <div className="p-5">
                        {children}
                    </div>
                </main>

                {/* Footer for main content area */}
                <footer className="mt-auto py-4 px-5 border-t bg-white text-center text-xs text-gray-500">
                    <p>© 2025 CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ NZ</p>
                    <p className="mt-1 text-gray-400">
                        <span className="hidden sm:inline">KHO: 32/21/11 Hà Thị Khiêm, P.Trung Mỹ Tây, Q.12, TP.HCM | </span>
                        <span>Văn phòng: 128/6 Lê Đức Thọ, P.6, Q.Gò Vấp, TP.HCM</span>
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default MainLayout;