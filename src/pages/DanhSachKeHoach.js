import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';
import Modal from '../components/ui/Modal';

const DanhSachKeHoach = () => {
    const [keHoachList, setKeHoachList] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedKeHoach, setSelectedKeHoach] = useState(null);
    const [filters, setFilters] = useState({
        khuVuc: '',
        loaiKeHoach: '',
        nguoiGiaoViec: '',
        trangThai: ''
    });

    // Lấy danh sách kế hoạch khi component mount
    useEffect(() => {
        fetchKeHoachList();
    }, []);

    // Lọc danh sách khi search term hoặc filters thay đổi
    useEffect(() => {
        filterKeHoachList();
    }, [searchTerm, filters, keHoachList]);

    const fetchKeHoachList = async () => {
        setIsLoading(true);
        try {
            // Gọi API để lấy danh sách kế hoạch từ server
            const response = await authUtils.apiRequestErp('DUAN', 'Find', {}, {});

            if (response && !response.Failed) {
                setKeHoachList(response || []);
                setFilteredList(response || []);
                toast.success('Lấy danh sách kế hoạch thành công');
            } else {
                throw new Error(response?.FailureMessage || 'Không thể lấy dữ liệu');
            }
        } catch (error) {
            toast.error(`Lỗi: ${error.message || 'Không xác định'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const filterKeHoachList = () => {
        let results = [...keHoachList];

        // Lọc theo từ khóa tìm kiếm
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            results = results.filter(item =>
                (item["Mã kế hoạch"] && item["Mã kế hoạch"].toLowerCase().includes(searchLower)) ||
                (item["Tên công trình"] && item["Tên công trình"].toLowerCase().includes(searchLower)) ||
                (item["POP"] && item["POP"].toLowerCase().includes(searchLower))
            );
        }

        // Áp dụng các bộ lọc
        if (filters.khuVuc) {
            results = results.filter(item => item["Khu vực"] === filters.khuVuc);
        }

        if (filters.loaiKeHoach) {
            results = results.filter(item => item["Kế hoạch"] === filters.loaiKeHoach);
        }

        if (filters.nguoiGiaoViec) {
            results = results.filter(item => item["Người giao việc"] === filters.nguoiGiaoViec);
        }

        if (filters.trangThai) {
            // Giả sử có trường trạng thái trong dữ liệu
            results = results.filter(item => item["Trạng thái"] === filters.trangThai);
        }

        setFilteredList(results);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilters({
            khuVuc: '',
            loaiKeHoach: '',
            nguoiGiaoViec: '',
            trangThai: ''
        });
    };

    const viewKeHoachDetail = (keHoach) => {
        setSelectedKeHoach(keHoach);
        setModalOpen(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    // Các trạng thái có thể có của kế hoạch
    const trangThaiOptions = [
        { value: '', label: 'Tất cả' },
        { value: 'Đang xử lý', label: 'Đang xử lý' },
        { value: 'Hoàn thành', label: 'Hoàn thành' },
        { value: 'Hủy bỏ', label: 'Hủy bỏ' }
    ];

    // Trích xuất danh sách khu vực, loại kế hoạch, và người giao việc từ dữ liệu
    const khuVucOptions = [
        { value: '', label: 'Tất cả' },
        ...Array.from(new Set(keHoachList.map(item => item["Khu vực"]).filter(Boolean)))
            .map(kv => ({ value: kv, label: kv }))
    ];

    const loaiKeHoachOptions = [
        { value: '', label: 'Tất cả' },
        ...Array.from(new Set(keHoachList.map(item => item["Kế hoạch"]).filter(Boolean)))
            .map(kh => ({ value: kh, label: kh }))
    ];

    const nguoiGiaoViecOptions = [
        { value: '', label: 'Tất cả' },
        ...Array.from(new Set(keHoachList.map(item => item["Người giao việc"]).filter(Boolean)))
            .map(ngv => ({ value: ngv, label: ngv }))
    ];

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

            {/* Header với tiêu đề và nút làm mới */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold text-gray-800">Danh sách Kế hoạch</h1>
                <button
                    onClick={fetchKeHoachList}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang tải...
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Làm mới
                        </>
                    )}
                </button>
            </div>

            {/* Phần tìm kiếm và lọc */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mb-3">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm theo mã kế hoạch, tên công trình, POP..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
                        <select
                            name="khuVuc"
                            value={filters.khuVuc}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            {khuVucOptions.map((option, index) => (
                                <option key={index} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại kế hoạch</label>
                        <select
                            name="loaiKeHoach"
                            value={filters.loaiKeHoach}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            {loaiKeHoachOptions.map((option, index) => (
                                <option key={index} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Người giao việc</label>
                        <select
                            name="nguoiGiaoViec"
                            value={filters.nguoiGiaoViec}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            {nguoiGiaoViecOptions.map((option, index) => (
                                <option key={index} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <select
                            name="trangThai"
                            value={filters.trangThai}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            {trangThaiOptions.map((option, index) => (
                                <option key={index} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-3 flex justify-end">
                    <button
                        onClick={resetFilters}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Xóa bộ lọc
                    </button>
                </div>
            </div>

            {/* Bảng danh sách kế hoạch */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mã kế hoạch
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tên công trình
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                POP
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Khu vực
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Loại kế hoạch
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Deadline
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : filteredList.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                    Không tìm thấy kế hoạch nào
                                </td>
                            </tr>
                        ) : (
                            filteredList.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {item["Mã kế hoạch"]}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                                        {item["Tên công trình"]}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item["POP"]}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item["Khu vực"]}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item["Kế hoạch"]}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(item["Deadline KH"])}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${item["Trạng thái"] === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                                                item["Trạng thái"] === 'Đang xử lý' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {item["Trạng thái"] || 'Chưa xác định'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button
                                            onClick={() => viewKeHoachDetail(item)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Chi tiết
                                        </button>
                                        <a
                                            href={`/edit-ke-hoach/${item["Mã kế hoạch"]}`}
                                            className="text-green-600 hover:text-green-900"
                                        >
                                            Chỉnh sửa
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Chi tiết kế hoạch Modal */}
            {modalOpen && selectedKeHoach && (
                <Modal
                    title={`Chi tiết kế hoạch: ${selectedKeHoach["Mã kế hoạch"]}`}
                    onClose={() => setModalOpen(false)}
                >
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Mã kế hoạch</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Mã kế hoạch"]}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">POP</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["POP"]}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Ngày nhận</p>
                                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedKeHoach["Ngày nhận"])}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Deadline</p>
                                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedKeHoach["Deadline KH"])}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Khu vực</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Khu vực"]}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Loại kế hoạch</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Kế hoạch"]}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Người giao việc</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Người giao việc"]}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Giám sát</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Giám sát"] || "Chưa phân công"}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-gray-500">Tên công trình</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Tên công trình"]}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-gray-500">Địa chỉ thi công</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Địa chỉ thi công"] || "Không có"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tổng bộ chia</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Tổng bộ chia"] || "0"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tổng số Tủ/ODF/tập điểm</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Tổng số Tủ/ODF/tập điểm"] || "0"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Dự toán Core</p>
                                <p className="mt-1 text-sm text-gray-900">{selectedKeHoach["Dự toán Core"] || "0"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                                <p className="mt-1">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${selectedKeHoach["Trạng thái"] === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                                            selectedKeHoach["Trạng thái"] === 'Đang xử lý' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'}`}>
                                        {selectedKeHoach["Trạng thái"] || 'Chưa xác định'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Lịch sử</h3>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                                {selectedKeHoach["Lịch sử"] || "Không có thông tin lịch sử"}
                            </p>
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
                            >
                                Đóng
                            </button>
                            <a
                                href={`/edit-ke-hoach/${selectedKeHoach["Mã kế hoạch"]}`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Chỉnh sửa
                            </a>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DanhSachKeHoach;