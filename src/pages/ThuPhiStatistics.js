import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Filter, Printer, RefreshCcw, Search } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

const ThuPhiStatistics = () => {
    // State Management
    const [thuData, setThuData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'Thời gian', direction: 'descending' });
    const [showFilters, setShowFilters] = useState(false);
    const [chartType, setChartType] = useState('monthly'); // 'monthly', 'area', 'employee'
    const [groupBy, setGroupBy] = useState('month'); // 'month', 'area', 'mathu', 'nhanvien', 'tkthu'
    const [filterYear, setFilterYear] = useState([new Date().getFullYear()]);

    const [filterMonths, setFilterMonths] = useState([`Tháng ${new Date().getMonth() + 1}`]);
    const [filterArea, setFilterArea] = useState(['TẤT CẢ']);
    const [filterMaThu, setFilterMaThu] = useState(['TẤT CẢ']);
    const [filterNhanVien, setFilterNhanVien] = useState(['TẤT CẢ']);
    const [filterTKTHU, setFilterTKTHU] = useState(['TẤT CẢ']);
    const [filterTKCHI, setFilterTKCHI] = useState(['TẤT CẢ']);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Chart ref
    const chartRef = useRef(null);

    const resetFilters = () => {
        setSearch('');
        setFilterArea(['TẤT CẢ']);
        setFilterYear(new Date().getFullYear());

        setFilterMonths([`Tháng ${new Date().getMonth() + 1}`]);
        setFilterMaThu(['TẤT CẢ']);
        setFilterNhanVien(['TẤT CẢ']);
        setFilterTKTHU(['TẤT CẢ']);
        setFilterTKCHI(['TẤT CẢ']);
        setStartDate(null);
        setEndDate(null);
        setCurrentPage(1);
    };

    // Fetch thu data
    const fetchThuData = async () => {
        try {
            setLoading(true);
            const response = await authUtils.apiRequestThuChi('THU', 'Find', {});

            // Transform dữ liệu thu
            const transformedThuData = response.map(thu => ({
                ...thu,
                'Thời gian': thu['Thời gian'] ? new Date(thu['Thời gian']) : null,
                'Số tiền': parseFloat(thu['Số tiền']) || 0,
                'Tháng': thu['Thời gian'] ? new Date(thu['Thời gian']).getMonth() + 1 : null,
                'Năm': thu['Thời gian'] ? new Date(thu['Thời gian']).getFullYear() : null
            }));

            setThuData(transformedThuData);
            setLoading(false);
            toast.success('Đã tải dữ liệu thu thành công');
        } catch (error) {
            console.error('Error fetching thu data:', error);
            toast.error('Lỗi khi tải dữ liệu thu');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThuData();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterArea, filterYear, filterMonths, filterMaThu, filterNhanVien, filterTKTHU, filterTKCHI, startDate, endDate]);

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
        const sortableItems = [...thuData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const keyA = a[sortConfig.key];
                const keyB = b[sortConfig.key];

                // Handle null/undefined values
                if (keyA === null || keyA === undefined) return 1;
                if (keyB === null || keyB === undefined) return -1;

                // Handle date sorting
                if (keyA instanceof Date && keyB instanceof Date) {
                    return sortConfig.direction === 'ascending'
                        ? keyA.getTime() - keyB.getTime()
                        : keyB.getTime() - keyA.getTime();
                }

                // Handle number sorting
                if (typeof keyA === 'number' && typeof keyB === 'number') {
                    return sortConfig.direction === 'ascending'
                        ? keyA - keyB
                        : keyB - keyA;
                }

                // Handle string sorting
                if (typeof keyA === 'string' && typeof keyB === 'string') {
                    return sortConfig.direction === 'ascending'
                        ? keyA.localeCompare(keyB)
                        : keyB.localeCompare(keyA);
                }

                return 0;
            });
        }
        return sortableItems;
    }, [thuData, sortConfig]);

    // Get unique values for filters
    const areas = ['TẤT CẢ', ...new Set(thuData.map(thu => thu['KHU VỰC']).filter(Boolean))];
    const maThuList = ['TẤT CẢ', ...new Set(thuData.map(thu => thu['Mã THU']).filter(Boolean))];
    const nhanVienList = ['TẤT CẢ', ...new Set(thuData.map(thu => thu['NHÂN VIÊN THỰC HIỆN']).filter(Boolean))];
    const tkthuList = ['TẤT CẢ', ...new Set(thuData.map(thu => thu['Tài khoản thu']).filter(Boolean))];
    const tkchiList = ['TẤT CẢ', ...new Set(thuData.map(thu => thu['Tài khoản chi']).filter(Boolean))];

    // Get years for filtering
    const years = useMemo(() => {
        const uniqueYears = [...new Set(thuData
            .filter(thu => thu['Thời gian'])
            .map(thu => new Date(thu['Thời gian']).getFullYear())
        )];

        // Sort years in descending order
        uniqueYears.sort((a, b) => b - a);

        // If no years found, use current year
        if (uniqueYears.length === 0) {
            uniqueYears.push(new Date().getFullYear());
        }

        return uniqueYears;
    }, [thuData]);

    // Get months for filtering
    const months = ['TẤT CẢ', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    // Filtered items based on search and filters
    const filteredItems = useMemo(() => {
        return getSortedItems.filter(thu => {
            const matchesSearch =
                (thu['IDTHU']?.toLowerCase().includes(search.toLowerCase())) ||
                (thu['Mã THU']?.toLowerCase().includes(search.toLowerCase())) ||
                (thu['Nội dung']?.toLowerCase().includes(search.toLowerCase())) ||
                (thu['Ghi chú']?.toLowerCase().includes(search.toLowerCase()));

            const matchesArea = filterArea.includes('TẤT CẢ') || filterArea.includes(thu['KHU VỰC']);
            const matchesMaThu = filterMaThu.includes('TẤT CẢ') || filterMaThu.includes(thu['Mã THU']);
            const matchesNhanVien = filterNhanVien.includes('TẤT CẢ') || filterNhanVien.includes(thu['NHÂN VIÊN THỰC HIỆN']);
            const matchesTKTHU = filterTKTHU.includes('TẤT CẢ') || filterTKTHU.includes(thu['Tài khoản thu']);
            const matchesTKCHI = filterTKCHI.includes('TẤT CẢ') || filterTKCHI.includes(thu['Tài khoản chi']);

            const thuYear = thu['Thời gian']
                ? new Date(thu['Thời gian']).getFullYear()
                : null;

            // Thay đổi ở đây - kiểm tra xem năm có trong mảng filterYear không
            const matchesYear = filterYear.includes(thuYear);

            const thuMonth = thu['Thời gian']
                ? new Date(thu['Thời gian']).getMonth() + 1
                : null;

            const matchesMonth = filterMonths.includes('TẤT CẢ') || (thu['Thời gian'] && filterMonths.some(monthName => {
                if (monthName === 'TẤT CẢ') return true;
                const monthNumber = parseInt(monthName.replace('Tháng ', ''));
                return new Date(thu['Thời gian']).getMonth() + 1 === monthNumber;
            }));

            // Check date range
            let matchesDateRange = true;
            if (startDate && endDate) {
                const thuDate = thu['Thời gian'];
                if (thuDate) {
                    matchesDateRange = thuDate >= startDate && thuDate <= endDate;
                } else {
                    matchesDateRange = false;
                }
            }

            return matchesSearch && matchesArea && matchesYear &&
                matchesMonth && matchesMaThu && matchesNhanVien && matchesTKTHU &&
                matchesTKCHI && matchesDateRange;
        });
    }, [getSortedItems, search, filterArea, filterYear, filterMonths,
        filterMaThu, filterNhanVien, filterTKTHU, filterTKCHI, startDate, endDate]);
    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    // Calculate statistics by different groups
    const calculateGroupStatistics = (groupType) => {
        const stats = {};

        switch (groupType) {
            case 'month':
                // Đối với nhiều năm, nhóm theo tháng/năm
                if (filterYear.length > 1) {
                    filterYear.forEach(year => {
                        for (let month = 1; month <= 12; month++) {
                            const monthYearKey = `Tháng ${month}/${year}`;
                            const monthItems = filteredItems.filter(thu => {
                                if (!thu['Thời gian']) return false;
                                const thuDate = new Date(thu['Thời gian']);
                                return thuDate.getMonth() + 1 === month && thuDate.getFullYear() === year;
                            });

                            stats[monthYearKey] = {
                                count: monthItems.length,
                                totalAmount: monthItems.reduce((sum, thu) => sum + (thu['Số tiền'] || 0), 0)
                            };
                        }
                    });
                } else {
                    // Nếu chỉ có một năm, giữ nguyên logic cũ
                    for (let month = 1; month <= 12; month++) {
                        const monthName = `Tháng ${month}`;
                        const monthItems = filteredItems.filter(thu => {
                            if (!thu['Thời gian']) return false;
                            const thuDate = new Date(thu['Thời gian']);
                            return thuDate.getMonth() + 1 === month && thuDate.getFullYear() === filterYear[0];
                        });

                        stats[monthName] = {
                            count: monthItems.length,
                            totalAmount: monthItems.reduce((sum, thu) => sum + (thu['Số tiền'] || 0), 0)
                        };
                    }
                }
                break;

            case 'area':
                // Group by area
                areas.filter(area => area !== 'TẤT CẢ').forEach(area => {
                    const areaItems = filteredItems.filter(thu => thu['KHU VỰC'] === area);
                    stats[area] = {
                        count: areaItems.length,
                        totalAmount: areaItems.reduce((sum, thu) => sum + (thu['Số tiền'] || 0), 0)
                    };
                });
                break;

            case 'mathu':
                // Group by Mã THU
                maThuList.filter(maThu => maThu !== 'TẤT CẢ').forEach(maThu => {
                    const maThuItems = filteredItems.filter(thu => thu['Mã THU'] === maThu);
                    stats[maThu] = {
                        count: maThuItems.length,
                        totalAmount: maThuItems.reduce((sum, thu) => sum + (thu['Số tiền'] || 0), 0)
                    };
                });
                break;

            case 'nhanvien':
                // Group by employee
                nhanVienList.filter(nv => nv !== 'TẤT CẢ').forEach(nv => {
                    const nvItems = filteredItems.filter(thu => thu['NHÂN VIÊN THỰC HIỆN'] === nv);
                    stats[nv] = {
                        count: nvItems.length,
                        totalAmount: nvItems.reduce((sum, thu) => sum + (thu['Số tiền'] || 0), 0)
                    };
                });
                break;

            case 'tkthu':
                // Group by Tài khoản thu
                tkthuList.filter(tk => tk !== 'TẤT CẢ').forEach(tk => {
                    const tkItems = filteredItems.filter(thu => thu['Tài khoản thu'] === tk);
                    stats[tk] = {
                        count: tkItems.length,
                        totalAmount: tkItems.reduce((sum, thu) => sum + (thu['Số tiền'] || 0), 0)
                    };
                });
                break;

            default:
                break;
        }

        return stats;
    };

    // Prepare chart data based on grouping
    const getChartConfig = () => {
        const stats = calculateGroupStatistics(groupBy);
        const labels = Object.keys(stats);
        const values = Object.values(stats).map(item => item.totalAmount);
        const counts = Object.values(stats).map(item => item.count);
        const yearDisplay = filterYear.length > 1
            ? `Năm ${filterYear.join(', ')}`
            : `Năm ${filterYear[0]}`;
        const colors = [
            '#4F46E5', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
            '#06B6D4', '#84CC16', '#F97316', '#6366F1', '#14B8A6', '#D946EF'
        ];

        // Common options for all chart types
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.label.includes('Thu')) {
                                label += formatCurrency(context.parsed.y || context.parsed);
                            } else {
                                label += context.parsed.y || context.parsed;
                            }
                            return label;
                        }
                    }
                },
                datalabels: {
                    align: 'center',
                    anchor: 'end',
                    formatter: function (value) {
                        if (value >= 1000000000) {
                            return (value / 1000000000).toFixed(1) + ' tỷ';
                        } else if (value >= 1000000) {
                            return (value / 1000000).toFixed(0) + 'tr';
                        } else {
                            return value;
                        }
                    },
                    color: '#fff',
                    font: {
                        weight: 'bold',
                        size: 12,
                    },
                }
            },
        };

        switch (chartType) {
            case 'monthly':
                return {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                type: 'bar',
                                label: 'Số phiếu thu',
                                data: counts,
                                backgroundColor: '#4F46E5',
                                yAxisID: 'y',
                                datalabels: {
                                    color: '#4F46E5',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'bar',
                                label: 'Tổng thu',
                                data: values,
                                backgroundColor: '#F59E0B',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#F59E0B',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            }
                        ]
                    },
                    options: {
                        ...commonOptions,
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Số lượng phiếu'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Số tiền (VNĐ)'
                                },
                                grid: {
                                    drawOnChartArea: false
                                }
                            }
                        },
                        plugins: {
                            ...commonOptions.plugins,
                            title: {
                                display: true,
                                text: `Thống kê thu theo ${getGroupLabel(groupBy)} (${yearDisplay})`,
                                font: {
                                    size: 16
                                }
                            }
                        }
                    }
                };

            case 'pie':
                return {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Tổng thu',
                                data: values,
                                backgroundColor: colors.slice(0, labels.length),
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            title: {
                                display: true,
                                text: `Phân bổ thu theo ${getGroupLabel(groupBy)} (${yearDisplay})`
                                ,

                                font: {
                                    size: 16
                                }
                            }
                        }
                    }
                };

            default:
                return null;
        }
    };

    // Helper function to get group labels for display
    const getGroupLabel = (group) => {
        switch (group) {
            case 'month': return 'tháng';
            case 'area': return 'khu vực';
            case 'mathu': return 'mã thu';
            case 'nhanvien': return 'nhân viên';
            case 'tkthu': return 'tài khoản thu';
            default: return group;
        }
    };

    // Calculate summary statistics
    const statistics = useMemo(() => {
        const totalIncome = filteredItems.reduce((sum, thu) => sum + (thu['Số tiền'] || 0), 0);
        const totalCount = filteredItems.length;
        const avgPerTransaction = totalCount > 0 ? totalIncome / totalCount : 0;

        return {
            totalIncome,
            totalCount,
            avgPerTransaction
        };
    }, [filteredItems]);

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
        fetchThuData();
        toast.info('Đang làm mới dữ liệu...');
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            // Prepare data for export
            const exportData = filteredItems.map(thu => ({
                'IDTHU': thu['IDTHU'] || '',
                'KHU VỰC': thu['KHU VỰC'] || '',
                'Dự án': thu['Dự án'] || '',
                'Mã THU': thu['Mã THU'] || '',
                'Thời gian': formatDate(thu['Thời gian']),
                'Số tiền': thu['Số tiền'] || 0,
                'Nội dung': thu['Nội dung'] || '',
                'NHÂN VIÊN THỰC HIỆN': thu['NHÂN VIÊN THỰC HIỆN'] || '',
                'Tài khoản thu': thu['Tài khoản thu'] || '',
                'Tài khoản chi': thu['Tài khoản chi'] || '',
                'Ghi chú': thu['Ghi chú'] || ''
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Thống kê thu');

            // Generate statistics worksheet
            const statsData = [
                { Thống_kê: 'Tổng số phiếu thu', Giá_trị: statistics.totalCount },
                { Thống_kê: 'Tổng thu', Giá_trị: statistics.totalIncome },
                { Thống_kê: 'Thu trung bình/phiếu', Giá_trị: statistics.avgPerTransaction }
            ];

            const statsWs = XLSX.utils.json_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, statsWs, 'Tổng quan');

            // Generate grouped data worksheets
            const monthStats = calculateGroupStatistics('month');
            const monthData = Object.entries(monthStats).map(([month, data]) => ({
                Tháng: month,
                Số_phiếu: data.count,
                Tổng_thu: data.totalAmount
            }));
            const monthWs = XLSX.utils.json_to_sheet(monthData);
            XLSX.utils.book_append_sheet(wb, monthWs, 'Theo tháng');

            const areaStats = calculateGroupStatistics('area');
            const areaData = Object.entries(areaStats).map(([area, data]) => ({
                Khu_vực: area,
                Số_phiếu: data.count,
                Tổng_thu: data.totalAmount
            }));
            const areaWs = XLSX.utils.json_to_sheet(areaData);
            XLSX.utils.book_append_sheet(wb, areaWs, 'Theo khu vực');

            // Save file
            const fileName = `Thong_ke_thu_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success('Đã xuất dữ liệu thành công');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Lỗi khi xuất dữ liệu');
        }
    };

    // Pagination controls
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Month options for multi-select
    const monthOptions = months.map(month => ({ value: month, label: month }));

    // Pagination component
    const PaginationControls = () => {
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
                            Hiển thị <span className="font-medium">{filteredItems.length === 0 ? 0 : indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredItems.length)}</span> của <span className="font-medium">{filteredItems.length}</span> kết quả
                        </p>
                    </div>
                    <div>
                        <div className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                            >
                                <span className="sr-only">Trang trước</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>

                            {pageNumbers.map(number => (
                                <button
                                    key={number}
                                    onClick={() => handlePageChange(number)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === number
                                        ? 'bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                        }`}
                                >
                                    {number}
                                </button>
                            ))}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                            >
                                <span className="sr-only">Trang sau</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 print:shadow-none print:border-none">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                        <h1 className="text-2xl font-bold text-gray-800">Thống Kê Thu</h1>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Filter className="w-4 h-4" />
                                {showFilters ? "Ẩn bộ lọc" : "Bộ lọc"}
                            </button>
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Làm mới bộ lọc
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

                    {/* Search and Filter Section */}
                    <div className="mb-6 space-y-4 print:hidden">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo mã thu, nội dung, ghi chú..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {showFilters && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {/* Khoảng thời gian */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Từ ngày:</h3>
                                        <DatePicker
                                            selected={startDate}
                                            onChange={(date) => setStartDate(date)}
                                            selectsStart
                                            startDate={startDate}
                                            endDate={endDate}
                                            dateFormat="dd/MM/yyyy"
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholderText="Chọn ngày bắt đầu"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Đến ngày:</h3>
                                        <DatePicker
                                            selected={endDate}
                                            onChange={(date) => setEndDate(date)}
                                            selectsEnd
                                            startDate={startDate}
                                            endDate={endDate}
                                            minDate={startDate}
                                            dateFormat="dd/MM/yyyy"
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholderText="Chọn ngày kết thúc"
                                        />
                                    </div>

                                    {/* Area filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Khu vực:</h3>
                                        <Select
                                            isMulti
                                            options={areas.map(area => ({ value: area, label: area }))}
                                            value={filterArea.map(area => ({ value: area, label: area }))}
                                            onChange={(selectedOptions) => {
                                                if (selectedOptions.length === 0) {
                                                    // If nothing selected, default to "TẤT CẢ"
                                                    setFilterArea(['TẤT CẢ']);
                                                } else {
                                                    const values = selectedOptions.map(option => option.value);
                                                    // If "TẤT CẢ" is selected along with other options, remove "TẤT CẢ"
                                                    if (values.includes('TẤT CẢ') && values.length > 1) {
                                                        setFilterArea(values.filter(v => v !== 'TẤT CẢ'));
                                                    }
                                                    // If a specific option is selected and "TẤT CẢ" was previously selected, remove "TẤT CẢ"
                                                    else if (filterArea.includes('TẤT CẢ') && !values.includes('TẤT CẢ')) {
                                                        setFilterArea(values);
                                                    }
                                                    // Otherwise just use the selected values
                                                    else {
                                                        setFilterArea(values);
                                                    }
                                                }
                                            }}
                                            placeholder="Chọn khu vực..."
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    </div>

                                    {/* Year filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Năm:</h3>
                                        <Select
                                            isMulti
                                            options={years.map(year => ({ value: year, label: year.toString() }))}
                                            value={filterYear.map(year => ({ value: year, label: year.toString() }))}
                                            onChange={(selectedOptions) => {
                                                if (selectedOptions.length === 0) {
                                                    // Nếu không chọn gì, mặc định là năm hiện tại
                                                    setFilterYear([new Date().getFullYear()]);


                                                } else {
                                                    const values = selectedOptions.map(option => parseInt(option.value));
                                                    setFilterYear(values);
                                                }
                                            }}
                                            placeholder="Chọn năm..."
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    </div>

                                    {/* Month filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Tháng:</h3>
                                        <Select
                                            isMulti
                                            options={monthOptions}
                                            value={monthOptions.filter(option => filterMonths.includes(option.value))}
                                            onChange={(selectedOptions) => {
                                                if (selectedOptions.length === 0) {
                                                    setFilterMonths(['TẤT CẢ']);
                                                } else {
                                                    const values = selectedOptions.map(option => option.value);
                                                    if (values.includes('TẤT CẢ') && values.length > 1) {
                                                        setFilterMonths(values.filter(v => v !== 'TẤT CẢ'));
                                                    } else if (filterMonths.includes('TẤT CẢ') && !values.includes('TẤT CẢ')) {
                                                        setFilterMonths(values);
                                                    } else {
                                                        setFilterMonths(values);
                                                    }
                                                }
                                            }}
                                            placeholder="Chọn tháng..."
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    </div>

                                    {/* Mã Thu filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Mã Thu:</h3>
                                        <Select
                                            isMulti
                                            options={maThuList.map(maThu => ({ value: maThu, label: maThu }))}
                                            value={filterMaThu.map(maThu => ({ value: maThu, label: maThu }))}
                                            onChange={(selectedOptions) => {
                                                if (selectedOptions.length === 0) {
                                                    setFilterMaThu(['TẤT CẢ']);
                                                } else {
                                                    const values = selectedOptions.map(option => option.value);
                                                    if (values.includes('TẤT CẢ') && values.length > 1) {
                                                        setFilterMaThu(values.filter(v => v !== 'TẤT CẢ'));
                                                    } else if (filterMaThu.includes('TẤT CẢ') && !values.includes('TẤT CẢ')) {
                                                        setFilterMaThu(values);
                                                    } else {
                                                        setFilterMaThu(values);
                                                    }
                                                }
                                            }}
                                            placeholder="Chọn mã thu..."
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    </div>

                                    {/* Nhân viên filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Nhân viên:</h3>
                                        <Select
                                            isMulti
                                            options={nhanVienList.map(nv => ({ value: nv, label: nv }))}
                                            value={filterNhanVien.map(nv => ({ value: nv, label: nv }))}
                                            onChange={(selectedOptions) => {
                                                if (selectedOptions.length === 0) {
                                                    setFilterNhanVien(['TẤT CẢ']);
                                                } else {
                                                    const values = selectedOptions.map(option => option.value);
                                                    if (values.includes('TẤT CẢ') && values.length > 1) {
                                                        setFilterNhanVien(values.filter(v => v !== 'TẤT CẢ'));
                                                    } else if (filterNhanVien.includes('TẤT CẢ') && !values.includes('TẤT CẢ')) {
                                                        setFilterNhanVien(values);
                                                    } else {
                                                        setFilterNhanVien(values);
                                                    }
                                                }
                                            }}
                                            placeholder="Chọn nhân viên..."
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    </div>

                                    {/* Tài khoản thu filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Tài khoản Thu:</h3>
                                        <Select
                                            isMulti
                                            options={tkthuList.map(tk => ({ value: tk, label: tk }))}
                                            value={filterTKTHU.map(tk => ({ value: tk, label: tk }))}
                                            onChange={(selectedOptions) => {
                                                if (selectedOptions.length === 0) {
                                                    setFilterTKTHU(['TẤT CẢ']);
                                                } else {
                                                    const values = selectedOptions.map(option => option.value);
                                                    if (values.includes('TẤT CẢ') && values.length > 1) {
                                                        setFilterTKTHU(values.filter(v => v !== 'TẤT CẢ'));
                                                    } else if (filterTKTHU.includes('TẤT CẢ') && !values.includes('TẤT CẢ')) {
                                                        setFilterTKTHU(values);
                                                    } else {
                                                        setFilterTKTHU(values);
                                                    }
                                                }
                                            }}
                                            placeholder="Chọn tài khoản thu..."
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
                                    </div>

                                    {/* Tài khoản chi filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Tài khoản Chi:</h3>
                                        <Select
                                            isMulti
                                            options={tkchiList.map(tk => ({ value: tk, label: tk }))}
                                            value={filterTKCHI.map(tk => ({ value: tk, label: tk }))}
                                            onChange={(selectedOptions) => {
                                                if (selectedOptions.length === 0) {
                                                    setFilterTKCHI(['TẤT CẢ']);
                                                } else {
                                                    const values = selectedOptions.map(option => option.value);
                                                    if (values.includes('TẤT CẢ') && values.length > 1) {
                                                        setFilterTKCHI(values.filter(v => v !== 'TẤT CẢ'));
                                                    } else if (filterTKCHI.includes('TẤT CẢ') && !values.includes('TẤT CẢ')) {
                                                        setFilterTKCHI(values);
                                                    } else {
                                                        setFilterTKCHI(values);
                                                    }
                                                }
                                            }}
                                            placeholder="Chọn tài khoản chi..."
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                        />
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
                                                    <option key={size} value={size}>{size} phiếu thu</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Tổng thu</h3>
                            <p className="text-2xl font-bold text-blue-800">{formatCurrency(statistics.totalIncome)}</p>
                            <p className="text-xs text-blue-600 mt-1">Từ {statistics.totalCount} phiếu thu</p>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Số phiếu thu</h3>
                            <p className="text-2xl font-bold text-green-800">{statistics.totalCount}</p>
                            <p className="text-xs text-green-600 mt-1">Thời gian: {startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : `Năm ${filterYear.join(', ')}`}</p>  </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <h3 className="text-sm text-amber-700 mb-1">Thu trung bình/phiếu</h3>
                            <p className="text-2xl font-bold text-amber-800">{formatCurrency(statistics.avgPerTransaction)}</p>
                            <p className="text-xs text-amber-600 mt-1">&nbsp;</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Thống kê thu</h2>
                            <div className="flex space-x-2 print:hidden">
                                <div className="mr-4">
                                    <select
                                        value={groupBy}
                                        onChange={(e) => setGroupBy(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="month">Theo tháng</option>
                                        <option value="area">Theo khu vực</option>
                                        <option value="mathu">Theo mã thu</option>
                                        <option value="nhanvien">Theo nhân viên</option>
                                        <option value="tkthu">Theo tài khoản thu</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => setChartType('monthly')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${chartType === 'monthly'
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                        } border`}
                                >
                                    Dạng cột
                                </button>
                                <button
                                    onClick={() => setChartType('pie')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${chartType === 'pie'
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                        } border`}
                                >
                                    Dạng tròn
                                </button>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div style={{ height: '500px', width: '100%' }}>
                                {getChartConfig() && (
                                    <div className="chart-container" style={{ position: 'relative', height: '100%', width: '100%' }}>
                                        {chartType === 'monthly' && <Bar data={getChartConfig().data} options={getChartConfig().options} ref={chartRef} />}
                                        {chartType === 'pie' && <Pie data={getChartConfig().data} options={getChartConfig().options} ref={chartRef} />}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bảng thống kê theo nhóm */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Thống kê thu theo {getGroupLabel(groupBy)}</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getGroupLabel(groupBy)}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số phiếu thu</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng thu</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tỷ lệ (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(calculateGroupStatistics(groupBy)).map(([key, stats]) => (
                                        <tr key={key}>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{stats.count}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(stats.totalAmount)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {statistics.totalIncome > 0 ?
                                                    (stats.totalAmount / statistics.totalIncome * 100).toFixed(2) + '%' :
                                                    '0%'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-medium">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Tổng cộng</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{statistics.totalCount}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(statistics.totalIncome)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Danh sách thu</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('IDTHU')}>
                                            ID Thu {getSortIcon('IDTHU')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('KHU VỰC')}>
                                            Khu vực {getSortIcon('KHU VỰC')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Dự án')}>
                                            Dự án {getSortIcon('Dự án')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Mã THU')}>
                                            Mã Thu {getSortIcon('Mã THU')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Thời gian')}>
                                            Thời gian {getSortIcon('Thời gian')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Số tiền')}>
                                            Số Tiền {getSortIcon('Số tiền')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Nội dung')}>
                                            Nội Dung {getSortIcon('Nội dung')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('NHÂN VIÊN THỰC HIỆN')}>
                                            NV {getSortIcon('NHÂN VIÊN THỰC HIỆN')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Tài khoản thu')}>
                                            TK Thu {getSortIcon('Tài khoản thu')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Tài khoản chi')}>
                                            TK Chi {getSortIcon('Tài khoản chi')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Ghi chú')}>
                                            Ghi chú {getSortIcon('Ghi chú')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="11" className="px-4 py-4 text-center">
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
                                        currentItems.map((thu, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {thu['IDTHU']}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {thu['KHU VỰC'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {thu['Dự án'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {thu['Mã THU'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatDate(thu['Thời gian'])}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatCurrency(thu['Số tiền'])}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-700">
                                                    {thu['Nội dung'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {thu['NHÂN VIÊN THỰC HIỆN'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {thu['Tài khoản thu'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {thu['Tài khoản chi'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {thu['Ghi chú'] || '—'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="11" className="px-4 py-6 text-center text-sm text-gray-500">
                                                Không tìm thấy phiếu thu nào phù hợp với tiêu chí tìm kiếm
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && filteredItems.length > 0 && (
                            <PaginationControls />
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

export default ThuPhiStatistics;