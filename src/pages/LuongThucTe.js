import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Filter, Printer, RefreshCcw, Search } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Select from 'react-select';

// Import Chart.js components
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    ChartDataLabels
);

const LuongThucTe = () => {
    // State Management
    const [luongData, setLuongData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDoiThiCong, setFilterDoiThiCong] = useState('TẤT CẢ');
    const [filterKhachHang, setFilterKhachHang] = useState('TẤT CẢ');
    const [filterKhuVuc, setFilterKhuVuc] = useState('TẤT CẢ');
    const [filterNhomDoi, setFilterNhomDoi] = useState('TẤT CẢ');
    const [filterThang, setFilterThang] = useState('TẤT CẢ');
    const [filterNguon, setFilterNguon] = useState('TẤT CẢ');
    const [sortConfig, setSortConfig] = useState({ key: 'THÁNG', direction: 'descending' });
    const [showFilters, setShowFilters] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentSummaryPage, setCurrentSummaryPage] = useState(1);
    const itemsPerSummaryPage = 10;

    // Fetch data
    const fetchLuongData = async () => {
        try {
            setLoading(true);
            const response = await authUtils.apiRequest('LUONG', 'Find', {});

            // Transform data
            const transformedData = response.map(item => ({
                ...item,
                'THÁNG': item['THÁNG'] ? new Date(item['THÁNG']) : null,
                'SỐ LƯỢNG': parseFloat(item['SỐ LƯỢNG']) || 0,
                'ĐƠN GIÁ': parseFloat(item['ĐƠN GIÁ']) || 0,
                'THÀNH TIỀN': parseFloat(item['THÀNH TIỀN']) || 0
            }));

            setLuongData(transformedData);
            setLoading(false);
            toast.success('Đã tải dữ liệu thành công');
        } catch (error) {
            console.error('Error fetching luong data:', error);
            toast.error('Lỗi khi tải dữ liệu lương');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLuongData();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
        setCurrentSummaryPage(1);
    }, [search, filterDoiThiCong, filterKhachHang, filterKhuVuc, filterNhomDoi, filterThang, filterNguon]);

    // Sorting function
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Get sorted items
    const getSortedItems = useMemo(() => {
        const sortableItems = [...luongData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const keyA = a[sortConfig.key];
                const keyB = b[sortConfig.key];

                if (keyA === null || keyA === undefined) return 1;
                if (keyB === null || keyB === undefined) return -1;

                if (keyA instanceof Date && keyB instanceof Date) {
                    return sortConfig.direction === 'ascending'
                        ? keyA.getTime() - keyB.getTime()
                        : keyB.getTime() - keyA.getTime();
                }

                if (typeof keyA === 'number' && typeof keyB === 'number') {
                    return sortConfig.direction === 'ascending'
                        ? keyA - keyB
                        : keyB - keyA;
                }

                if (typeof keyA === 'string' && typeof keyB === 'string') {
                    return sortConfig.direction === 'ascending'
                        ? keyA.localeCompare(keyB)
                        : keyB.localeCompare(keyA);
                }

                return 0;
            });
        }
        return sortableItems;
    }, [luongData, sortConfig]);

    // Get unique values for filters
    const filterOptions = useMemo(() => {
        const doiThiCongList = ['TẤT CẢ', ...new Set(luongData.map(item => item['ĐỘI THI CÔNG']).filter(Boolean))];
        const khachHangList = ['TẤT CẢ', ...new Set(luongData.map(item => item['KHÁCH HÀNG']).filter(Boolean))];
        const khuVucList = ['TẤT CẢ', ...new Set(luongData.map(item => item['KHU VỰC']).filter(Boolean))];
        const nhomDoiList = ['TẤT CẢ', ...new Set(luongData.map(item => item['NHÓM ĐỘI']).filter(Boolean))];
        const thangList = ['TẤT CẢ', ...new Set(luongData.map(item => item['THÁNG'] ? new Date(item['THÁNG']).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : '').filter(Boolean))];
        const nguonList = ['TẤT CẢ', ...new Set(luongData.map(item => item['NGUỒN']).filter(Boolean))];

        return {
            doiThiCongList,
            khachHangList,
            khuVucList,
            nhomDoiList,
            thangList,
            nguonList
        };
    }, [luongData]);

    // Filtered items based on search and filters
    const filteredItems = useMemo(() => {
        return getSortedItems.filter(item => {
            const matchesSearch =
                (item['MÃ KẾ HOẠCH']?.toLowerCase().includes(search.toLowerCase())) ||
                (item['POP']?.toLowerCase().includes(search.toLowerCase()));

            const matchesDoiThiCong = filterDoiThiCong === 'TẤT CẢ' || item['ĐỘI THI CÔNG'] === filterDoiThiCong;
            const matchesKhachHang = filterKhachHang === 'TẤT CẢ' || item['KHÁCH HÀNG'] === filterKhachHang;
            const matchesKhuVuc = filterKhuVuc === 'TẤT CẢ' || item['KHU VỰC'] === filterKhuVuc;
            const matchesNhomDoi = filterNhomDoi === 'TẤT CẢ' || item['NHÓM ĐỘI'] === filterNhomDoi;
            const matchesThang = filterThang === 'TẤT CẢ' || 
                (item['THÁNG'] && new Date(item['THÁNG']).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) === filterThang);
            const matchesNguon = filterNguon === 'TẤT CẢ' || item['NGUỒN'] === filterNguon;

            return matchesSearch && matchesDoiThiCong && matchesKhachHang && 
                   matchesKhuVuc && matchesNhomDoi && matchesThang && matchesNguon;
        });
    }, [getSortedItems, search, filterDoiThiCong, filterKhachHang, filterKhuVuc, filterNhomDoi, filterThang, filterNguon]);

    // Calculate summary table data
    const summaryTableData = useMemo(() => {
        const groupedData = filteredItems.reduce((acc, item) => {
            const key = `${item['MÃ KẾ HOẠCH'] || 'Không có mã'}_${item['POP'] || 'Không có POP'}`;
            if (!acc[key]) {
                acc[key] = {
                    maKeHoach: item['MÃ KẾ HOẠCH'] || 'Không có mã',
                    pop: item['POP'] || 'Không có POP',
                    khuVuc: item['KHU VỰC'] || 'Không có khu vực',
                    soLuongKeo: 0,
                    soLuongHan: 0,
                    thanhTienHan: 0,
                    thanhTienKeo: 0
                };
            }

            if (item['LOẠI CÁP'] && item['LOẠI CÁP'].trim() !== '') {
                acc[key].soLuongHan += item['SỐ LƯỢNG'] || 0;
                acc[key].thanhTienHan += item['THÀNH TIỀN'] || 0;
            } else {
                acc[key].soLuongKeo += item['SỐ LƯỢNG'] || 0;
                acc[key].thanhTienKeo += item['THÀNH TIỀN'] || 0;
            }

            return acc;
        }, {});

        return Object.values(groupedData).sort((a, b) => {
            const maKeHoachCompare = a.maKeHoach.localeCompare(b.maKeHoach);
            if (maKeHoachCompare !== 0) return maKeHoachCompare;
            return a.pop.localeCompare(b.pop);
        });
    }, [filteredItems]);

    // Calculate chart data
    const chartData = useMemo(() => {
        const khuVucData = filteredItems.reduce((acc, item) => {
            const key = item['KHU VỰC'] || 'Không có khu vực';
            acc[key] = (acc[key] || 0) + (item['THÀNH TIỀN'] || 0);
            return acc;
        }, {});

        const khachHangData = filteredItems.reduce((acc, item) => {
            const key = item['KHÁCH HÀNG'] || 'Không có khách hàng';
            acc[key] = (acc[key] || 0) + (item['THÀNH TIỀN'] || 0);
            return acc;
        }, {});

        const loaiCapData = filteredItems.reduce((acc, item) => {
            const key = item['LOẠI CÁP'] ? 'Hàn nối' : 'Kéo cáp';
            acc[key] = (acc[key] || 0) + (item['THÀNH TIỀN'] || 0);
            return acc;
        }, {});

        const nguonData = filteredItems.reduce((acc, item) => {
            const key = item['NGUỒN'] || 'Không có nguồn';
            acc[key] = (acc[key] || 0) + (item['THÀNH TIỀN'] || 0);
            return acc;
        }, {});

        return {
            khuVuc: {
                labels: Object.keys(khuVucData),
                datasets: [{
                    label: 'Thành tiền theo khu vực',
                    data: Object.values(khuVucData),
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            khachHang: {
                labels: Object.keys(khachHangData),
                datasets: [{
                    label: 'Thành tiền theo khách hàng',
                    data: Object.values(khachHangData),
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            loaiCap: {
                labels: Object.keys(loaiCapData),
                datasets: [{
                    label: 'Thành tiền theo loại công việc',
                    data: Object.values(loaiCapData),
                    backgroundColor: [
                        'rgba(255, 159, 64, 0.5)',
                        'rgba(255, 205, 86, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 159, 64, 1)',
                        'rgba(255, 205, 86, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            nguon: {
                labels: Object.keys(nguonData),
                datasets: [{
                    label: 'Thành tiền theo nguồn',
                    data: Object.values(nguonData),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            }
        };
    }, [filteredItems]);

    // Chart options
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Thống kê thành tiền'
            },
            datalabels: {
                formatter: (value) => {
                    return formatCurrency(value);
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => formatCurrency(value)
                }
            }
        }
    };

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value);
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return '';
        try {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        } catch (error) {
            return '';
        }
    };

    // Get sort direction icon
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    };

    // Refresh data
    const handleRefreshData = () => {
        fetchLuongData();
        toast.info('Đang làm mới dữ liệu...');
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            const exportData = filteredItems.map(item => ({
                'THÁNG': formatDate(item['THÁNG']),
                'ĐỘI THI CÔNG': item['ĐỘI THI CÔNG'] || '',
                'KHÁCH HÀNG': item['KHÁCH HÀNG'] || '',
                'MÃ KẾ HOẠCH': item['MÃ KẾ HOẠCH'] || '',
                'POP': item['POP'] || '',
                'LOẠI CÁP': item['LOẠI CÁP'] || '',
                'VỊ TRÍ THI CÔNG': item['VỊ TRÍ THI CÔNG'] || '',
                'SỐ LƯỢNG': item['SỐ LƯỢNG'] || 0,
                'HẠNG MỤC': item['HẠNG MỤC'] || '',
                'ĐƠN GIÁ': item['ĐƠN GIÁ'] || 0,
                'THÀNH TIỀN': item['THÀNH TIỀN'] || 0,
                'GHI CHÚ': item['GHI CHÚ'] || '',
                'KHU VỰC': item['KHU VỰC'] || '',
                'NHÓM ĐỘI': item['NHÓM ĐỘI'] || '',
                'NGUỒN': item['NGUỒN'] || ''
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Lương thực tế');

            const fileName = `Luong_thuc_te_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success('Đã xuất dữ liệu thành công');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Lỗi khi xuất dữ liệu');
        }
    };

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const indexOfLastSummaryItem = currentSummaryPage * itemsPerSummaryPage;
    const indexOfFirstSummaryItem = indexOfLastSummaryItem - itemsPerSummaryPage;
    const currentSummaryItems = summaryTableData.slice(indexOfFirstSummaryItem, indexOfLastSummaryItem);
    const totalSummaryPages = Math.ceil(summaryTableData.length / itemsPerSummaryPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleSummaryPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalSummaryPages) {
            setCurrentSummaryPage(newPage);
        }
    };

    // Pagination component
    const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
        const pagesToShow = 5;
        const pageNumbers = [];

        let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + pagesToShow - 1);

        if (endPage - startPage + 1 < pagesToShow) {
            startPage = Math.max(1, endPage - pagesToShow + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến{' '}
                            <span className="font-medium">{Math.min(indexOfLastItem, filteredItems.length)}</span> của{' '}
                            <span className="font-medium">{filteredItems.length}</span> kết quả
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                            >
                                <span className="sr-only">Trang trước</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>

                            {startPage > 1 && (
                                <>
                                    <button
                                        onClick={() => onPageChange(1)}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        1
                                    </button>
                                    {startPage > 2 && (
                                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                            ...
                                        </span>
                                    )}
                                </>
                            )}

                            {pageNumbers.map(number => (
                                <button
                                    key={number}
                                    onClick={() => onPageChange(number)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                        currentPage === number
                                            ? 'bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                    }`}
                                >
                                    {number}
                                </button>
                            ))}

                            {endPage < totalPages && (
                                <>
                                    {endPage < totalPages - 1 && (
                                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                            ...
                                        </span>
                                    )}
                                    <button
                                        onClick={() => onPageChange(totalPages)}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                            >
                                <span className="sr-only">Trang sau</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Trước
                    </button>
                    <span className="text-sm text-gray-700">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Sau
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 h-[calc(100vh-7rem)] print:bg-white print:p-0">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 print:shadow-none print:border-none">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                        <h1 className="text-2xl font-bold text-gray-800">Thống Kê Lương Thực Tế</h1>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
                            </button>
                            <button
                                onClick={handleRefreshData}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Làm mới
                            </button>
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                Excel
                            </button>
                        </div>
                    </div>

                    {/* Print Title - only visible when printing */}
                    <div className="hidden print:block mb-6">
                        <h1 className="text-3xl font-bold text-center">Báo Cáo Lương Thực Tế</h1>
                        <p className="text-center text-gray-500">Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="mb-6 space-y-4 print:hidden">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã kế hoạch hoặc POP..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {showFilters && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {/* Đội thi công filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Đội thi công:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterDoiThiCong}
                                                onChange={(e) => setFilterDoiThiCong(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {filterOptions.doiThiCongList.map((doi, index) => (
                                                    <option key={index} value={doi}>{doi}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Khách hàng filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Khách hàng:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterKhachHang}
                                                onChange={(e) => setFilterKhachHang(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {filterOptions.khachHangList.map((kh, index) => (
                                                    <option key={index} value={kh}>{kh}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Khu vực filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Khu vực:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterKhuVuc}
                                                onChange={(e) => setFilterKhuVuc(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {filterOptions.khuVucList.map((kv, index) => (
                                                    <option key={index} value={kv}>{kv}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Nhóm đội filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Nhóm đội:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterNhomDoi}
                                                onChange={(e) => setFilterNhomDoi(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {filterOptions.nhomDoiList.map((nd, index) => (
                                                    <option key={index} value={nd}>{nd}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Tháng filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Tháng:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterThang}
                                                onChange={(e) => setFilterThang(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {filterOptions.thangList.map((thang, index) => (
                                                    <option key={index} value={thang}>{thang}</option>
                                                ))}
                                            </select>
                                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Nguồn filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Nguồn:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterNguon}
                                                onChange={(e) => setFilterNguon(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {filterOptions.nguonList.map((nguon, index) => (
                                                    <option key={index} value={nguon}>{nguon}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Items per page */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Hiển thị:</h3>
                                        <div className="relative">
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {[10, 25, 50, 100].map((size) => (
                                                    <option key={size} value={size}>{size} dòng</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Table Section */}
                    <div className="mb-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tổng hợp theo mã kế hoạch và POP</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã kế hoạch</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">POP</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Khu vực</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số lượng kéo</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số lượng hàn</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thành tiền hàn</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thành tiền kéo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentSummaryItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm text-gray-900">{item.maKeHoach}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{item.pop}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{item.khuVuc}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{item.soLuongKeo}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{item.soLuongHan}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.thanhTienHan)}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.thanhTienKeo)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination for summary table */}
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <button
                                        onClick={() => handleSummaryPageChange(currentSummaryPage - 1)}
                                        disabled={currentSummaryPage === 1}
                                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => handleSummaryPageChange(currentSummaryPage + 1)}
                                        disabled={currentSummaryPage === totalSummaryPages}
                                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Sau
                                    </button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Hiển thị <span className="font-medium">{indexOfFirstSummaryItem + 1}</span> đến{' '}
                                            <span className="font-medium">{Math.min(indexOfLastSummaryItem, summaryTableData.length)}</span> của{' '}
                                            <span className="font-medium">{summaryTableData.length}</span> kết quả
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            <button
                                                onClick={() => handleSummaryPageChange(currentSummaryPage - 1)}
                                                disabled={currentSummaryPage === 1}
                                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                            >
                                                <span className="sr-only">Trước</span>
                                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                            {Array.from({ length: totalSummaryPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => handleSummaryPageChange(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                                        currentSummaryPage === page
                                                            ? 'bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handleSummaryPageChange(currentSummaryPage + 1)}
                                                disabled={currentSummaryPage === totalSummaryPages}
                                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                            >
                                                <span className="sr-only">Sau</span>
                                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Khu vực chart */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê theo khu vực</h3>
                            <div className="h-80">
                                <Bar data={chartData.khuVuc} options={chartOptions} />
                            </div>
                        </div>

                        {/* Khách hàng chart */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê theo khách hàng</h3>
                            <div className="h-80">
                                <Bar data={chartData.khachHang} options={chartOptions} />
                            </div>
                        </div>

                        {/* Loại cáp chart */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê theo loại công việc</h3>
                            <div className="h-80">
                                <Pie data={chartData.loaiCap} options={{
                                    ...chartOptions,
                                    plugins: {
                                        ...chartOptions.plugins,
                                        datalabels: {
                                            formatter: (value) => {
                                                return formatCurrency(value);
                                            }
                                        }
                                    }
                                }} />
                            </div>
                        </div>

                        {/* Nguồn chart */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê theo nguồn</h3>
                            <div className="h-80">
                                <Bar data={chartData.nguon} options={chartOptions} />
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Danh sách lương thực tế</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('THÁNG')}>
                                            Tháng {getSortIcon('THÁNG')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('ĐỘI THI CÔNG')}>
                                            Đội thi công {getSortIcon('ĐỘI THI CÔNG')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('KHÁCH HÀNG')}>
                                            Khách hàng {getSortIcon('KHÁCH HÀNG')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('MÃ KẾ HOẠCH')}>
                                            Mã KH {getSortIcon('MÃ KẾ HOẠCH')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('POP')}>
                                            POP {getSortIcon('POP')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('LOẠI CÁP')}>
                                            Loại cáp {getSortIcon('LOẠI CÁP')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('VỊ TRÍ THI CÔNG')}>
                                            Vị trí {getSortIcon('VỊ TRÍ THI CÔNG')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('SỐ LƯỢNG')}>
                                            Số lượng {getSortIcon('SỐ LƯỢNG')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('HẠNG MỤC')}>
                                            Hạng mục {getSortIcon('HẠNG MỤC')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('ĐƠN GIÁ')}>
                                            Đơn giá {getSortIcon('ĐƠN GIÁ')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('THÀNH TIỀN')}>
                                            Thành tiền {getSortIcon('THÀNH TIỀN')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('KHU VỰC')}>
                                            Khu vực {getSortIcon('KHU VỰC')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('NHÓM ĐỘI')}>
                                            Nhóm đội {getSortIcon('NHÓM ĐỘI')}
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('NGUỒN')}>
                                            Nguồn {getSortIcon('NGUỒN')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="14" className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center">
                                                    <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span className="ml-2">Đang tải dữ liệu...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentItems.length > 0 ? (
                                        currentItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatDate(item['THÁNG'])}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['ĐỘI THI CÔNG'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['KHÁCH HÀNG'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['MÃ KẾ HOẠCH'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['POP'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['LOẠI CÁP'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['VỊ TRÍ THI CÔNG'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['SỐ LƯỢNG'] || 0}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['HẠNG MỤC'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatCurrency(item['ĐƠN GIÁ'])}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatCurrency(item['THÀNH TIỀN'])}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['KHU VỰC'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['NHÓM ĐỘI'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {item['NGUỒN'] || '—'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="14" className="px-4 py-6 text-center text-sm text-gray-500">
                                                Không tìm thấy dữ liệu nào phù hợp với tiêu chí tìm kiếm
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && filteredItems.length > 0 && (
                            <PaginationControls 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Toast Container */}
            <ToastContainer
                position="bottom-right"
                autoClose={1500}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
};

export default LuongThucTe; 