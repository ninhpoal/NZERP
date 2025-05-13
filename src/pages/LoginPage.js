import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authUtils from '../utils/authUtils';
import config from '../config/config';
import { toast } from 'react-toastify';
import { Card, CardContent } from '../components/ui/card';
import { Eye, EyeOff, Lock, User, Briefcase, MapPin, GraduationCap, Globe, Phone, Mail } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        // Clear any previous toast messages when component mounts
        toast.dismiss();

        if (authUtils.isAuthenticated()) {
            const returnUrl = localStorage.getItem('returnUrl');
            if (returnUrl) {
                localStorage.removeItem('returnUrl');
                navigate(returnUrl);
            } else {
                navigate(config.ROUTES.MENU);
            }
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent multiple submissions
        if (loading) return;

        // Dismiss any existing toasts to prevent duplicates
        toast.dismiss();

        if (!formData.username || !formData.password) {
            toast.error('Vui lòng nhập đầy đủ thông tin đăng nhập!', {
                autoClose: 3000,
                pauseOnHover: true
            });
            return;
        }

        setLoading(true);
        try {
            const user = await authUtils.login(formData.username, formData.password, rememberMe);

            // Show success message with consistent timing
            toast.success(`Chào mừng ${user.username} đã quay trở lại!`, {
                autoClose: 1500,
                pauseOnHover: false
            });

            // Use a consistent timeout for navigation that matches toast duration
            setTimeout(() => {
                const returnUrl = localStorage.getItem('returnUrl');
                if (returnUrl) {
                    localStorage.removeItem('returnUrl');
                    navigate(returnUrl);
                } else {
                    navigate(config.ROUTES.MENU);
                }
            }, 1500);

        } catch (error) {
            toast.error(error.message, {
                autoClose: 4000,
                pauseOnHover: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center"
            style={{
                backgroundImage: 'url(https://nzltd.vn/wp-content/uploads/2024/09/banner-1-fix-2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
            }}>

            {/* Overlay */}

            <div className="w-full max-w-md mx-4 relative z-10">
                <Card className="shadow-2xl border border-gray-100 backdrop-blur-sm bg-white/95">
                    <CardContent className="p-8">
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center mb-3">
                                <img src="/logo1.png" alt="NZ Logo" className="h-20 drop-shadow-md" />
                                <div className="ml-2  from-[#ffffff] to-[#ffffff] text-[#000000] text-3xl px-3 py-1.5 rounded-md font-bold ">
                                    NZ LTD
                                </div>
                            </div>
                            <h1 className="text-xl font-semibold text-gray-800">Hệ thống quản lý doanh nghiệp</h1>
                        </div>

                        {location.state?.from && (
                            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-lg">
                                <p className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                    </svg>
                                    Bạn cần đăng nhập để truy cập trang {location.state.from}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label
                                    htmlFor="username"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Tên đăng nhập
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#d99c07]" />
                                    </div>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        placeholder="Nhập tên đăng nhập"
                                        className="w-full h-12 pl-10 rounded-lg border border-gray-200 focus:border-[#d99c07] focus:ring-2 focus:ring-yellow-100 transition-all outline-none shadow-sm"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Mật khẩu
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#d99c07]" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="Nhập mật khẩu"
                                        className="w-full h-12 pl-10 pr-12 rounded-lg border border-gray-200 focus:border-[#d99c07] focus:ring-2 focus:ring-yellow-100 transition-all outline-none shadow-sm"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id="remember" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="h-4 w-4 text-[#d99c07] focus:ring-yellow-100 border-gray-300 rounded" 
                                    />
                                    <label htmlFor="remember" className="ml-2 text-gray-600">Ghi nhớ đăng nhập</label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-gradient-to-r from-[#b7a035] to-[#d99c07] hover:from-[#d99c07] hover:to-[#e4ac16] text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70 transform hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xử lý...
                                    </div>
                                ) : (
                                    'Đăng nhập'
                                )}
                            </button>
                        </form>

                        {/* Support */}
                        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-600">
                            <div className="flex items-center justify-center space-x-4">
                                <a href="https://nzltd.vn" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-[#d99c07] transition-colors">
                                    <Globe className="h-4 w-4 mr-1" />
                                    nzltd.vn
                                </a>
                                <a href="tel:+84xxxxxxxxx" className="flex items-center hover:text-[#d99c07] transition-colors">
                                    <Phone className="h-4 w-4 mr-1" />
                                    Hotline
                                </a>
                                <a href="mailto:info@nzltd.vn" className="flex items-center hover:text-[#d99c07] transition-colors">
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email
                                </a>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                            <p className="flex items-start">
                                <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-400" />
                                <span>
                                    <strong>KHO:</strong> 32/21/11 Hà Thị Khiêm, P.Trung Mỹ Tây, Q.12, TP.HCM
                                    <br />
                                    <strong>Văn phòng:</strong> 128/6 Lê Đức Thọ, P.6, Q.Gò Vấp, TP.HCM
                                </span>
                            </p>
                            <p className="mt-1 flex items-center">
                                <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                <span>info@nzltd.vn</span>
                            </p>
                        </div>

                        <div className="text-center mt-4 text-gray-600 text-xs font-medium">
                            © 2025 CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ NZ
                        </div>
                        <div className="text-center mt-4 text-gray-600 text-xs font-medium">
                            Liên hệ NZ - PHƯỚC NV ĐỂ LẤY MẬT KHẨU
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;