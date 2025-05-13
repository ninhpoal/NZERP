import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
    FaUserClock, FaSyncAlt, FaCalendarDay, FaUsers, FaUserTie,
    FaCheck, FaExclamationTriangle, FaTimes, FaCheckCircle,
    FaExclamationCircle, FaTimesCircle, FaPlane, FaMoon, FaTrashAlt
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from 'react-data-table-component';
import authUtils from '../utils/authUtils';

const AttendanceSystem = () => {
    // State Management
    const [activeTab, setActiveTab] = useState('weldingTab');
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [employeesData, setEmployeesData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Constants
    const DAYS_OF_WEEK = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
    const STATUS_COLORS = {
        'Có mặt': 'bg-green-500',
        'Vắng có phép': 'bg-yellow-500',
        'Vắng không phép': 'bg-red-500'
    };

    // Format functions
    const formatDate = (date) => {
        return dayjs(date).format('DD/MM/YYYY');
    };

    const getDayOfWeek = (day) => DAYS_OF_WEEK[day];

    // API functions
    const fetchEmployees = async () => {
        try {
            const response = await authUtils.apiRequestChamcong('NHÂN VIÊN', "Find", {
                Selector: `Filter(NHÂN VIÊN, true)`
            });
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Lỗi khi tải danh sách nhân viên');
            return [];
        }
    };

    const fetchAttendance = async () => {
        try {
            const response = await authUtils.apiRequestChamcong('Chấm công', 'Find', {
                Selector: `Filter(Chấm công, true)`
            });
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Lỗi khi tải dữ liệu chấm công');
            return [];
        }
    };

    const createAttendanceRecord = async (record) => {
        try {
            setIsLoading(true);
            const loadingToast = toast.loading('Đang tạo bản ghi chấm công...');

            const response = await authUtils.apiRequestChamcong('Chấm công', 'Add', { Rows: [record] });

            if (response && response.Rows && response.Rows.length > 0) {
                setAttendanceData(prev => [...prev, response.Rows[0]]);
                toast.update(loadingToast, {
                    render: 'Bản ghi chấm công đã được tạo thành công!',
                    type: 'success',
                    isLoading: false,
                    autoClose: 2000
                });
                return response.Rows[0];
            } else {
                throw new Error("Unexpected response structure");
            }
        } catch (error) {
            console.error("Error creating attendance record:", error);
            toast.error('Không thể tạo bản ghi chấm công. Vui lòng thử lại.');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteAttendanceRecord = async (attendanceId) => {
        try {
            setIsLoading(true);
            const loadingToast = toast.loading('Đang xóa bản ghi chấm công...');

            const response = await authUtils.apiRequestChamcong('Chấm công', 'Delete', {
                Rows: [{ 'Mã chấm công': attendanceId }]
            });

            if (response && response.Rows && response.Rows.length > 0) {
                setAttendanceData(prev => prev.filter(record => record['Mã chấm công'] !== attendanceId));
                toast.update(loadingToast, {
                    render: `Đã xóa bản ghi chấm công ${attendanceId}`,
                    type: 'success',
                    isLoading: false,
                    autoClose: 2000
                });
                return `Đã xóa bản ghi chấm công ${attendanceId}`;
            } else {
                throw new Error("Unexpected response structure");
            }
        } catch (error) {
            console.error("Error deleting attendance record:", error);
            toast.error('Có lỗi xảy ra khi xóa bản ghi chấm công. Vui lòng thử lại.');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate allowance function
    const calculateAllowance = (status, date, businessTrip, nightShift) => {
        let regularAllowance = 0;
        let sundayAllowance = 0;

        if (status === 'Có mặt') {
            const dayOfWeek = dayjs(date).day();

            if (nightShift) {
                regularAllowance += 200000;
            }

            if (dayOfWeek === 0) {
                sundayAllowance = 300000;
            } else if (businessTrip) {
                regularAllowance += 40000;
            }
        }

        return {
            regularAllowance,
            sundayAllowance
        };
    };

    // Mark attendance function
    const markAttendance = async (employeeId, status, businessTripChecked, nightShiftChecked) => {
        if (!selectedDate) {
            toast.info("Vui lòng chọn ngày trước khi chấm công!");
            return;
        }

        const attendanceId = `${dayjs(selectedDate).format("DDMMYYYY")}${employeeId}`;

        if (attendanceData.some(a => a['Mã chấm công'] === attendanceId)) {
            toast.info("Đã chấm công cho nhân viên này vào ngày này!");
            return;
        }

        const businessTrip = businessTripChecked;
        const nightShift = nightShiftChecked;

        const allowances = calculateAllowance(status, selectedDate, businessTrip, nightShift);

        const newRecord = {
            'Mã chấm công': attendanceId,
            'Ngày': selectedDate,
            'Thứ': getDayOfWeek(dayjs(selectedDate).day()),
            'Mã nhân viên': employeeId,
            'Trạng thái': status,
            'Đi tỉnh': businessTrip ? 'Có' : 'Không',
            'Tăng ca đêm': nightShift ? 'Có' : 'Không',
            'Phụ cấp': allowances.regularAllowance,
            'Phụ cấp chủ nhật': allowances.sundayAllowance
        };

        try {
            await createAttendanceRecord(newRecord);
        } catch (error) {
            console.error("Error in markAttendance:", error);
        }
    };

    // Load data
    const loadData = async () => {
        setIsLoading(true);
        const loadingToast = toast.loading('Đang tải dữ liệu...');

        try {
            const [employees, attendance] = await Promise.all([
                fetchEmployees(),
                fetchAttendance()
            ]);

            setEmployeesData(employees);
            setAttendanceData(attendance);

            toast.update(loadingToast, {
                render: 'Dữ liệu đã được tải thành công!',
                type: 'success',
                isLoading: false,
                autoClose: 2000
            });
        } catch (error) {
            console.error("Error loading data:", error);
            toast.update(loadingToast, {
                render: 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng tải lại trang.',
                type: 'error',
                isLoading: false,
                autoClose: 2000
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize on mount
    useEffect(() => {
        loadData();
    }, []);

    // Filter employees by search term
    const filteredEmployees = (employees) => {
        return employees.filter(emp =>
            emp['Họ và tên']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp['Mã nhân viên']?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    // Employee Card component
    const EmployeeCard = ({ employee }) => {
        const [businessTrip, setBusinessTrip] = useState(false);
        const [nightShift, setNightShift] = useState(false);
        const [isExpanded, setIsExpanded] = useState(false);

        const initials = (employee['Họ và tên'] || 'N/A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        const getRandomColor = (id) => {
            const colors = [
                'bg-blue-500', 'bg-purple-500', 'bg-green-500',
                'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
            ];
            const hash = id?.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0) || 0;
            return colors[hash % colors.length];
        };

        return (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition duration-300">
                <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className={`w-12 h-12 ${getRandomColor(employee['Mã nhân viên'])} rounded-full flex items-center justify-center text-white text-xl font-bold mr-4`}>
                            {initials}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg truncate">{employee['Họ và tên'] || 'N/A'}</h3>
                            <p className="text-gray-600 text-sm">
                                {employee['Mã nhân viên'] || 'N/A'} • {employee['Phòng ban'] || 'N/A'}
                            </p>
                            <p className="text-gray-500 text-sm">
                                {employee['Chức vụ'] || 'N/A'} • {employee['Khu vực'] || 'N/A'}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-blue-500 hover:text-blue-700"
                        >
                            {isExpanded ? "Thu gọn" : "Mở rộng"}
                        </button>
                    </div>
                </div>

                <div className={`p-5 ${isExpanded ? 'block' : 'hidden'}`}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Đi tỉnh</label>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-blue-500"
                                    name={`businessTrip_${employee['Mã nhân viên']}`}
                                    checked={!businessTrip}
                                    onChange={() => setBusinessTrip(false)}
                                />
                                <span className="ml-2 text-sm">Không</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-blue-500"
                                    name={`businessTrip_${employee['Mã nhân viên']}`}
                                    checked={businessTrip}
                                    onChange={() => setBusinessTrip(true)}
                                />
                                <span className="ml-2 text-sm">Có</span>
                            </label>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Tăng ca đêm</label>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-blue-500"
                                    name={`nightShift_${employee['Mã nhân viên']}`}
                                    checked={!nightShift}
                                    onChange={() => setNightShift(false)}
                                />
                                <span className="ml-2 text-sm">Không</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-blue-500"
                                    name={`nightShift_${employee['Mã nhân viên']}`}
                                    checked={nightShift}
                                    onChange={() => setNightShift(true)}
                                />
                                <span className="ml-2 text-sm">Có</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50">
                    <button
                        className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-2 rounded-md transition duration-300"
                        onClick={() => markAttendance(employee['Mã nhân viên'], 'Có mặt', businessTrip, nightShift)}
                        disabled={isLoading}
                    >
                        <FaCheck className="mr-1" />
                        <span className="text-xs">Có mặt</span>
                    </button>
                    <button
                        className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-2 rounded-md transition duration-300"
                        onClick={() => markAttendance(employee['Mã nhân viên'], 'Vắng có phép', businessTrip, nightShift)}
                        disabled={isLoading}
                    >
                        <FaExclamationTriangle className="mr-1" />
                        <span className="text-xs">Có phép</span>
                    </button>
                    <button
                        className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-2 rounded-md transition duration-300"
                        onClick={() => markAttendance(employee['Mã nhân viên'], 'Vắng không phép', businessTrip, nightShift)}
                        disabled={isLoading}
                    >
                        <FaTimes className="mr-1" />
                        <span className="text-xs">Không phép</span>
                    </button>
                </div>
            </div>
        );
    };

    // Columns for DataTable
    const columns = [
        {
            name: 'Mã chấm công',
            selector: row => row['Mã chấm công'],
            sortable: true,
        },
        {
            name: 'Ngày',
            selector: row => row['Ngày'],
            sortable: true,
            sortFunction: (a, b) => dayjs(a.SortDate).unix() - dayjs(b.SortDate).unix(),
        },
        {
            name: 'Thứ',
            selector: row => row['Thứ'],
            sortable: true,
        },
        {
            name: 'Mã nhân viên',
            selector: row => row['Mã nhân viên'],
            sortable: true,
        },
        {
            name: 'Trạng thái',
            selector: row => row['Trạng thái'],
            sortable: true,
            cell: row => {
                let Icon = FaCheckCircle;
                let statusClass = 'text-green-600';

                if (row['Trạng thái'] === 'Có mặt') {
                    Icon = FaCheckCircle;
                    statusClass = 'text-green-600';
                } else if (row['Trạng thái'] === 'Vắng có phép') {
                    Icon = FaExclamationCircle;
                    statusClass = 'text-yellow-600';
                } else if (row['Trạng thái'] === 'Vắng không phép') {
                    Icon = FaTimesCircle;
                    statusClass = 'text-red-600';
                }

                return (
                    <div className={`flex items-center ${statusClass}`}>
                        <Icon className="mr-2" />
                        <span>{row['Trạng thái']}</span>
                    </div>
                );
            }
        },
        {
            name: 'Đi tỉnh',
            selector: row => row['Đi tỉnh'],
            sortable: true,
            cell: row => (
                <div className={row['Đi tỉnh'] === 'Có' ? 'text-blue-600' : 'text-gray-500'}>
                    {row['Đi tỉnh'] === 'Có' && <FaPlane className="inline mr-2" />}
                    {row['Đi tỉnh']}
                </div>
            )
        },
        {
            name: 'Tăng ca đêm',
            selector: row => row['Tăng ca đêm'],
            sortable: true,
            cell: row => (
                <div className={row['Tăng ca đêm'] === 'Có' ? 'text-purple-600' : 'text-gray-500'}>
                    {row['Tăng ca đêm'] === 'Có' && <FaMoon className="inline mr-2" />}
                    {row['Tăng ca đêm']}
                </div>
            )
        },
        {
            name: 'Phụ cấp',
            selector: row => row['Phụ cấp'],
            sortable: true,
            cell: row => <span>{row['Phụ cấp'].toLocaleString()} đ</span>
        },
        {
            name: 'Hành động',
            cell: row => (
                <button
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded transition duration-300"
                    onClick={() => deleteAttendanceRecord(row['Mã chấm công'])}
                    disabled={isLoading}
                >
                    <FaTrashAlt className="inline mr-1" />
                    Xóa
                </button>
            )
        }
    ];

    // Transform data for DataTable
    const transformedAttendanceData = attendanceData.map(record => ({
        ...record,
        'Ngày': formatDate(record['Ngày']),
        'SortDate': dayjs(record['Ngày']).format('YYYY-MM-DD') // Hidden field for sorting
    }));

    // Filter employees by department or role
    const adminEmployees = employeesData.filter(emp =>
        emp['Trạng thái'] === "Còn làm" && emp['Phòng ban'] === "Hành chánh"
    );

    const weldingEmployees = employeesData.filter(emp =>
        emp['Trạng thái'] === "Còn làm" && emp['Chức vụ'] === "Đội hàn"
    );

    // Custom DataTable style
    const customStyles = {
        headCells: {
            style: {
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: '#f1f5f9',
                padding: '10px 16px',
            },
        },
        cells: {
            style: {
                padding: '8px 16px',
            },
        },
    };

    return (
        <div className=" h-[calc(100vh-7rem)]">
            <div className=" mx-auto p-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hệ thống Chấm công</h1>
                            <p className="text-gray-600">Quản lý chấm công nhân viên hiệu quả</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <input
                                    type="date"
                                    className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                                <span className="text-xs text-gray-500 block mt-1">
                                    {getDayOfWeek(dayjs(selectedDate).day())}
                                </span>
                            </div>
                            <button
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center"
                                onClick={() => setSelectedDate(dayjs().format('YYYY-MM-DD'))}
                            >
                                <FaCalendarDay className="mr-2" />
                                Hôm nay
                            </button>
                            <button
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 flex items-center"
                                onClick={loadData}
                                disabled={isLoading}
                            >
                                <FaSyncAlt className="mr-2" />
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Employee section tabs */}
                <div className="mb-6">
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                            <button
                                className={`flex-1 px-6 py-4 text-center font-medium transition duration-200 ${activeTab === 'weldingTab'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                                onClick={() => setActiveTab('weldingTab')}
                            >
                                <FaUsers className="inline mr-2" />
                                Đội Hàn
                            </button>
                            <button
                                className={`flex-1 px-6 py-4 text-center font-medium transition duration-200 ${activeTab === 'adminTab'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                    }`}
                                onClick={() => setActiveTab('adminTab')}
                            >
                                <FaUserTie className="inline mr-2" />
                                Nhân viên Hành chánh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full shadow appearance-none border rounded py-3 px-4 pl-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="Tìm kiếm nhân viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Employees grid */}
                <div id="weldingTab" className={`mb-8 ${activeTab !== 'weldingTab' ? 'hidden' : ''}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Đội Hàn</h2>
                        <div className="text-sm text-gray-600">
                            Tổng số: {filteredEmployees(weldingEmployees).length} nhân viên
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredEmployees(weldingEmployees).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredEmployees(weldingEmployees).map((emp, index) => (
                                <EmployeeCard key={emp['Mã nhân viên'] || index} employee={emp} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow text-center">
                            <p className="text-gray-600">Không tìm thấy nhân viên nào.</p>
                        </div>
                    )}
                </div>

                <div id="adminTab" className={`mb-8 ${activeTab !== 'adminTab' ? 'hidden' : ''}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Nhân viên Hành chánh</h2>
                        <div className="text-sm text-gray-600">
                            Tổng số: {filteredEmployees(adminEmployees).length} nhân viên
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    ) : filteredEmployees(adminEmployees).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredEmployees(adminEmployees).map((emp, index) => (
                                <EmployeeCard key={emp['Mã nhân viên'] || index} employee={emp} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow text-center">
                            <p className="text-gray-600">Không tìm thấy nhân viên nào.</p>
                        </div>
                    )}
                </div>

                {/* Attendance records table */}
                <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Bảng chấm công</h2>
                        <div className="text-sm text-gray-600">
                            Tổng số: {transformedAttendanceData.length} bản ghi
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <DataTable
                            columns={columns}
                            data={transformedAttendanceData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[10, 25, 50, 100]}
                            highlightOnHover
                            responsive
                            defaultSortAsc={false}
                            progressPending={isLoading}
                            progressComponent={
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Đang tải dữ liệu...</p>
                                </div>
                            }
                            noDataComponent={
                                <div className="p-10 text-center">
                                    <p className="text-gray-600">Không có dữ liệu chấm công</p>
                                </div>
                            }
                            customStyles={customStyles}
                        />
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="bg-green-100 rounded-full p-3 mr-4">
                                <FaCheckCircle className="text-green-500 text-xl" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700">Có mặt</h3>
                                <p className="text-2xl font-bold">
                                    {transformedAttendanceData.filter(r => r['Trạng thái'] === 'Có mặt').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="bg-yellow-100 rounded-full p-3 mr-4">
                                <FaExclamationCircle className="text-yellow-500 text-xl" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700">Vắng có phép</h3>
                                <p className="text-2xl font-bold">
                                    {transformedAttendanceData.filter(r => r['Trạng thái'] === 'Vắng có phép').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                            <div className="bg-red-100 rounded-full p-3 mr-4">
                                <FaTimesCircle className="text-red-500 text-xl" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700">Vắng không phép</h3>
                                <p className="text-2xl font-bold">
                                    {transformedAttendanceData.filter(r => r['Trạng thái'] === 'Vắng không phép').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status legend */}
            <div className="bg-white border-t py-4">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                            <span className="text-sm text-gray-600">Có mặt</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                            <span className="text-sm text-gray-600">Vắng có phép</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                            <span className="text-sm text-gray-600">Vắng không phép</span>
                        </div>
                        <div className="flex items-center">
                            <FaPlane className="text-blue-500 mr-2" />
                            <span className="text-sm text-gray-600">Đi tỉnh</span>
                        </div>
                        <div className="flex items-center">
                            <FaMoon className="text-purple-500 mr-2" />
                            <span className="text-sm text-gray-600">Tăng ca đêm</span>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={2000} />
        </div>
    );
};

export default AttendanceSystem;