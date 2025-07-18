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

const ChiPhiStatistics = () => {
    // State Management
    const [chiData, setChiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'Ngày giải ngân', direction: 'descending' });
    const [showFilters, setShowFilters] = useState(false);
    const [chartType, setChartType] = useState('monthly'); // 'monthly', 'area', 'employee'
    const [groupBy, setGroupBy] = useState('month'); // 'month', 'area', 'machi', 'nhanvien', 'tkchi'
    const [filterYear, setFilterYear] = useState([new Date().getFullYear()]);


    const [filterMonths, setFilterMonths] = useState([`Tháng ${new Date().getMonth() + 1}`]);
    const [filterArea, setFilterArea] = useState(['TẤT CẢ']);
    const [filterStatus, setFilterStatus] = useState(['TẤT CẢ']);
    const [filterMaChi, setFilterMaChi] = useState(['TẤT CẢ']);
    const [filterNhanVien, setFilterNhanVien] = useState(['TẤT CẢ']);
    const [filterTKCHI, setFilterTKCHI] = useState(['TẤT CẢ']);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Chart ref
    const chartRef = useRef(null);
    const resetFilters = () => {
        setSearch('');
        setFilterArea(['TẤT CẢ']);
        setFilterStatus(['TẤT CẢ']);
        setFilterYear([new Date().getFullYear()]);


        setFilterMonths([`Tháng ${new Date().getMonth() + 1}`]);
        setFilterMaChi(['TẤT CẢ']);
        setFilterNhanVien(['TẤT CẢ']);
        setFilterTKCHI(['TẤT CẢ']);
        setStartDate(null);
        setEndDate(null);
        setCurrentPage(1);
    };
    // Fetch chi data
    const fetchChiData = async () => {
        try {
            setLoading(true);
            const response = await authUtils.apiRequest('CHI', 'Find', {});

            // Transform dữ liệu chi
            const transformedChiData = response.map(chi => ({
                ...chi,
                'Ngày giải ngân': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']) : null,
                'Ngày giao thực hiện giao dịch': chi['Ngày giao thực hiện giao dịch'] ? new Date(chi['Ngày giao thực hiện giao dịch']) : null,
                'SỐ TIỀN': parseFloat(chi['SỐ TIỀN']) || 0,
                'Số tiền chuyển khoản': parseFloat(chi['Số tiền chuyển khoản']) || 0,
                'Tháng': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']).getMonth() + 1 : null,
                'Năm': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']).getFullYear() : null
            }));

            setChiData(transformedChiData);
            setLoading(false);
            toast.success('Đã tải dữ liệu chi tiêu thành công');
        } catch (error) {
            console.error('Error fetching chi data:', error);
            toast.error('Lỗi khi tải dữ liệu chi tiêu');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChiData();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterArea, filterStatus, filterYear, filterMonths, filterMaChi, filterNhanVien, filterTKCHI, startDate, endDate]);

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
        const sortableItems = [...chiData];
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
    }, [chiData, sortConfig]);

    // Get unique values for filters
    const areas = ['TẤT CẢ', ...new Set(chiData.map(chi => chi['KHU VỰC']).filter(Boolean))];
    const statuses = ['TẤT CẢ', ...new Set(chiData.map(chi => chi['TRẠNG THÁI']).filter(Boolean))];
    const maChiList = ['TẤT CẢ', ...new Set(chiData.map(chi => chi['Mã CHI']).filter(Boolean))];
    const nhanVienList = ['TẤT CẢ', ...new Set(chiData.map(chi => chi['NHÂN VIÊN THỰC HIỆN']).filter(Boolean))];
    const tkchiList = ['TẤT CẢ', ...new Set(chiData.map(chi => chi['TKCHI']).filter(Boolean))];

    // Get years for filtering
    const years = useMemo(() => {
        const uniqueYears = [...new Set(chiData
            .filter(chi => chi['Ngày giải ngân'])
            .map(chi => new Date(chi['Ngày giải ngân']).getFullYear())
        )];

        // Sort years in descending order
        uniqueYears.sort((a, b) => b - a);

        // If no years found, use current year
        if (uniqueYears.length === 0) {
            uniqueYears.push(new Date().getFullYear());
        }

        return uniqueYears;
    }, [chiData]);

    // Get months for filtering
    const months = ['TẤT CẢ', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    // Filtered items based on search and filters
    const filteredItems = useMemo(() => {
        return getSortedItems.filter(chi => {
            const matchesSearch =
                (chi['Mã chuyển khoản']?.toLowerCase().includes(search.toLowerCase())) ||
                (chi['IDPHIEU']?.toLowerCase().includes(search.toLowerCase())) ||
                (chi['Mã CHI']?.toLowerCase().includes(search.toLowerCase())) ||
                (chi['NỘI DUNG']?.toLowerCase().includes(search.toLowerCase())) ||
                (chi['ĐỐI TƯỢNG']?.toLowerCase().includes(search.toLowerCase()));

            const matchesArea = filterArea.includes('TẤT CẢ') || filterArea.includes(chi['KHU VỰC']);
            const matchesStatus = filterStatus.includes('TẤT CẢ') || filterStatus.includes(chi['TRẠNG THÁI']);
            const matchesMaChi = filterMaChi.includes('TẤT CẢ') || filterMaChi.includes(chi['Mã CHI']);
            const matchesNhanVien = filterNhanVien.includes('TẤT CẢ') || filterNhanVien.includes(chi['NHÂN VIÊN THỰC HIỆN']);
            const matchesTKCHI = filterTKCHI.includes('TẤT CẢ') || filterTKCHI.includes(chi['TKCHI']);

            const chiYear = chi['Ngày giải ngân']
                ? new Date(chi['Ngày giải ngân']).getFullYear()
                : null;

            const matchesYear = filterYear.includes(chiYear);



            const chiMonth = chi['Ngày giải ngân']
                ? new Date(chi['Ngày giải ngân']).getMonth() + 1
                : null;

            const matchesMonth = filterMonths.includes('TẤT CẢ') || (chi['Ngày giải ngân'] && filterMonths.some(monthName => {
                if (monthName === 'TẤT CẢ') return true;
                const monthNumber = parseInt(monthName.replace('Tháng ', ''));
                return new Date(chi['Ngày giải ngân']).getMonth() + 1 === monthNumber;
            }));

            // Check date range
            let matchesDateRange = true;
            if (startDate && endDate) {
                const chiDate = chi['Ngày giải ngân'];
                if (chiDate) {
                    matchesDateRange = chiDate >= startDate && chiDate <= endDate;
                } else {
                    matchesDateRange = false;
                }
            }

            return matchesSearch && matchesArea && matchesStatus && matchesYear &&
                matchesMonth && matchesMaChi && matchesNhanVien && matchesTKCHI && matchesDateRange;
        });
    }, [getSortedItems, search, filterArea, filterStatus, filterYear, filterMonths,
        filterMaChi, filterNhanVien, filterTKCHI, startDate, endDate]);
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
                            const monthItems = filteredItems.filter(chi => {
                                if (!chi['Ngày giải ngân']) return false;
                                const chiDate = new Date(chi['Ngày giải ngân']);
                                return chiDate.getMonth() + 1 === month && chiDate.getFullYear() === year;
                            });

                            stats[monthYearKey] = {
                                count: monthItems.length,
                                totalAmount: monthItems.reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0)
                            };
                        }
                    });
                } else {
                    // Nếu chỉ có một năm, giữ nguyên logic cũ
                    for (let month = 1; month <= 12; month++) {
                        const monthName = `Tháng ${month}`;
                        const monthItems = filteredItems.filter(chi => {
                            if (!chi['Ngày giải ngân']) return false;
                            const chiDate = new Date(chi['Ngày giải ngân']);
                            return chiDate.getMonth() + 1 === month && chiDate.getFullYear() === filterYear[0];
                        });

                        stats[monthName] = {
                            count: monthItems.length,
                            totalAmount: monthItems.reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0)
                        };
                    }
                }
                break;

            case 'area':
                // Group by area
                areas.filter(area => area !== 'TẤT CẢ').forEach(area => {
                    const areaItems = filteredItems.filter(chi => chi['KHU VỰC'] === area);
                    stats[area] = {
                        count: areaItems.length,
                        totalAmount: areaItems.reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0)
                    };
                });
                break;

            case 'machi':
                // Group by Mã CHI
                maChiList.filter(maChi => maChi !== 'TẤT CẢ').forEach(maChi => {
                    const maChiItems = filteredItems.filter(chi => chi['Mã CHI'] === maChi);
                    stats[maChi] = {
                        count: maChiItems.length,
                        totalAmount: maChiItems.reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0)
                    };
                });
                break;

            case 'nhanvien':
                // Group by employee
                nhanVienList.filter(nv => nv !== 'TẤT CẢ').forEach(nv => {
                    const nvItems = filteredItems.filter(chi => chi['NHÂN VIÊN THỰC HIỆN'] === nv);
                    stats[nv] = {
                        count: nvItems.length,
                        totalAmount: nvItems.reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0)
                    };
                });
                break;

            case 'tkchi':
                // Group by TKCHI
                tkchiList.filter(tk => tk !== 'TẤT CẢ').forEach(tk => {
                    const tkItems = filteredItems.filter(chi => chi['TKCHI'] === tk);
                    stats[tk] = {
                        count: tkItems.length,
                        totalAmount: tkItems.reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0)
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
                            if (context.dataset.label.includes('Chi tiêu')) {
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
                                label: 'Số phiếu chi',
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
                                label: 'Tổng chi tiêu',
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
                                    text: 'Chi tiêu (VNĐ)'
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
                                text: `Thống kê chi tiêu theo ${getGroupLabel(groupBy)} (${yearDisplay})`
                                ,
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
                                label: 'Tổng chi tiêu',
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
                                text: `Phân bổ chi tiêu theo ${getGroupLabel(groupBy)} (${yearDisplay})`

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
            case 'machi': return 'mã chi';
            case 'nhanvien': return 'nhân viên';
            case 'tkchi': return 'tài khoản chi';
            default: return group;
        }
    };

    // Calculate summary statistics
    const statistics = useMemo(() => {
        const totalExpenses = filteredItems.reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0);
        const totalCount = filteredItems.length;
        const avgPerTransaction = totalCount > 0 ? totalExpenses / totalCount : 0;

        return {
            totalExpenses,
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
        fetchChiData();
        toast.info('Đang làm mới dữ liệu...');
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            // Sort data by date before export
            const sortedData = [...filteredItems].sort((a, b) => {
                const dateA = a['Ngày giải ngân'] ? new Date(a['Ngày giải ngân']) : new Date(0);
                const dateB = b['Ngày giải ngân'] ? new Date(b['Ngày giải ngân']) : new Date(0);
                return dateB.getTime() - dateA.getTime(); // Sắp xếp giảm dần (mới nhất trước)
            });

            // Prepare data for export with better date formatting
            const exportData = sortedData.map(chi => ({
                'Mã chuyển khoản': chi['Mã chuyển khoản'] || '',
                'IDPHIEU': chi['IDPHIEU'] || '',
                'KHU VỰC': chi['KHU VỰC'] || '',
                'Dự án': chi['Dự án'] || '',
                'Mã CHI': chi['Mã CHI'] || '',
                'Ngày giải ngân': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']) : null,
                'SỐ TIỀN': chi['SỐ TIỀN'] || 0,
                'NỘI DUNG': chi['NỘI DUNG'] || '',
                'NHÂN VIÊN THỰC HIỆN': chi['NHÂN VIÊN THỰC HIỆN'] || '',
                'ĐỐI TƯỢNG': chi['ĐỐI TƯỢNG'] || '',
                'TRẠNG THÁI': chi['TRẠNG THÁI'] || '',
                'TKCHI': chi['TKCHI'] || '',
                'HOADON': chi['HOADON'] || ''
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Set column widths
            const columnWidths = [
                { wch: 15 }, // Mã chuyển khoản
                { wch: 12 }, // IDPHIEU
                { wch: 12 }, // KHU VỰC
                { wch: 20 }, // Dự án
                { wch: 12 }, // Mã CHI
                { wch: 12 }, // Ngày giải ngân
                { wch: 15 }, // SỐ TIỀN
                { wch: 40 }, // NỘI DUNG
                { wch: 20 }, // NHÂN VIÊN THỰC HIỆN
                { wch: 20 }, // ĐỐI TƯỢNG
                { wch: 12 }, // TRẠNG THÁI
                { wch: 15 }, // TKCHI
                { wch: 15 }  // HOADON
            ];
            ws['!cols'] = columnWidths;

            // Format date column
            const dateColumn = 'F'; // Column F is 'Ngày giải ngân'
            for (let i = 2; i <= exportData.length + 1; i++) {
                const cellAddress = `${dateColumn}${i}`;
                if (ws[cellAddress] && ws[cellAddress].v) {
                    // Set number format for date
                    ws[cellAddress].z = 'dd/mm/yyyy';
                }
            }

            // Format currency column
            const currencyColumn = 'G'; // Column G is 'SỐ TIỀN'
            for (let i = 2; i <= exportData.length + 1; i++) {
                const cellAddress = `${currencyColumn}${i}`;
                if (ws[cellAddress] && ws[cellAddress].v) {
                    // Set number format for currency
                    ws[cellAddress].z = '#,##0';
                }
            }

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Thống kê chi tiêu');

            // Generate statistics worksheet
            const statsData = [
                { Thống_kê: 'Tổng số phiếu chi', Giá_trị: statistics.totalCount },
                { Thống_kê: 'Tổng chi tiêu', Giá_trị: statistics.totalExpenses },
                { Thống_kê: 'Chi tiêu trung bình/phiếu', Giá_trị: statistics.avgPerTransaction }
            ];

            const statsWs = XLSX.utils.json_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, statsWs, 'Tổng quan');

            // Generate grouped data worksheets
            const monthStats = calculateGroupStatistics('month');
            const monthData = Object.entries(monthStats).map(([month, data]) => ({
                Tháng: month,
                Số_phiếu: data.count,
                Tổng_chi_tiêu: data.totalAmount
            }));
            const monthWs = XLSX.utils.json_to_sheet(monthData);
            XLSX.utils.book_append_sheet(wb, monthWs, 'Theo tháng');

            const areaStats = calculateGroupStatistics('area');
            const areaData = Object.entries(areaStats).map(([area, data]) => ({
                Khu_vực: area,
                Số_phiếu: data.count,
                Tổng_chi_tiêu: data.totalAmount
            }));
            const areaWs = XLSX.utils.json_to_sheet(areaData);
            XLSX.utils.book_append_sheet(wb, areaWs, 'Theo khu vực');

            // Save file
            const fileName = `Thong_ke_chi_tieu_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        <div className=" bg-gray-50 h-[calc(100vh-7rem)] print:bg-white print:p-0">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 print:shadow-none print:border-none">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                        <h1 className="text-2xl font-bold text-gray-800">Thống Kê Chi Tiêu</h1>
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
                                placeholder="Tìm kiếm theo mã chuyển khoản, mã chi, nội dung..."
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
                                    {/* Status filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Trạng thái:</h3>
                                        <Select
                                            isMulti
                                            options={statuses.map(status => ({ value: status, label: status }))}
                                            value={filterStatus.map(status => ({ value: status, label: status }))}
                                            onChange={(selectedOptions) => {
                                                if (selectedOptions.length === 0) {
                                                    setFilterStatus(['TẤT CẢ']);
                                                } else {
                                                    const values = selectedOptions.map(option => option.value);
                                                    if (values.includes('TẤT CẢ') && values.length > 1) {
                                                        setFilterStatus(values.filter(v => v !== 'TẤT CẢ'));
                                                    } else if (filterStatus.includes('TẤT CẢ') && !values.includes('TẤT CẢ')) {
                                                        setFilterStatus(values);
                                                    } else {
                                                        setFilterStatus(values);
                                                    }
                                                }
                                            }}
                                            placeholder="Chọn trạng thái..."
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

                                    {/* Mã Chi filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Mã Chi:</h3>
                                        <Select
                                            isMulti
                                            options={maChiList.map(maChi => ({ value: maChi, label: maChi }))}
                                            value={filterMaChi.map(maChi => ({ value: maChi, label: maChi }))}
                                            onChange={(selectedOptions) => {
                                                if (selectedOptions.length === 0) {
                                                    setFilterMaChi(['TẤT CẢ']);
                                                } else {
                                                    const values = selectedOptions.map(option => option.value);
                                                    if (values.includes('TẤT CẢ') && values.length > 1) {
                                                        setFilterMaChi(values.filter(v => v !== 'TẤT CẢ'));
                                                    } else if (filterMaChi.includes('TẤT CẢ') && !values.includes('TẤT CẢ')) {
                                                        setFilterMaChi(values);
                                                    } else {
                                                        setFilterMaChi(values);
                                                    }
                                                }
                                            }}
                                            placeholder="Chọn mã chi..."
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
                                    {/* TKCHI filter */}
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
                                                    <option key={size} value={size}>{size} phiếu chi</option>
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
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <h3 className="text-sm text-amber-700 mb-1">Tổng chi tiêu</h3>
                            <p className="text-2xl font-bold text-amber-800">{formatCurrency(statistics.totalExpenses)}</p>
                            <p className="text-xs text-amber-600 mt-1">Từ {statistics.totalCount} phiếu chi</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Số phiếu chi</h3>
                            <p className="text-2xl font-bold text-blue-800">{statistics.totalCount}</p>
                            <p className="text-xs text-blue-600 mt-1">
                                Thời gian: {startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : `Năm ${filterYear.join(', ')}`}
                            </p>  </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Chi tiêu trung bình/phiếu</h3>
                            <p className="text-2xl font-bold text-green-800">{formatCurrency(statistics.avgPerTransaction)}</p>
                            <p className="text-xs text-green-600 mt-1">&nbsp;</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Thống kê chi tiêu</h2>
                            <div className="flex space-x-2 print:hidden">
                                <div className="mr-4">
                                    <select
                                        value={groupBy}
                                        onChange={(e) => setGroupBy(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="month">Theo tháng</option>
                                        <option value="area">Theo khu vực</option>
                                        <option value="machi">Theo mã chi</option>
                                        <option value="nhanvien">Theo nhân viên</option>
                                        <option value="tkchi">Theo tài khoản chi</option>
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
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Thống kê chi tiêu theo {getGroupLabel(groupBy)}</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{getGroupLabel(groupBy)}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số phiếu chi</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng chi tiêu</th>
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
                                                {statistics.totalExpenses > 0 ?
                                                    (stats.totalAmount / statistics.totalExpenses * 100).toFixed(2) + '%' :
                                                    '0%'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-medium">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Tổng cộng</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{statistics.totalCount}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(statistics.totalExpenses)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">100%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Danh sách chi tiêu</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Mã chuyển khoản')}>
                                            Mã CK {getSortIcon('Mã chuyển khoản')}
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
                                            onClick={() => requestSort('Mã CHI')}>
                                            Mã Chi {getSortIcon('Mã CHI')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Ngày giải ngân')}>
                                            Ngày GN {getSortIcon('Ngày giải ngân')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('SỐ TIỀN')}>
                                            Số Tiền {getSortIcon('SỐ TIỀN')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('NỘI DUNG')}>
                                            Nội Dung {getSortIcon('NỘI DUNG')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('NHÂN VIÊN THỰC HIỆN')}>
                                            NV {getSortIcon('NHÂN VIÊN THỰC HIỆN')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('ĐỐI TƯỢNG')}>
                                            Đối Tượng {getSortIcon('ĐỐI TƯỢNG')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('TRẠNG THÁI')}>
                                            Trạng Thái {getSortIcon('TRẠNG THÁI')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('TKCHI')}>
                                            TK Chi {getSortIcon('TKCHI')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="12" className="px-4 py-4 text-center">
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
                                        currentItems.map((chi, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {chi['Mã chuyển khoản']}
                                                </td>

                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {chi['KHU VỰC'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {chi['Dự án'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {chi['Mã CHI'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatDate(chi['Ngày giải ngân'])}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {formatCurrency(chi['SỐ TIỀN'])}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-700">
                                                    {chi['NỘI DUNG'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {chi['NHÂN VIÊN THỰC HIỆN'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {chi['ĐỐI TƯỢNG'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                            ${chi['TRẠNG THÁI'] === 'Đã giải ngân'
                                                            ? 'bg-green-100 text-green-800'
                                                            : chi['TRẠNG THÁI'] === 'Đang xử lý'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {chi['TRẠNG THÁI'] || 'Chưa xác định'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {chi['TKCHI'] || '—'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="12" className="px-4 py-6 text-center text-sm text-gray-500">
                                                Không tìm thấy phiếu chi nào phù hợp với tiêu chí tìm kiếm
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

export default ChiPhiStatistics;
