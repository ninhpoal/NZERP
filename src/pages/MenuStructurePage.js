import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ExternalLink } from 'lucide-react';
import authUtils from '../utils/authUtils';
import menuConfig, { checkPermission } from '../config/menuConfig';

const MenuStructurePage = () => {
    const navigate = useNavigate();
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const userData = authUtils.getUserData();

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
        <div className="h-[calc(100vh-7rem)] bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Main Content */}
            <div className="mx-auto p-4">
                {menuConfig
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