import React, { useState, useEffect, useMemo, useCallback, useRef, memo, lazy, Suspense } from 'react';
import * as XLSX from 'xlsx';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Filter, Printer, RefreshCcw, Search } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Select from 'react-select';
import debounce from 'lodash/debounce';
import { AutoSizer, List } from 'react-virtualized';

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

// Memoized Table Row Component
const TableRow = memo(({ project, formatCurrency, formatDate }) => {
    // Tính chênh lệch giữa HSHC và doanh thu nội suy
    const hshc = parseFloat(project['Số tiền HSHC Trước thuế']) || 0;
    const noiSuy = parseFloat(project['Doanh thu nội suy']) || 0;
    const chenhLech = hshc - noiSuy;
    const chenhLechPercent = hshc > 0 ? (chenhLech / hshc * 100).toFixed(1) : 0;

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {project['Mã kế hoạch']}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {project['POP'] || '—'}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {project['Khu vực'] || '—'}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatDate(project['Ngày nhận kế hoạch'])}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatCurrency(project['Số tiền HSHC Trước thuế'])}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatCurrency(project['Doanh thu tạm tính'])}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${project['Trạng thái'] === 'Hoàn thành'
                        ? 'bg-green-100 text-green-800'
                        : project['Trạng thái'] === 'Đang thực hiện'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}>
                    {project['Trạng thái'] || 'Chưa xác định'}
                </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${project['Check'] === 'Đạt'
                        ? 'bg-green-100 text-green-800'
                        : project['Check'] === 'Trung bình'
                            ? 'bg-yellow-100 text-yellow-800'
                            : project['Check'] === 'Xấu'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                    }`}>
                    {project['Check'] || 'Chưa đánh giá'}
                </span>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatCurrency(project['Nội suy kéo'])}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatCurrency(project['Nội suy hàn'])}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {formatCurrency(project['Doanh thu nội suy'])}
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <span className={chenhLech > 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(chenhLech)} ({chenhLechPercent}%)
                </span>
            </td>
        </tr>
    );
});

// Memoized Project Chart Component
const ProjectChart = memo(({ chartType, chartConfig, chartRef }) => {
    useEffect(() => {
        return () => {
            if (chartRef.current && chartRef.current.destroy) {
                chartRef.current.destroy();
            }
        };
    }, [chartRef]);

    return (
        <div className="chart-container" style={{ position: 'relative', height: '100%', width: '100%' }}>
            {chartType === 'monthly' && <Bar data={chartConfig.data} options={chartConfig.options} ref={chartRef} />}
            {chartType === 'cumulative' && <Line data={chartConfig.data} options={chartConfig.options} ref={chartRef} />}
            {chartType === 'average' && <Bar data={chartConfig.data} options={chartConfig.options} ref={chartRef} />}
        </div>
    );
});

// Memoized Statistics Table Component
const StatisticsTable = memo(({ title, data, columns, totalRow, formatCurrency }) => {
    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(data).map(([key, value]) => (
                            <tr key={key}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key}</td>
                                {columns.slice(1).map((col, index) => (
                                    <td key={index} className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {col.format ? col.format(value[col.accessor]) : value[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {totalRow && (
                            <tr className="bg-gray-50 font-medium">
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Tổng cộng</td>
                                {columns.slice(1).map((col, index) => (
                                    <td key={index} className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        {col.format ? col.format(totalRow[col.accessor]) : totalRow[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

// Pagination Controls Component
const PaginationControls = memo(({ currentPage, totalPages, handlePageChange }) => {
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
                        Hiển thị <span className="font-medium">{currentPage === 1 ? 1 : (currentPage - 1) * 10 + 1}</span> đến <span className="font-medium">{Math.min(currentPage * 10, totalPages * 10)}</span> của <span className="font-medium">{totalPages * 10}</span> kết quả
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

                        {startPage > 1 && (
                            <>
                                <button
                                    onClick={() => handlePageChange(1)}
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
                                onClick={() => handlePageChange(number)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === number
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
                                    onClick={() => handlePageChange(totalPages)}
                                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}

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
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Trước
                </button>
                <span className="text-sm text-gray-700">
                    Trang {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Sau
                </button>
            </div>
        </div>
    );
});

const DuAnStatistics = () => {
    // State Management - Consolidated state
    const [filters, setFilters] = useState({
        area: ['TẤT CẢ'],
        status: ['TẤT CẢ'],
        year: new Date().getFullYear(),
        months: ['TẤT CẢ'],
        budget: 'TẤT CẢ',
        check: ['TẤT CẢ']
    });
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'Ngày nhận kế hoạch', direction: 'descending' });
    const [showFilters, setShowFilters] = useState(false);
    const [chartType, setChartType] = useState('monthly'); // 'monthly', 'cumulative', 'average'
    const [chiData, setChiData] = useState([]);

    // Pagination state
    const [paginationState, setPaginationState] = useState({
        currentPage: 1,
        itemsPerPage: 10
    });

    // Chart ref
    const chartRef = useRef(null);

    // Constants
    const checkValues = ['TẤT CẢ', 'Đạt', 'Trung bình', 'Xấu', 'Chưa đánh giá'];
    const trangThai = ['TẤT CẢ', '1/ Nhận Kế Hoạch', '2/ Đang thi công', '3/ Xự cố',
        '4/ Chờ cắt chuyển', '5/ Chờ thay đổi phương án', '6/ Thiếu vật tư',
        '7/ Đã thi công xong', '8/ Đã hoàn thành BCHN',
        '9/ Duyệt sản phẩm', '10/ Nhập MBM - Hoàn công', '11/ Hoàn thành hoàn công',
        '12/ Đã nghiệm thu', '13/ Đã xuất hóa đơn',
        '14/ Đã thanh toán', '15/ Hoàn thành'
    ];

    // Update filter function
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => {
            if (key === 'year' || key === 'budget') {
                return {
                    ...prev,
                    [key]: value
                };
            }
            
            const currentValues = prev[key];
            let newValues;
            
            if (currentValues.includes(value)) {
                // Nếu đã chọn "TẤT CẢ" và đang bỏ chọn một giá trị khác
                if (value === 'TẤT CẢ') {
                    newValues = [];
                } else {
                    newValues = currentValues.filter(v => v !== value);
                    // Nếu không còn giá trị nào được chọn, chọn "TẤT CẢ"
                    if (newValues.length === 0) {
                        newValues = ['TẤT CẢ'];
                    }
                }
            } else {
                // Nếu đang chọn "TẤT CẢ" và chọn thêm một giá trị khác
                if (value === 'TẤT CẢ') {
                    newValues = ['TẤT CẢ'];
                } else {
                    newValues = [...currentValues.filter(v => v !== 'TẤT CẢ'), value];
                }
            }
            
            return {
                ...prev,
                [key]: newValues
            };
        });
        
        setPaginationState(prev => ({
            ...prev,
            currentPage: 1
        }));
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((value) => {
            setSearch(value);
            setPaginationState(prev => ({
                ...prev,
                currentPage: 1
            }));
        }, 300),
        []
    );

    // Fetch chi data with abort controller
    const fetchChiData = useCallback(async (signal) => {
        try {
            setLoading(true);
            const response = await authUtils.apiRequest('CHI', 'Find', {
                Properties: {
                    Selector: `Filter(CHI, [TRẠNG THÁI] = "Đã giải ngân")`
                }
            }, { signal });

            // Transform dữ liệu chi
            const transformedChiData = response.map(chi => ({
                ...chi,
                'Ngày giải ngân': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']) : null,
                'SỐ TIỀN': parseFloat(chi['SỐ TIỀN']) || 0,
                'Tháng': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']).getMonth() + 1 : null,
                'Năm': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']).getFullYear() : null
            }));

            setChiData(transformedChiData);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching chi data:', error);
                toast.error('Lỗi khi tải dữ liệu chi tiêu');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch projects with abort controller
    const fetchProjects = useCallback(async (signal) => {
        try {
            setLoading(true);
            const response = await authUtils.apiRequest('DUAN', 'Find', {}, { signal });

            // Transform data to ensure dates are properly formatted and numeric values are numbers
            const transformedData = response.map(project => ({
                ...project,
                'Ngày nhận kế hoạch': project['Ngày nhận kế hoạch'] ? new Date(project['Ngày nhận kế hoạch']) : null,
                'Ngày hoàn tất dự án': project['Ngày hoàn tất dự án'] ? new Date(project['Ngày hoàn tất dự án']) : null,
                'Số tiền HSHC Trước thuế': parseFloat(project['Số tiền HSHC Trước thuế']) || 0,
                'Doanh thu tạm tính': parseFloat(project['Doanh thu tạm tính']) || 0,
                'Nội suy kéo': parseFloat(project['Nội suy kéo']) || 0,
                'Nội suy hàn': parseFloat(project['Nội suy hàn']) || 0,
                'Doanh thu nội suy': (parseFloat(project['Nội suy kéo']) || 0) + (parseFloat(project['Nội suy hàn']) || 0),
                'Tháng': project['Tháng'] || (project['Ngày nhận kế hoạch'] ? new Date(project['Ngày nhận kế hoạch']).getMonth() + 1 : null),
                'Check': project['Check'] || 'Chưa đánh giá'
            }));

            setProjects(transformedData);
            toast.success('Đã tải dữ liệu thành công');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error fetching project list:', error);
                toast.error('Lỗi khi tải danh sách dự án');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        fetchProjects(signal);
        fetchChiData(signal);

        return () => controller.abort();
    }, [fetchProjects, fetchChiData]);

    // Sorting function
    const requestSort = useCallback((key) => {
        setSortConfig(prevConfig => {
            const direction = prevConfig.key === key && prevConfig.direction === 'ascending'
                ? 'descending'
                : 'ascending';
            return { key, direction };
        });
    }, []);

    // Get sorted and filtered items
    const getSortedFilteredItems = useMemo(() => {
        // First sort the items
        const sortableItems = [...projects];
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

        // Then filter them
        return sortableItems.filter(project => {
            const matchesSearch =
                (project['Mã kế hoạch']?.toLowerCase().includes(search.toLowerCase())) ||
                (project['POP']?.toLowerCase().includes(search.toLowerCase()));

            const matchesArea = filters.area.includes('TẤT CẢ') || filters.area.some(area => project['Khu vực'] === area);
            const matchesStatus = filters.status.includes('TẤT CẢ') || filters.status.some(status => project['Trạng thái'] === status);
            const matchesCheck = filters.check.includes('TẤT CẢ') || filters.check.some(check => project['Check'] === check);

            const projectYear = project['Ngày nhận kế hoạch']
                ? new Date(project['Ngày nhận kế hoạch']).getFullYear()
                : null;

            const matchesYear = filters.year === 'TẤT CẢ' || projectYear === filters.year;

            const matchesMonth = filters.months.includes('TẤT CẢ') || (project['Ngày nhận kế hoạch'] &&
                filters.months.some(monthName => {
                    if (monthName === 'TẤT CẢ') return true;
                    if (typeof monthName === 'string') {
                        const monthNum = parseInt(monthName.replace('Tháng ', ''));
                        return new Date(project['Ngày nhận kế hoạch']).getMonth() + 1 === monthNum;
                    }
                    return false;
                }));

            // Filter project by budget range function
            const projectMatchesBudget = (project, range) => {
                if (range === 'TẤT CẢ') return true;

                const budget = project['Số tiền HSHC Trước thuế'] || 0;

                switch (range) {
                    case '< 100 triệu':
                        return budget < 100000000;
                    case '100 - 500 triệu':
                        return budget >= 100000000 && budget < 500000000;
                    case '500 triệu - 1 tỷ':
                        return budget >= 500000000 && budget < 1000000000;
                    case '1 tỷ - 5 tỷ':
                        return budget >= 1000000000 && budget < 5000000000;
                    case '> 5 tỷ':
                        return budget >= 5000000000;
                    default:
                        return true;
                }
            };

            const matchesBudget = projectMatchesBudget(project, filters.budget);

            return matchesSearch && matchesArea && matchesStatus && matchesYear && matchesMonth && matchesBudget && matchesCheck;
        });
    }, [projects, sortConfig, search, filters]);

    // Get unique areas for filtering
    const areas = useMemo(() => {
        return ['TẤT CẢ', ...new Set(projects.map(proj => proj['Khu vực']).filter(Boolean))];
    }, [projects]);

    // Get unique statuses for filtering
    const statuses = useMemo(() => {
        return ['TẤT CẢ', ...new Set(projects.map(proj => proj['Trạng thái']).filter(Boolean))];
    }, [projects]);

    // Get years for filtering
    const years = useMemo(() => {
        const uniqueYears = [...new Set(projects
            .filter(proj => proj['Ngày nhận kế hoạch'])
            .map(proj => new Date(proj['Ngày nhận kế hoạch']).getFullYear())
        )];

        // Sort years in descending order
        uniqueYears.sort((a, b) => b - a);

        // If no years found, use current year
        if (uniqueYears.length === 0) {
            uniqueYears.push(new Date().getFullYear());
        }

        return uniqueYears;
    }, [projects]);

    // Get months for filtering
    const months = useMemo(() => {
        return ['TẤT CẢ', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    }, []);

    // Budget ranges for filtering
    const budgetRanges = useMemo(() => {
        return [
            'TẤT CẢ',
            '< 100 triệu',
            '100 - 500 triệu',
            '500 triệu - 1 tỷ',
            '1 tỷ - 5 tỷ',
            '> 5 tỷ'
        ];
    }, []);

    // Month options for react-select
    const monthOptions = useMemo(() => {
        return months.map(month => ({ value: month, label: month }));
    }, [months]);

    // Pagination calculations
    const { currentPage, itemsPerPage } = paginationState;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = useMemo(() => {
        return getSortedFilteredItems.slice(indexOfFirstItem, indexOfLastItem);
    }, [getSortedFilteredItems, indexOfFirstItem, indexOfLastItem]);

    const totalPages = useMemo(() => {
        return Math.ceil(getSortedFilteredItems.length / itemsPerPage);
    }, [getSortedFilteredItems.length, itemsPerPage]);

    // Handle page change
    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPaginationState(prev => ({
                ...prev,
                currentPage: newPage
            }));
        }
    }, [totalPages]);

    // Format currency
    const formatCurrency = useCallback((value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value);
    }, []);

    // Format date
    const formatDate = useCallback((date) => {
        if (!date) return '';

        try {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        } catch (error) {
            return '';
        }
    }, []);

    // Get sort direction icon
    const getSortIcon = useCallback((key) => {
        if (sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? '↑' : '↓';
    }, [sortConfig]);

    // Calculate monthly expenses
    const calculateMonthlyExpenses = useMemo(() => {
        const monthlyExpenses = Array(12).fill(0);

        // Lọc chi theo năm và tháng được chọn
        chiData.forEach(chi => {
            if (!chi['Ngày giải ngân']) return;

            const chiDate = new Date(chi['Ngày giải ngân']);
            const chiYear = chiDate.getFullYear();
            const chiMonth = chiDate.getMonth() + 1;

            // Kiểm tra năm
            // Kiểm tra năm
            if (chiYear !== filters.year) return;

            // Kiểm tra tháng (nếu có lọc tháng cụ thể)
            if (!filters.months.includes('TẤT CẢ') &&
                !filters.months.includes(`Tháng ${chiMonth}`)) {
                return;
            }

            const month = chiMonth - 1; // Chuyển từ 1-12 sang 0-11 để khớp với array index
            monthlyExpenses[month] += chi['SỐ TIỀN'];
        });

        return monthlyExpenses;
    }, [chiData, filters.year, filters.months]);

    // Calculate area statistics
    const calculateAreaStatistics = useMemo(() => {
        const areaStats = {};

        areas.filter(area => area !== 'TẤT CẢ').forEach(area => {
            // Lọc dự án theo khu vực và tháng được chọn
            const areaProjects = getSortedFilteredItems.filter(project => {
                if (project['Khu vực'] !== area) return false;

                // Nếu không có ngày nhận kế hoạch, vẫn giữ lại dự án
                if (!project['Ngày nhận kế hoạch']) return true;

                // Lọc theo tháng nếu có chọn tháng cụ thể
                if (!filters.months.includes('TẤT CẢ')) {
                    const projectMonth = new Date(project['Ngày nhận kế hoạch']).getMonth() + 1;
                    const monthMatches = filters.months.some(monthStr => {
                        const monthNum = parseInt(monthStr.replace('Tháng ', ''));
                        return projectMonth === monthNum;
                    });
                    return monthMatches;
                }

                return true;
            });

            areaStats[area] = {
                projectCount: areaProjects.length,
                estimatedRevenue: areaProjects.reduce((sum, project) => sum + (project['Doanh thu tạm tính'] || 0), 0),
                actualRevenue: areaProjects.reduce((sum, project) => sum + (project['Số tiền HSHC Trước thuế'] || 0), 0),
                derivedRevenue: areaProjects.reduce((sum, project) => sum + (project['Doanh thu nội suy'] || 0), 0),
            };
        });

        return areaStats;
    }, [areas, getSortedFilteredItems, filters.months]);

    // Calculate status statistics
    const calculateStatusStatistics = useMemo(() => {
        const statusStats = {};

        statuses.filter(status => status !== 'TẤT CẢ').forEach(status => {
            const statusProjects = getSortedFilteredItems.filter(project => project['Trạng thái'] === status);

            statusStats[status] = {
                projectCount: statusProjects.length,
                estimatedRevenue: statusProjects.reduce((sum, project) => sum + (project['Doanh thu tạm tính'] || 0), 0),
                actualRevenue: statusProjects.reduce((sum, project) => sum + (project['Số tiền HSHC Trước thuế'] || 0), 0),
                derivedRevenue: statusProjects.reduce((sum, project) => sum + (project['Doanh thu nội suy'] || 0), 0),
            };
        });

        return statusStats;
    }, [statuses, getSortedFilteredItems]);

    // Calculate monthly statistics
    const calculateMonthlyStatistics = useMemo(() => {
        const monthlyStats = {};

        for (let month = 1; month <= 12; month++) {
            const monthName = `Tháng ${month}`;
            // Chỉ tính cho các tháng được chọn hoặc tất cả tháng nếu chọn "TẤT CẢ"
            if (filters.months.includes('TẤT CẢ') || filters.months.includes(monthName)) {
                const monthProjects = getSortedFilteredItems.filter(project => {
                    if (!project['Ngày nhận kế hoạch']) return false;
                    const projectDate = new Date(project['Ngày nhận kế hoạch']);
                    return projectDate.getMonth() + 1 === month && projectDate.getFullYear() === filters.year;
                });

                monthlyStats[monthName] = {
                    projectCount: monthProjects.length,
                    estimatedRevenue: monthProjects.reduce((sum, project) => sum + (project['Doanh thu tạm tính'] || 0), 0),
                    actualRevenue: monthProjects.reduce((sum, project) => sum + (project['Số tiền HSHC Trước thuế'] || 0), 0),
                    derivedRevenue: monthProjects.reduce((sum, project) => sum + (project['Doanh thu nội suy'] || 0), 0),
                };
            }
        }

        return monthlyStats;
    }, [getSortedFilteredItems, filters.months, filters.year]);

    // Prepare monthly data for charts
    const prepareMonthlyData = useMemo(() => {
        // Initialize array with all months
        const data = [];
        for (let month = 1; month <= 12; month++) {
            data.push({
                month: month,
                monthName: `Tháng ${month}`,
                projectCount: 0,
                totalRevenue: 0,
                completedCount: 0,
                inProgressCount: 0,
                avgCompletionTime: 0,
                totalHSHC: 0,
                avgRevenuePerProject: 0
            });
        }

        // Filter projects by selected year
        const yearProjects = getSortedFilteredItems.filter(project => {
            if (!project['Ngày nhận kế hoạch']) return false;

            const projectDate = new Date(project['Ngày nhận kế hoạch']);
            const projectMonth = projectDate.getMonth() + 1;

            return projectDate.getFullYear() === filters.year &&
                (filters.months.includes('TẤT CẢ') ||
                    filters.months.some(month => parseInt(month.replace('Tháng ', '')) === projectMonth));
        });

        // Process projects for each month
        yearProjects.forEach(project => {
            if (!project['Ngày nhận kế hoạch']) return;

            const projectDate = new Date(project['Ngày nhận kế hoạch']);
            const month = projectDate.getMonth() + 1; // JavaScript months are 0-based

            const monthIndex = data.findIndex(item => item.month === month);
            if (monthIndex !== -1) {
                const monthData = data[monthIndex];

                // Increment project count
                monthData.projectCount += 1;

                // Add revenue
                monthData.totalRevenue += parseFloat(project['Số tiền HSHC Trước thuế']) || 0;

                // Count by status
                if (project['Trạng thái'] === 'Hoàn thành') {
                    monthData.completedCount += 1;

                    // Calculate completion time if we have both dates
                    if (project['Ngày hoàn tất dự án']) {
                        const startDate = new Date(project['Ngày nhận kế hoạch']);
                        const endDate = new Date(project['Ngày hoàn tất dự án']);
                        const daysToComplete = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

                        if (daysToComplete >= 0) {  // Ensure valid calculation
                            monthData.avgCompletionTime =
                                (monthData.avgCompletionTime * (monthData.completedCount - 1) + daysToComplete) /
                                monthData.completedCount;
                        }
                    }
                } else if (project['Trạng thái'] === 'Đang thực hiện') {
                    monthData.inProgressCount += 1;
                }

                // Update HSHC documents count (assuming 1 per project)
                monthData.totalHSHC += 1;

                // Calculate average revenue
                monthData.avgRevenuePerProject = monthData.totalRevenue / monthData.projectCount;
            }
        });

        return data;
    }, [getSortedFilteredItems, filters.year, filters.months]);

    // Prepare cumulative data
    const prepareCumulativeData = useMemo(() => {
        const monthlyData = prepareMonthlyData;
        const cumulativeData = [];

        let runningCount = 0;
        let runningRevenue = 0;
        let runningHSHC = 0;

        for (const month of monthlyData) {
            runningCount += month.projectCount;
            runningRevenue += month.totalRevenue;
            runningHSHC += month.totalHSHC;

            cumulativeData.push({
                ...month,
                projectCount: runningCount,
                totalRevenue: runningRevenue,
                totalHSHC: runningHSHC
            });
        }

        return cumulativeData;
    }, [prepareMonthlyData]);

    // Prepare monthly averages
    const prepareMonthlyAverages = useMemo(() => {
        // Get all years except current
        const otherYears = years.filter(year => year !== filters.year);

        // Initialize data structure
        const monthlyAverages = [];
        for (let month = 1; month <= 12; month++) {
            monthlyAverages.push({
                month: month,
                monthName: `Tháng ${month}`,
                avgProjectCount: 0,
                avgRevenue: 0,
                currentYearCount: 0,
                currentYearRevenue: 0
            });
        }

        // Calculate current year data first
        const currentYearData = prepareMonthlyData;

        for (let i = 0; i < 12; i++) {
            monthlyAverages[i].currentYearCount = currentYearData[i].projectCount;
            monthlyAverages[i].currentYearRevenue = currentYearData[i].totalRevenue;
        }

        // Calculate averages for other years
        for (const year of otherYears) {
            // Filter projects by year
            const yearProjects = projects.filter(project => {
                if (!project['Ngày nhận kế hoạch']) return false;
                const projectDate = new Date(project['Ngày nhận kế hoạch']);
                return projectDate.getFullYear() === year;
            });

            // Process monthly data
            const yearMonthlyData = Array(12).fill().map(() => ({ count: 0, revenue: 0 }));

            for (const project of yearProjects) {
                if (!project['Ngày nhận kế hoạch']) continue;

                const month = new Date(project['Ngày nhận kế hoạch']).getMonth();
                yearMonthlyData[month].count += 1;
                yearMonthlyData[month].revenue += parseFloat(project['Số tiền HSHC Trước thuế']) || 0;
            }

            // Add to averages
            for (let i = 0; i < 12; i++) {
                monthlyAverages[i].avgProjectCount += yearMonthlyData[i].count;
                monthlyAverages[i].avgRevenue += yearMonthlyData[i].revenue;
            }
        }

        // Calculate the actual averages if we have other years
        if (otherYears.length > 0) {
            for (let i = 0; i < 12; i++) {
                monthlyAverages[i].avgProjectCount /= otherYears.length;
                monthlyAverages[i].avgRevenue /= otherYears.length;
            }
        }

        return monthlyAverages;
    }, [projects, years, filters.year, prepareMonthlyData]);

    // Calculate monthly chi statistics
    const calculateMonthlyChiStatistics = useMemo(() => {
        const monthlyStats = {};

        for (let month = 1; month <= 12; month++) {
            const monthName = `Tháng ${month}`;
            // Chỉ tính cho các tháng được chọn hoặc tất cả tháng nếu chọn "TẤT CẢ"
            if (filters.months.includes('TẤT CẢ') || filters.months.includes(monthName)) {
                const monthChiData = chiData.filter(chi => {
                    if (!chi['Ngày giải ngân']) return false;
                    const chiDate = new Date(chi['Ngày giải ngân']);
                    return chiDate.getMonth() + 1 === month && chiDate.getFullYear() === filters.year;
                });

                monthlyStats[monthName] = {
                    chiCount: monthChiData.length,
                    totalAmount: monthChiData.reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0)
                };
            }
        }

        return monthlyStats;
    }, [chiData, filters.year, filters.months]);

    // Calculate total expenses
    const calculateTotalExpenses = useMemo(() => {
        return chiData
            .filter(chi => {
                if (!chi['Ngày giải ngân']) return false;

                const chiDate = new Date(chi['Ngày giải ngân']);
                const chiYear = chiDate.getFullYear();
                const chiMonth = chiDate.getMonth() + 1;

                // Lọc theo năm
                if (chiYear !== filters.year) return false;

                // Lọc theo tháng nếu không phải "TẤT CẢ"
                if (!filters.months.includes('TẤT CẢ')) {
                    return filters.months.some(monthName => {
                        if (monthName === 'TẤT CẢ') return true;
                        const monthNumber = parseInt(monthName.replace('Tháng ', ''));
                        return chiMonth === monthNumber;
                    });
                }

                return true;
            })
            .reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0);
    }, [chiData, filters.year, filters.months]);

    // Get chart configuration
    const getChartConfig = useMemo(() => {
        const labels = months.slice(1).map(month => month);
        const monthlyExpenses = calculateMonthlyExpenses;

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
                            if (context.dataset.label.includes('Doanh thu') || context.dataset.label.includes('Chi tiêu')) {
                                label += formatCurrency(context.parsed.y);
                            } else {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                },
                datalabels: {
                    align: 'center',
                    anchor: 'end',
                    formatter: function (value, context) {
                        if (context.dataset.label.includes('Doanh thu') || context.dataset.label.includes('Chi tiêu')) {
                            // Hiển thị doanh thu theo đơn vị triệu hoặc tỷ để gọn hơn
                            if (value >= 1000000000) {
                                return (value / 1000000000).toFixed(1) + ' tỷ';
                            } else if (value >= 1000000) {
                                return (value / 1000000).toFixed(0) + 'tr';
                            } else {
                                return value;
                            }
                        } else {
                            return value;
                        }
                    },
                    color: function (context) {
                        return context.dataset.backgroundColor;
                    },
                    font: {
                        weight: 'bold',
                        size: 12,
                    },
                    offset: 0,
                    padding: 0
                }
            },
        };

        switch (chartType) {
            case 'monthly': {
                const monthlyData = prepareMonthlyData;
                return {
                    type: 'bar',
                    data: {
                        labels: monthlyData.map(item => item.monthName),
                        datasets: [
                            {
                                type: 'bar',
                                label: 'Tổng dự án',
                                data: monthlyData.map(item => item.projectCount),
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
                                label: 'Doanh thu HSHC',
                                data: monthlyData.map(item => item.totalRevenue),
                                backgroundColor: '#EC4899',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#EC4899',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'bar',
                                label: 'Doanh thu tạm tính',
                                data: monthlyData.map(item => {
                                    const monthProjects = getSortedFilteredItems.filter(project => {
                                        if (!project['Ngày nhận kế hoạch']) return false;
                                        const projectDate = new Date(project['Ngày nhận kế hoạch']);
                                        const projectMonth = projectDate.getMonth() + 1;
                                        return projectMonth === item.month &&
                                            projectDate.getFullYear() === filters.year &&
                                            (filters.months.includes('TẤT CẢ') ||
                                                filters.months.includes(`Tháng ${projectMonth}`));
                                    });
                                    return monthProjects.reduce((sum, project) =>
                                        sum + (project['Doanh thu tạm tính'] || 0), 0);
                                }),
                                backgroundColor: '#10B981',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#10B981',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'bar',
                                label: 'Doanh thu nội suy',
                                data: monthlyData.map(item => {
                                    const monthProjects = getSortedFilteredItems.filter(project => {
                                        if (!project['Ngày nhận kế hoạch']) return false;
                                        const projectDate = new Date(project['Ngày nhận kế hoạch']);
                                        const projectMonth = projectDate.getMonth() + 1;
                                        return projectMonth === item.month &&
                                            projectDate.getFullYear() === filters.year &&
                                            (filters.months.includes('TẤT CẢ') ||
                                                filters.months.includes(`Tháng ${projectMonth}`));
                                    });
                                    return monthProjects.reduce((sum, project) =>
                                        sum + (project['Doanh thu nội suy'] || 0), 0);
                                }),
                                backgroundColor: '#8B5CF6',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#8B5CF6',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'line',
                                label: 'Chi tiêu',
                                data: monthlyExpenses,
                                borderColor: '#F59E0B',
                                backgroundColor: '#F59E0B',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.4,
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
                                    text: 'Số lượng'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Doanh thu/Chi tiêu (VNĐ)'
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
                                text: `Thống kê dự án theo tháng (Năm ${filters.year})`,
                                font: {
                                    size: 16
                                }
                            }
                        }
                    }
                };
            }

            case 'cumulative': {
                const cumulativeData = prepareCumulativeData;

                // Calculate cumulative values for estimated and derived revenue
                const cumulativeEstimatedRevenue = [];
                const cumulativeDerivedRevenue = [];
                const cumulativeExpenses = [];

                let runningEstimated = 0;
                let runningDerived = 0;
                let runningExpenses = 0;

                for (let month = 1; month <= 12; month++) {
                    // Filter projects for this month and earlier in the selected year
                    const monthProjects = getSortedFilteredItems.filter(project => {
                        if (!project['Ngày nhận kế hoạch']) return false;
                        const projectDate = new Date(project['Ngày nhận kế hoạch']);
                        return projectDate.getMonth() + 1 <= month &&
                            projectDate.getFullYear() === filters.year;
                    });

                    // Calculate cumulative revenues
                    runningEstimated = monthProjects.reduce((sum, project) =>
                        sum + (project['Doanh thu tạm tính'] || 0), 0);

                    runningDerived = monthProjects.reduce((sum, project) =>
                        sum + (project['Doanh thu nội suy'] || 0), 0);

                    // Calculate cumulative expenses
                    const monthExpenses = chiData.filter(chi => {
                        if (!chi['Ngày giải ngân']) return false;
                        const chiDate = new Date(chi['Ngày giải ngân']);
                        return chiDate.getMonth() + 1 <= month &&
                            chiDate.getFullYear() === filters.year;
                    });

                    runningExpenses = monthExpenses.reduce((sum, chi) =>
                        sum + (chi['SỐ TIỀN'] || 0), 0);

                    cumulativeEstimatedRevenue.push(runningEstimated);
                    cumulativeDerivedRevenue.push(runningDerived);
                    cumulativeExpenses.push(runningExpenses);
                }

                return {
                    type: 'bar',
                    data: {
                        labels: cumulativeData.map(item => item.monthName),
                        datasets: [
                            {
                                type: 'bar',
                                label: 'Dự án tích lũy',
                                data: cumulativeData.map(item => item.projectCount),
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
                                label: 'Doanh thu HSHC tích lũy',
                                data: cumulativeData.map(item => item.totalRevenue),
                                backgroundColor: '#EC4899',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#EC4899',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'bar',
                                label: 'Doanh thu tạm tính tích lũy',
                                data: cumulativeEstimatedRevenue,
                                backgroundColor: '#10B981',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#10B981',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'bar',
                                label: 'Doanh thu nội suy tích lũy',
                                data: cumulativeDerivedRevenue,
                                backgroundColor: '#8B5CF6',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#8B5CF6',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'line',
                                label: 'Chi tiêu tích lũy',
                                data: cumulativeExpenses,
                                borderColor: '#F59E0B',
                                backgroundColor: '#F59E0B',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.4,
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
                                    text: 'Số lượng'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Doanh thu/Chi tiêu (VNĐ)'
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
                                text: `Số liệu tích lũy theo thời gian (Năm ${filters.year})`,
                                font: {
                                    size: 16
                                }
                            }
                        }
                    }
                };
            }

            case 'average': {
                const averageData = prepareMonthlyAverages;
                const monthlyExpenses = calculateMonthlyExpenses;

                // Calculate monthly data for estimated and derived revenue
                const currentYearEstimatedRevenue = [];
                const currentYearDerivedRevenue = [];

                for (let month = 1; month <= 12; month++) {
                    // Filter projects for this month in the selected year
                    const monthProjects = getSortedFilteredItems.filter(project => {
                        if (!project['Ngày nhận kế hoạch']) return false;
                        const projectDate = new Date(project['Ngày nhận kế hoạch']);
                        return projectDate.getMonth() + 1 === month &&
                            projectDate.getFullYear() === filters.year;
                    });

                    // Calculate revenues
                    const estimatedRevenue = monthProjects.reduce((sum, project) =>
                        sum + (project['Doanh thu tạm tính'] || 0), 0);

                    const derivedRevenue = monthProjects.reduce((sum, project) =>
                        sum + (project['Doanh thu nội suy'] || 0), 0);

                    currentYearEstimatedRevenue.push(estimatedRevenue);
                    currentYearDerivedRevenue.push(derivedRevenue);
                }

                return {
                    type: 'bar',
                    data: {
                        labels: averageData.map(item => item.monthName),
                        datasets: [
                            {
                                type: 'bar',
                                label: `Số dự án ${filters.year}`,
                                data: averageData.map(item => item.currentYearCount),
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
                                label: `Doanh thu HSHC ${filters.year}`,
                                data: averageData.map(item => item.currentYearRevenue),
                                backgroundColor: '#EC4899',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#EC4899',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'bar',
                                label: `Doanh thu tạm tính ${filters.year}`,
                                data: currentYearEstimatedRevenue,
                                backgroundColor: '#10B981',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#10B981',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'bar',
                                label: `Doanh thu nội suy ${filters.year}`,
                                data: currentYearDerivedRevenue,
                                backgroundColor: '#8B5CF6',
                                yAxisID: 'y1',
                                datalabels: {
                                    color: '#8B5CF6',
                                    anchor: 'end',
                                    align: 'top'
                                }
                            },
                            {
                                type: 'line',
                                label: `Chi tiêu ${filters.year}`,
                                data: monthlyExpenses,
                                borderColor: '#F59E0B',
                                backgroundColor: '#F59E0B',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.4,
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
                                    text: 'Số dự án'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Doanh thu/Chi tiêu (VNĐ)'
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
                                text: `So sánh với trung bình các năm (${filters.year})`,
                                font: {
                                    size: 16
                                }
                            }
                        }
                    }
                };
            }

            default:
                return null;
        }
    }, [chartType, months, calculateMonthlyExpenses, prepareMonthlyData, getSortedFilteredItems, filters.year, filters.months, chiData, formatCurrency, prepareCumulativeData, prepareMonthlyAverages]);

    // Calculate summary statistics
    const statistics = useMemo(() => {
        const filteredProjects = getSortedFilteredItems;

        const totalProjects = filteredProjects.length;
        const totalRevenue = filteredProjects.reduce((sum, project) =>
            sum + (parseFloat(project['Số tiền HSHC Trước thuế']) || 0), 0);
        const totalEstimatedRevenue = filteredProjects.reduce((sum, project) =>
            sum + (parseFloat(project['Doanh thu tạm tính']) || 0), 0);

        const completedProjects = filteredProjects.filter(
            project => project['Trạng thái'] === 'Hoàn thành'
        ).length;

        const inProgressProjects = filteredProjects.filter(
            project => project['Trạng thái'] === 'Đang thực hiện'
        ).length;

        // Calculate average completion time (in days)
        let totalCompletionDays = 0;
        let projectsWithCompletionData = 0;

        filteredProjects.forEach(project => {
            if (project['Ngày nhận kế hoạch'] && project['Ngày hoàn tất dự án'] && project['Trạng thái'] === 'Hoàn thành') {
                const startDate = new Date(project['Ngày nhận kế hoạch']);
                const endDate = new Date(project['Ngày hoàn tất dự án']);
                const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

                if (days >= 0) {  // Ensure valid calculation
                    totalCompletionDays += days;
                    projectsWithCompletionData++;
                }
            }
        });

        // Thêm thống kê mới
        const totalDerivedRevenue = filteredProjects.reduce((sum, project) =>
            sum + (parseFloat(project['Nội suy kéo'] + project['Nội suy hàn']) || 0), 0);

        const projectsByCheckStatus = {
            'Đạt': filteredProjects.filter(project => project['Check'] === 'Đạt').length,
            'Trung bình': filteredProjects.filter(project => project['Check'] === 'Trung bình').length,
            'Xấu': filteredProjects.filter(project => project['Check'] === 'Xấu').length,
            'Chưa đánh giá': filteredProjects.filter(project => !project['Check'] || project['Check'] === 'Chưa đánh giá').length
        };

        const avgCompletionTime = projectsWithCompletionData > 0
            ? totalCompletionDays / projectsWithCompletionData
            : 0;

        // Calculate average monthly projects
        const monthlyData = prepareMonthlyData;
        const totalMonthlyProjects = monthlyData.reduce((sum, month) => sum + month.projectCount, 0);
        const avgMonthlyProjects = totalMonthlyProjects / 12;

        return {
            totalProjects,
            totalRevenue,
            totalEstimatedRevenue,
            completedProjects,
            inProgressProjects,
            avgRevenuePerProject: totalProjects > 0 ? totalRevenue / totalProjects : 0,
            avgCompletionTime,
            avgMonthlyProjects,
            totalDerivedRevenue,
            projectsByCheckStatus
        };
    }, [getSortedFilteredItems, prepareMonthlyData]);

    // Handle refresh data
    const handleRefreshData = useCallback(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        fetchProjects(signal);
        fetchChiData(signal);
        toast.info('Đang làm mới dữ liệu...');

        return () => controller.abort();
    }, [fetchProjects, fetchChiData]);

    // Export to Excel
    const exportToExcel = useCallback(() => {
        try {
            // Prepare data for export
            const exportData = getSortedFilteredItems.map(project => ({
                'Mã kế hoạch': project['Mã kế hoạch'] || '',
                'POP': project['POP'] || '',
                'Khu vực': project['Khu vực'] || '',
                'Ngày nhận kế hoạch': formatDate(project['Ngày nhận kế hoạch']),
                'Ngày hoàn tất': formatDate(project['Ngày hoàn tất dự án']),
                'Số tiền HSHC': project['Số tiền HSHC Trước thuế'] || 0,
                'Doanh thu tạm tính': project['Doanh thu tạm tính'] || 0,
                'Trạng thái': project['Trạng thái'] || '',
                'Đánh giá': project['Check'] || 'Chưa đánh giá',
                'Nội suy kéo': project['Nội suy kéo'] || 0,
                'Nội suy hàn': project['Nội suy hàn'] || 0,
                'Doanh thu nội suy': project['Nội suy hàn'] + project['Nội suy kéo'] || 0,
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Thống kê dự án');

            // Generate statistics worksheet
            const statsData = [
                { Thống_kê: 'Tổng số dự án', Giá_trị: statistics.totalProjects },
                { Thống_kê: 'Số dự án hoàn thành', Giá_trị: statistics.completedProjects },
                { Thống_kê: 'Số dự án đang thực hiện', Giá_trị: statistics.inProgressProjects },
                { Thống_kê: 'Tổng doanh thu HSHC', Giá_trị: statistics.totalRevenue },
                { Thống_kê: 'Doanh thu tạm tính', Giá_trị: statistics.totalEstimatedRevenue },
                { Thống_kê: 'Doanh thu trung bình/dự án', Giá_trị: statistics.avgRevenuePerProject },
                { Thống_kê: 'Thời gian hoàn thành trung bình (ngày)', Giá_trị: statistics.avgCompletionTime },
                { Thống_kê: 'Trung bình số dự án/tháng', Giá_trị: statistics.avgMonthlyProjects }
            ];

            const statsWs = XLSX.utils.json_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, statsWs, 'Tổng quan');

            // Save file
            const fileName = `Thong_ke_du_an_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success('Đã xuất dữ liệu thành công');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Lỗi khi xuất dữ liệu');
        }
    }, [getSortedFilteredItems, statistics, formatDate]);

    // Define table columns for statistics tables
    const areaColumns = useMemo(() => [
        { header: 'Khu vực', accessor: 'area' },
        { header: 'Số công trình', accessor: 'projectCount' },
        { header: 'Doanh thu tạm tính', accessor: 'estimatedRevenue', format: formatCurrency },
        { header: 'Số tiền HSHC trước thuế', accessor: 'actualRevenue', format: formatCurrency },
        { header: 'Doanh thu nội suy', accessor: 'derivedRevenue', format: formatCurrency }
    ], [formatCurrency]);

    const statusColumns = useMemo(() => [
        { header: 'Trạng thái', accessor: 'status' },
        { header: 'Số công trình', accessor: 'projectCount' },
        { header: 'Doanh thu tạm tính', accessor: 'estimatedRevenue', format: formatCurrency },
        { header: 'Số tiền HSHC trước thuế', accessor: 'actualRevenue', format: formatCurrency },
        { header: 'Doanh thu nội suy', accessor: 'derivedRevenue', format: formatCurrency }
    ], [formatCurrency]);

    const chiColumns = useMemo(() => [
        { header: 'Tháng', accessor: 'month' },
        { header: 'Số phiếu chi', accessor: 'chiCount' },
        { header: 'Tổng chi tiêu', accessor: 'totalAmount', format: formatCurrency }
    ], [formatCurrency]);

    // Define areas total row
    const areasTotalRow = useMemo(() => ({
        projectCount: statistics.totalProjects,
        estimatedRevenue: statistics.totalEstimatedRevenue,
        actualRevenue: statistics.totalRevenue,
        derivedRevenue: statistics.totalDerivedRevenue
    }), [statistics]);

    // Define chi total row
    const chiTotalRow = useMemo(() => ({
        chiCount: chiData.filter(chi => chi['Năm'] === filters.year).length,
        totalAmount: calculateTotalExpenses
    }), [chiData, filters.year, calculateTotalExpenses]);

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen print:bg-white print:p-0">
            <div className="mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 print:shadow-none print:border-none">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
                        <h1 className="text-2xl font-bold text-gray-800">Thống Kê Dự Án</h1>
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
                        <h1 className="text-3xl font-bold text-center">Báo Cáo Thống Kê Dự Án</h1>
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
                                onChange={(e) => debouncedSearch(e.target.value)}
                                defaultValue={search}
                            />
                        </div>

                        {showFilters && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {/* Area filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Khu vực:</h3>
                                        <div className="max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg p-2">
                                            {areas.map((area, index) => (
                                                <label key={index} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.area.includes(area)}
                                                        onChange={() => updateFilter('area', area)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{area}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Status filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Trạng thái:</h3>
                                        <div className="max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg p-2">
                                            {statuses.map((status, index) => (
                                                <label key={index} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.status.includes(status)}
                                                        onChange={() => updateFilter('status', status)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{status}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Year filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Năm:</h3>
                                        <div className="relative">
                                            <select
                                                value={filters.year}
                                                onChange={(e) => updateFilter('year', parseInt(e.target.value))}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {years.map((year, index) => (
                                                    <option key={index} value={year}>{year}</option>
                                                ))}
                                            </select>
                                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Month filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Tháng:</h3>
                                        <div className="max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg p-2">
                                            {months.map((month, index) => (
                                                <label key={index} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.months.includes(month)}
                                                        onChange={() => updateFilter('months', month)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{month}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Check filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Đánh giá:</h3>
                                        <div className="max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg p-2">
                                            {checkValues.map((check, index) => (
                                                <label key={index} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.check.includes(check)}
                                                        onChange={() => updateFilter('check', check)}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{check}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Budget filter - hidden */}
                                    <div hidden>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Ngân sách:</h3>
                                        <div className="relative">
                                            <select
                                                value={filters.budget}
                                                onChange={(e) => updateFilter('budget', e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {budgetRanges.map((range, index) => (
                                                    <option key={index} value={range}>{range}</option>
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
                                                value={paginationState.itemsPerPage}
                                                onChange={(e) => setPaginationState(prev => ({
                                                    ...prev,
                                                    itemsPerPage: parseInt(e.target.value),
                                                    currentPage: 1
                                                }))}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {[10, 25, 50, 100].map((size) => (
                                                    <option key={size} value={size}>{size} dự án</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hiển thị các bộ lọc đang áp dụng */}
                        {showFilters && (
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                                <div className="flex flex-wrap gap-2">
                                    {filters.area.length > 0 && filters.area[0] !== 'TẤT CẢ' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Khu vực: {filters.area.join(', ')}
                                        </span>
                                    )}
                                    {filters.status.length > 0 && filters.status[0] !== 'TẤT CẢ' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Trạng thái: {filters.status.join(', ')}
                                        </span>
                                    )}
                                    {filters.months.length > 0 && filters.months[0] !== 'TẤT CẢ' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                            Tháng: {filters.months.join(', ')}
                                        </span>
                                    )}
                                    {filters.check.length > 0 && filters.check[0] !== 'TẤT CẢ' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Đánh giá: {filters.check.join(', ')}
                                        </span>
                                    )}
                                    {filters.year !== new Date().getFullYear() && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Năm: {filters.year}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        setFilters({
                                            area: ['TẤT CẢ'],
                                            status: ['TẤT CẢ'],
                                            year: new Date().getFullYear(),
                                            months: ['TẤT CẢ'],
                                            budget: 'TẤT CẢ',
                                            check: ['TẤT CẢ']
                                        });
                                    }}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Tổng số dự án</h3>
                            <p className="text-2xl font-bold text-blue-800">{statistics.totalProjects}</p>
                            <p className="text-xs text-blue-600 mt-1">Trung bình {statistics.avgMonthlyProjects.toFixed(1)} dự án/tháng</p>
                        </div>
                        <div className="bg-[#ffe4f1a8] border border-[#f0c8dc] rounded-lg p-4">
                            <h3 className="text-sm text-[#ec4899] mb-1">Tổng doanh thu HSHC</h3>
                            <p className="text-xl font-bold text-[#ec4899]">{formatCurrency(statistics.totalRevenue)}</p>
                            <p className="text-xs text-[#ec4899] mt-1">
                                TB: {formatCurrency(statistics.avgRevenuePerProject)}/dự án
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                                Chênh lệch vs nội suy: {formatCurrency(statistics.totalRevenue - statistics.totalDerivedRevenue)}
                                ({(statistics.totalRevenue > 0
                                    ? ((statistics.totalRevenue - statistics.totalDerivedRevenue) / statistics.totalRevenue * 100).toFixed(1)
                                    : 0)}%)
                            </p>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Tổng doanh thu tạm tính</h3>
                            <p className="text-xl font-bold text-green-800">{formatCurrency(statistics.totalEstimatedRevenue)}</p>
                            <p className="text-xs text-green-600 mt-1">
                                TB: {formatCurrency(statistics.totalEstimatedRevenue / (statistics.totalProjects || 1))}/dự án
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                                Chênh lệch vs HSHC: {formatCurrency(statistics.totalRevenue - statistics.totalEstimatedRevenue)}
                                ({(statistics.totalRevenue > 0
                                    ? ((statistics.totalRevenue - statistics.totalEstimatedRevenue) / statistics.totalRevenue * 100).toFixed(1)
                                    : 0)}%)
                            </p>
                        </div>

                        <div className="bg-[#dbcefa] border border-[#dbccfc] rounded-lg p-4">
                            <h3 className="text-sm text-[#7b49f1] mb-1">Tổng doanh thu nội suy</h3>
                            <p className="text-xl font-bold text-[#804ff1]">{formatCurrency(statistics.totalDerivedRevenue)}</p>
                            <p className="text-xs text-[#8b5cf6] mt-1">
                                TB: {formatCurrency(statistics.totalDerivedRevenue / (statistics.totalProjects || 1))}/dự án
                            </p>
                            <p className="text-xs text-[#8b5cf6] mt-1">
                                Chênh lệch vs HSHC: {formatCurrency(statistics.totalRevenue - statistics.totalDerivedRevenue)}
                                ({(statistics.totalRevenue > 0
                                    ? ((statistics.totalRevenue - statistics.totalDerivedRevenue) / statistics.totalRevenue * 100).toFixed(1)
                                    : 0)}%)
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                            <h3 className="text-sm text-amber-700 mb-1">Tổng chi tiêu</h3>
                            <p className="text-xl font-bold text-amber-800">{formatCurrency(calculateTotalExpenses)}</p>
                            <p className="text-xs text-amber-600 mt-1">
                                {chiData.filter(chi => chi['Năm'] === filters.year).length} phiếu chi
                            </p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Thống kê dự án theo thời gian</h2>
                            <div className="flex space-x-2 print:hidden">
                                <button
                                    onClick={() => setChartType('monthly')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${chartType === 'monthly'
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                        } border`}
                                >
                                    Theo tháng
                                </button>
                                <button
                                    onClick={() => setChartType('cumulative')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${chartType === 'cumulative'
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                        } border`}
                                >
                                    Tích lũy
                                </button>
                                <button
                                    onClick={() => setChartType('average')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${chartType === 'average'
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-gray-100 text-gray-700 border-gray-200'
                                        } border`}
                                >
                                    So sánh TB
                                </button>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div style={{ height: '500px', width: '100%' }}>
                                {getChartConfig && (
                                    <Suspense fallback={<div className="flex items-center justify-center h-full">Đang tải biểu đồ...</div>}>
                                        <ProjectChart
                                            chartType={chartType}
                                            chartConfig={getChartConfig}
                                            chartRef={chartRef}
                                        />
                                    </Suspense>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bảng thống kê theo khu vực */}
                    <StatisticsTable
                        title="Thống kê theo khu vực"
                        data={calculateAreaStatistics}
                        columns={areaColumns}
                        totalRow={areasTotalRow}
                        formatCurrency={formatCurrency}
                    />

                    {/* Bảng thống kê theo trạng thái */}
                    <StatisticsTable
                        title="Thống kê theo trạng thái"
                        data={calculateStatusStatistics}
                        columns={statusColumns}
                        totalRow={areasTotalRow}
                        formatCurrency={formatCurrency}
                    />

                    {/* Table Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Danh sách dự án</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Mã kế hoạch')}>
                                            Mã KH {getSortIcon('Mã kế hoạch')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('POP')}>
                                            POP {getSortIcon('POP')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Khu vực')}>
                                            Khu vực {getSortIcon('Khu vực')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Ngày nhận kế hoạch')}>
                                            Ngày nhận KH {getSortIcon('Ngày nhận kế hoạch')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Số tiền HSHC Trước thuế')}>
                                            Số tiền HSHC {getSortIcon('Số tiền HSHC Trước thuế')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Doanh thu tạm tính')}>
                                            Doanh thu tạm tính {getSortIcon('Doanh thu tạm tính')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Trạng thái')}>
                                            Trạng thái {getSortIcon('Trạng thái')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Check')}>
                                            Đánh giá {getSortIcon('Check')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Nội suy kéo')}>
                                            Nội suy kéo {getSortIcon('Nội suy kéo')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Nội suy hàn')}>
                                            Nội suy hàn {getSortIcon('Nội suy hàn')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('Doanh thu nội suy')}>
                                            DT nội suy {getSortIcon('Doanh thu nội suy')}
                                        </th>
                                        <th scope="col"
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                            onClick={() => requestSort('ChenhLech')}>
                                            Chênh lệch HSHC-NS {getSortIcon('ChenhLech')}
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
                                        currentItems.map((project, index) => (
                                            <TableRow
                                                key={index}
                                                project={project}
                                                formatCurrency={formatCurrency}
                                                formatDate={formatDate}
                                            />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="12" className="px-4 py-6 text-center text-sm text-gray-500">
                                                Không tìm thấy dự án nào phù hợp với tiêu chí tìm kiếm
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && getSortedFilteredItems.length > 0 && (
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                handlePageChange={handlePageChange}
                            />
                        )}
                    </div>

                    {/* Bảng thống kê chi tiêu theo tháng */}
                    <StatisticsTable
                        title="Thống kê chi tiêu theo tháng"
                        data={calculateMonthlyChiStatistics}
                        columns={chiColumns}
                        totalRow={chiTotalRow}
                        formatCurrency={formatCurrency}
                    />

                    {/* Danh sách chi tiêu */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Danh sách chi tiêu</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã chuyển khoản</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khu vực</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dự án</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã CHI</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày giải ngân</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đối tượng</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {chiData
                                        .filter(chi => chi['Năm'] === filters.year)
                                        .slice(0, 10) // Giới hạn số lượng hiển thị
                                        .map((chi, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {chi['Mã chuyển khoản'] || '—'}
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
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatCurrency(chi['SỐ TIỀN'])}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {chi['ĐỐI TƯỢNG'] || '—'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                       ${chi['TRẠNG THÁI'] === 'Hoàn thành'
                                                            ? 'bg-green-100 text-green-800'
                                                            : chi['TRẠNG THÁI'] === 'Đang xử lý'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {chi['TRẠNG THÁI'] || 'Chưa xác định'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    {chiData.filter(chi => chi['Năm'] === filters.year).length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-6 text-center text-sm text-gray-500">
                                                Không có dữ liệu chi tiêu cho năm {filters.year}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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

export default DuAnStatistics;