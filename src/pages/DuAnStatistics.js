import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Filter, Printer, RefreshCcw, Search } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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

const DuAnStatistics = () => {
    // State Management
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterArea, setFilterArea] = useState('TẤT CẢ');
    const [filterStatus, setFilterStatus] = useState('TẤT CẢ');
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [filterMonth, setFilterMonth] = useState('TẤT CẢ');
    const [filterBudget, setFilterBudget] = useState('TẤT CẢ');
    const [sortConfig, setSortConfig] = useState({ key: 'Ngày nhận kế hoạch', direction: 'descending' });
    const [showFilters, setShowFilters] = useState(false);
    const [chartType, setChartType] = useState('monthly'); // 'monthly', 'cumulative', 'average'
    const [filterCheck, setFilterCheck] = useState('TẤT CẢ');
    const checkValues = ['TẤT CẢ', 'Đạt', 'Trung bình', 'Xấu', 'Chưa đánh giá'];
    const trangThai = ['TẤT CẢ', '1/ Nhận Kế Hoạch', '2/ Đang thi công', '3/ Xự cố',

        '4/ Chờ cắt chuyển', '5/ Chờ thay đổi phương án', '6/ Thiếu vật tư', '7/ Đã thi công xong', '8/ Đã hoàn thành BCHN',
        '9/ Duyệt sản phẩm', '10/ Nhập MBM - Hoàn công', '11/ Hoàn thành hoàn công', '12/ Đã nghiệm thu', '13/ Đã xuất hóa đơn'
        ,
        '14/ Đã thanh toán', '15/ Hoàn thành'
    ];
    const [chiData, setChiData] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Chart ref
    const chartRef = useRef(null);
    const fetchChiData = async () => {
        try {
          setLoading(true);
          const response = await authUtils.apiRequest('CHI', 'Find', {Properties: {
            Selector: `Filter(CHI, and([TRẠNG THÁI] = "Đã giải ngân",[TKCHI]="BIDV Nam Phạm"))`
        }});
          
          // Transform dữ liệu chi
          const transformedChiData = response.map(chi => ({
            ...chi,
            'Ngày giải ngân': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']) : null,
            'SỐ TIỀN': parseFloat(chi['SỐ TIỀN']) || 0,
            'Tháng': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']).getMonth() + 1 : null,
            'Năm': chi['Ngày giải ngân'] ? new Date(chi['Ngày giải ngân']).getFullYear() : null
          }));
          
          setChiData(transformedChiData);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching chi data:', error);
          toast.error('Lỗi khi tải dữ liệu chi tiêu');
          setLoading(false);
        }
      };
      
    // Fetch data
    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await authUtils.apiRequest('DUAN', 'Find', {});

            // Transform data to ensure dates are properly formatted and numeric values are numbers
            // Trong phần transform data của fetchProjects
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
            setLoading(false);
            toast.success('Đã tải dữ liệu thành công');
        } catch (error) {
            console.error('Error fetching project list:', error);
            toast.error('Lỗi khi tải danh sách dự án');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
        fetchChiData(); // Thêm dòng này
      }, []);
      

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterArea, filterStatus, filterYear, filterMonth, filterBudget]);

    // Sorting function
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };  
    // Thêm hàm tính toán chi tiêu theo tháng
const calculateMonthlyExpenses = () => {
    const monthlyExpenses = Array(12).fill(0);
    
    // Lọc chi theo năm được chọn
    const yearExpenses = chiData.filter(chi => {
      if (!chi['Ngày giải ngân']) return false;
      return chi['Năm'] === filterYear;
    });
    
    // Tính tổng chi tiêu cho từng tháng
    yearExpenses.forEach(chi => {
      const month = chi['Tháng'] - 1; // Chuyển từ 1-12 sang 0-11 để khớp với array index
      if (month >= 0 && month < 12) {
        monthlyExpenses[month] += chi['SỐ TIỀN'];
      }
    });
    
    return monthlyExpenses;
  };
    // Get sorted items
    const getSortedItems = useMemo(() => {
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
        return sortableItems;
    }, [projects, sortConfig]);

    // Get unique areas for filtering
    const areas = ['TẤT CẢ', ...new Set(projects.map(proj => proj['Khu vực']).filter(Boolean))];

    // Get unique statuses for filtering
    const statuses = ['TẤT CẢ', ...new Set(projects.map(proj => proj['Trạng thái']).filter(Boolean))];

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
    const months = ['TẤT CẢ', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

    // Budget ranges for filtering
    const budgetRanges = [
        'TẤT CẢ',
        '< 100 triệu',
        '100 - 500 triệu',
        '500 triệu - 1 tỷ',
        '1 tỷ - 5 tỷ',
        '> 5 tỷ'
    ];

    // Filter project by budget range
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

    // Filtered items based on search and filters
    const filteredItems = useMemo(() => {
        return getSortedItems.filter(project => {
            const matchesSearch =
                (project['Mã kế hoạch']?.toLowerCase().includes(search.toLowerCase())) ||
                (project['POP']?.toLowerCase().includes(search.toLowerCase()));

            const matchesArea = filterArea === 'TẤT CẢ' || project['Khu vực'] === filterArea;
            const matchesStatus = filterStatus === 'TẤT CẢ' || project['Trạng thái'] === filterStatus;
            const matchesCheck = filterCheck === 'TẤT CẢ' || project['Check'] === filterCheck; // Thêm dòng này

            const projectYear = project['Ngày nhận kế hoạch']
                ? new Date(project['Ngày nhận kế hoạch']).getFullYear()
                : null;

            const matchesYear = filterYear === 'TẤT CẢ' || projectYear === filterYear;

            const projectMonth = project['Ngày nhận kế hoạch']
                ? new Date(project['Ngày nhận kế hoạch']).getMonth() + 1
                : null;

            const monthNumber = filterMonth === 'TẤT CẢ' ? 0 : parseInt(filterMonth.replace('Tháng ', ''));
            const matchesMonth = filterMonth === 'TẤT CẢ' || projectMonth === monthNumber;

            const matchesBudget = projectMatchesBudget(project, filterBudget);

            return matchesSearch && matchesArea && matchesStatus && matchesYear && matchesMonth && matchesBudget && matchesCheck;
        });
    }, [getSortedItems, search, filterArea, filterStatus, filterYear, filterMonth, filterBudget, filterCheck]);

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const calculateAreaStatistics = () => {
        const areaStats = {};

        areas.filter(area => area !== 'TẤT CẢ').forEach(area => {
            const areaProjects = filteredItems.filter(project => project['Khu vực'] === area);

            areaStats[area] = {
                projectCount: areaProjects.length,
                estimatedRevenue: areaProjects.reduce((sum, project) => sum + (project['Doanh thu tạm tính'] || 0), 0),
                actualRevenue: areaProjects.reduce((sum, project) => sum + (project['Số tiền HSHC Trước thuế'] || 0), 0),
                derivedRevenue: areaProjects.reduce((sum, project) => sum + (project['Doanh thu nội suy'] || 0), 0),
            };
        });

        return areaStats;
    };

    // Thêm hàm để tính toán thống kê theo trạng thái
    const calculateStatusStatistics = () => {
        const statusStats = {};

        statuses.filter(status => status !== 'TẤT CẢ').forEach(status => {
            const statusProjects = filteredItems.filter(project => project['Trạng thái'] === status);

            statusStats[status] = {
                projectCount: statusProjects.length,
                estimatedRevenue: statusProjects.reduce((sum, project) => sum + (project['Doanh thu tạm tính'] || 0), 0),
                actualRevenue: statusProjects.reduce((sum, project) => sum + (project['Số tiền HSHC Trước thuế'] || 0), 0),
                derivedRevenue: statusProjects.reduce((sum, project) => sum + (project['Doanh thu nội suy'] || 0), 0),
            };
        });

        return statusStats;
    };
    // Thêm hàm để tính toán thống kê theo tháng
    const calculateMonthlyStatistics = () => {
        const monthlyStats = {};

        for (let month = 1; month <= 12; month++) {
            const monthName = `Tháng ${month}`;
            const monthProjects = filteredItems.filter(project => {
                if (!project['Ngày nhận kế hoạch']) return false;
                const projectDate = new Date(project['Ngày nhận kế hoạch']);
                return projectDate.getMonth() + 1 === month && projectDate.getFullYear() === filterYear;
            });

            monthlyStats[monthName] = {
                projectCount: monthProjects.length,
                estimatedRevenue: monthProjects.reduce((sum, project) => sum + (project['Doanh thu tạm tính'] || 0), 0),
                actualRevenue: monthProjects.reduce((sum, project) => sum + (project['Số tiền HSHC Trước thuế'] || 0), 0),
                derivedRevenue: monthProjects.reduce((sum, project) => sum + (project['Doanh thu nội suy'] || 0), 0),
            };
        }

        return monthlyStats;
    };
    // Prepare monthly data for charts
    const prepareMonthlyData = () => {
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
        const yearProjects = filteredItems.filter(project => {
            if (!project['Ngày nhận kế hoạch']) return false;

            const projectDate = new Date(project['Ngày nhận kế hoạch']);
            return projectDate.getFullYear() === filterYear;
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
    };

    // Prepare cumulative data (running total) for time series
    const prepareCumulativeData = () => {
        const monthlyData = prepareMonthlyData();
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
    };

    // Prepare monthly averages for comparison with current year
    const prepareMonthlyAverages = () => {
        // Get all years except current
        const otherYears = years.filter(year => year !== filterYear);

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
        const currentYearData = prepareMonthlyData();

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
    };
// Thêm hàm để tính toán thống kê chi tiêu theo tháng
const calculateMonthlyChiStatistics = () => {
    const monthlyStats = {};
  
    for (let month = 1; month <= 12; month++) {
      const monthName = `Tháng ${month}`;
      const monthChiData = chiData.filter(chi => {
        if (!chi['Ngày giải ngân']) return false;
        const chiDate = new Date(chi['Ngày giải ngân']);
        return chiDate.getMonth() + 1 === month && chiDate.getFullYear() === filterYear;
      });
  
      monthlyStats[monthName] = {
        chiCount: monthChiData.length,
        totalAmount: monthChiData.reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0)
      };
    }
  
    return monthlyStats;
  };
  const calculateTotalExpenses = () => {
    return chiData
      .filter(chi => {
        if (!chi['Ngày giải ngân']) return false;
        return new Date(chi['Ngày giải ngân']).getFullYear() === filterYear;
      })
      .reduce((sum, chi) => sum + (chi['SỐ TIỀN'] || 0), 0);
  };
    // Modify the getChartConfig function to include all revenue types
// Modify the getChartConfig function to include all revenue types and expenses
const getChartConfig = () => {
    const labels = months.slice(1).map(month => month);
    const monthlyExpenses = calculateMonthlyExpenses();

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
            const monthlyData = prepareMonthlyData();
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
                                // Filter projects for this month
                                const monthProjects = filteredItems.filter(project => {
                                    if (!project['Ngày nhận kế hoạch']) return false;
                                    const projectDate = new Date(project['Ngày nhận kế hoạch']);
                                    return projectDate.getMonth() + 1 === item.month && 
                                           projectDate.getFullYear() === filterYear;
                                });
                                // Sum the estimated revenue
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
                                // Filter projects for this month
                                const monthProjects = filteredItems.filter(project => {
                                    if (!project['Ngày nhận kế hoạch']) return false;
                                    const projectDate = new Date(project['Ngày nhận kế hoạch']);
                                    return projectDate.getMonth() + 1 === item.month && 
                                           projectDate.getFullYear() === filterYear;
                                });
                                // Sum the derived revenue
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
                            text: `Thống kê dự án theo tháng (Năm ${filterYear})`,
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            };
        }

        case 'cumulative': {
            const cumulativeData = prepareCumulativeData();
            
            // Calculate cumulative values for estimated and derived revenue
            const cumulativeEstimatedRevenue = [];
            const cumulativeDerivedRevenue = [];
            const cumulativeExpenses = [];
            
            let runningEstimated = 0;
            let runningDerived = 0;
            let runningExpenses = 0;
            
            for (let month = 1; month <= 12; month++) {
                // Filter projects for this month and earlier in the selected year
                const monthProjects = filteredItems.filter(project => {
                    if (!project['Ngày nhận kế hoạch']) return false;
                    const projectDate = new Date(project['Ngày nhận kế hoạch']);
                    return projectDate.getMonth() + 1 <= month && 
                           projectDate.getFullYear() === filterYear;
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
                           chiDate.getFullYear() === filterYear;
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
                            text: `Số liệu tích lũy theo thời gian (Năm ${filterYear})`,
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            };
        }

        case 'average': {
            const averageData = prepareMonthlyAverages();
            const monthlyExpenses = calculateMonthlyExpenses();
            
            // Calculate monthly data for estimated and derived revenue
            const currentYearEstimatedRevenue = [];
            const currentYearDerivedRevenue = [];
            
            for (let month = 1; month <= 12; month++) {
                // Filter projects for this month in the selected year
                const monthProjects = filteredItems.filter(project => {
                    if (!project['Ngày nhận kế hoạch']) return false;
                    const projectDate = new Date(project['Ngày nhận kế hoạch']);
                    return projectDate.getMonth() + 1 === month && 
                           projectDate.getFullYear() === filterYear;
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
                            label: `Số dự án ${filterYear}`,
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
                            label: `Doanh thu HSHC ${filterYear}`,
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
                            label: `Doanh thu tạm tính ${filterYear}`,
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
                            label: `Doanh thu nội suy ${filterYear}`,
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
                            label: `Chi tiêu ${filterYear}`,
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
                            text: `So sánh với trung bình các năm (${filterYear})`,
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
};

    // Calculate summary statistics
    const statistics = useMemo(() => {
        const filteredProjects = filteredItems;

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
        const monthlyData = prepareMonthlyData();
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
            totalDerivedRevenue, // Thêm dòng này
            projectsByCheckStatus // Thêm dòng này
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

    // Print report
    const handlePrintReport = () => {
        window.print();
    };

    // Refresh data
    const handleRefreshData = () => {
        fetchProjects();
        toast.info('Đang làm mới dữ liệu...');
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            // Prepare data for export
            const exportData = filteredItems.map(project => ({
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
    };

    // Pagination controls
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

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
    };

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
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {showFilters && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {/* Area filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Khu vực:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterArea}
                                                onChange={(e) => setFilterArea(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {areas.map((area, index) => (
                                                    <option key={index} value={area}>{area}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Status filter */}
                                    <div >
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Trạng thái:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {statuses.map((status, index) => (
                                                    <option key={index} value={status}>{status}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Year filter */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Năm:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterYear}
                                                onChange={(e) => setFilterYear(parseInt(e.target.value))}
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
                                        <div className="relative">
                                            <select
                                                value={filterMonth}
                                                onChange={(e) => setFilterMonth(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {months.map((month, index) => (
                                                    <option key={index} value={month}>{month}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Đánh giá:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterCheck}
                                                onChange={(e) => setFilterCheck(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-10"
                                            >
                                                {checkValues.map((value, index) => (
                                                    <option key={index} value={value}>{value}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    {/* Budget filter */}
                                    <div hidden>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Ngân sách:</h3>
                                        <div className="relative">
                                            <select
                                                value={filterBudget}
                                                onChange={(e) => setFilterBudget(e.target.value)}
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
                                                value={itemsPerPage}
                                                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
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
                    </div>

                    {/* Statistics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h3 className="text-sm text-blue-700 mb-1">Tổng số dự án</h3>
                            <p className="text-2xl font-bold text-blue-800">{statistics.totalProjects}</p>
                            <p className="text-xs text-blue-600 mt-1">Trung bình {statistics.avgMonthlyProjects.toFixed(1)} dự án/tháng</p>
                        </div>

                        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                            <h3 className="text-sm text-green-700 mb-1">Hoàn thành</h3>
                            <p className="text-2xl font-bold text-green-800">{statistics.completedProjects}</p>
                            <p className="text-xs text-green-600 mt-1">
                                {statistics.totalProjects > 0
                                    ? `${(statistics.completedProjects / statistics.totalProjects * 100).toFixed(1)}% tổng số dự án`
                                    : '0% tổng số dự án'}
                            </p>
                        </div>

                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                            <h3 className="text-sm text-orange-700 mb-1">Đang thực hiện</h3>
                            <p className="text-2xl font-bold text-orange-800">{statistics.inProgressProjects}</p>
                            <p className="text-xs text-orange-600 mt-1">
                                Thời gian hoàn thành TB: {statistics.avgCompletionTime.toFixed(1)} ngày
                            </p>
                        </div>

                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                            <h3 className="text-sm text-purple-700 mb-1">Tổng doanh thu HSHC</h3>
                            <p className="text-xl font-bold text-purple-800">{formatCurrency(statistics.totalRevenue)}</p>
                            <p className="text-xs text-purple-600 mt-1">
                                TB: {formatCurrency(statistics.avgRevenuePerProject)}/dự án
                            </p>
                        </div>
                        {/* Thêm vào phần Statistics cards */}
<div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
  <h3 className="text-sm text-amber-700 mb-1">Tổng chi tiêu</h3>
  <p className="text-xl font-bold text-amber-800">{formatCurrency(calculateTotalExpenses())}</p>
  <p className="text-xs text-amber-600 mt-1">
    {chiData.filter(chi => chi['Năm'] === filterYear).length} phiếu chi
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
                                {getChartConfig() && (
                                    <div className="chart-container" style={{ position: 'relative', height: '100%', width: '100%' }}>
                                        {chartType === 'monthly' && <Bar data={getChartConfig().data} options={getChartConfig().options} ref={chartRef} />}
                                        {chartType === 'cumulative' && <Line data={getChartConfig().data} options={getChartConfig().options} ref={chartRef} />}
                                        {chartType === 'average' && <Bar data={getChartConfig().data} options={getChartConfig().options} ref={chartRef} />}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                  
                    {/* Bảng thống kê theo khu vực */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Thống kê theo khu vực</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khu vực</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số công trình</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu tạm tính</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền HSHC trước thuế</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu nội suy</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(calculateAreaStatistics()).map(([area, stats]) => (
                                        <tr key={area}>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{area}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{stats.projectCount}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(stats.estimatedRevenue)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(stats.actualRevenue)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(stats.derivedRevenue)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-medium">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Tổng cộng</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{statistics.totalProjects}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(statistics.totalEstimatedRevenue)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(statistics.totalRevenue)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(statistics.totalDerivedRevenue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Bảng thống kê theo trạng thái */}
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Thống kê theo trạng thái</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số công trình</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu tạm tính</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền HSHC trước thuế</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu nội suy</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {trangThai.filter(status => status !== 'TẤT CẢ').map(status => {
                                        const stats = calculateStatusStatistics()[status] || {
                                            projectCount: 0,
                                            estimatedRevenue: 0,
                                            actualRevenue: 0,
                                            derivedRevenue: 0
                                        };

                                        return (
                                            <tr key={status}>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{status}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{stats.projectCount}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(stats.estimatedRevenue)}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(stats.actualRevenue)}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(stats.derivedRevenue)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-gray-50 font-medium">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Tổng cộng</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{statistics.totalProjects}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(statistics.totalEstimatedRevenue)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(statistics.totalRevenue)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(statistics.totalDerivedRevenue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
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
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-4 text-center">
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
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
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
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-6 text-center text-sm text-gray-500">
                                                Không tìm thấy dự án nào phù hợp với tiêu chí tìm kiếm
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
                    {/* Bảng thống kê chi tiêu theo tháng */}
<div className="mb-8">
  <h2 className="text-lg font-semibold text-gray-800 mb-4">Thống kê chi tiêu theo tháng</h2>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tháng</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số phiếu chi</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng chi tiêu</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Object.entries(calculateMonthlyChiStatistics()).map(([month, stats]) => (
          <tr key={month}>
            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{stats.chiCount}</td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatCurrency(stats.totalAmount)}</td>
          </tr>
        ))}
        <tr className="bg-gray-50 font-medium">
          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Tổng cộng</td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
            {chiData.filter(chi => chi['Năm'] === filterYear).length}
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
            {formatCurrency(calculateTotalExpenses())}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

{/* Danh sách chi tiêu (tùy chọn) - có thể thêm vào nếu muốn hiển thị danh sách chi tiêu chi tiết */}
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
          .filter(chi => chi['Năm'] === filterYear)
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
        {chiData.filter(chi => chi['Năm'] === filterYear).length === 0 && (
          <tr>
            <td colSpan="8" className="px-4 py-6 text-center text-sm text-gray-500">
              Không có dữ liệu chi tiêu cho năm {filterYear}
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
                position="top-right"
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
