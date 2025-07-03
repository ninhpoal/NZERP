import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';  // Import react-select
import authUtils from '../utils/authUtils';
import Modal from '../components/ui/Modal';

const KeHoachForm = () => {
    // State giữ nguyên từ code gốc
    const [formData, setFormData] = useState({
        ngayNhan: new Date().toISOString().split('T')[0],
        deadline: '',
        maKeHoach: '',
        tenCongTrinh: '',
        pop: '',
        diaChiThiCong: '',
        khuVuc: '',
        keHoach: '',
        nguoiGiaoViec: '',
        giamSat: '',
        tongBoChua: 0,
        tongTuODFTapDiem: 0,
        duToanCore: 0
    });

    const [bcsgRows, setBcsgRows] = useState([
        { tuyenCap: '', diemDau: '', diemCuoi: '', loaiCap: '', duToan: 0 }
    ]);

    const [options, setOptions] = useState({
        khuVuc: ['FPT-HCM', 'FPT-BDG', 'FPT-VTU', 'FPT-TNH', 'FPT-BPC', 'FPT-BTN', 'FPT-LAN', 'NZ-HCM', 'Intecom', 'FPT-DNI', 'Nhật Minh', 'PA VietNam', 'BPC'],
        keHoach: ['SGx', 'Buiding', 'Di dời', 'Ngầm hóa', 'FTI', 'AON', 'Nâng Cấp', 'XLSC', 'Cắt chuyển', 'Metro', 'Hot', 'Thu hồi', 'Intecom', 'Bảo trì', 'Ring'],
        nguoiGiaoViec: ['Giáp VV', 'Cường TV', 'Sơn VT', 'Nghi NV', 'Thạo NT', 'Cường TQ', 'Kiệt NH', 'QLVH1 (Khiêm ND)', 'QLVH2 (Quý NT)', 'QLVH2 (Thế Anh)', 'QLVH3 (Thiện LTQ)', 'QLVH3 (Nguyên DT)', 'QLVH3 (Quang P)', 'QLVH3 (Khoa NA)', 'Cường LĐ', 'Sơn ĐT', 'Vương NN', 'Nhật NH', 'Hùng NQ DNI', 'Intecom', 'Nhật Minh', 'PhatMA', 'PA VietNam', 'ThanhTNM', 'Nam NQ', 'ThanhNT DNI'],
        giamSat: ['Giám sát A', 'Giám sát B', 'Giám sát C']
    });

    // Convert options to react-select format
    const selectOptions = {
        khuVuc: options.khuVuc.map(item => ({ value: item, label: item })),
        keHoach: options.keHoach.map(item => ({ value: item, label: item })),
        nguoiGiaoViec: options.nguoiGiaoViec.map(item => ({ value: item, label: item })),
        giamSat: options.giamSat.map(item => ({ value: item, label: item }))
    };

    const [excelFile, setExcelFile] = useState(null);
    const [loadingButtons, setLoadingButtons] = useState({
        sendData: false,
        addBCGS: false,
        copyBCGS: false
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        category: '',
        placeholder: '',
    });
    const [newOptionValue, setNewOptionValue] = useState('');

    // Các hàm xử lý 
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };


    // Handle react-select change
    const handleSelectChange = (selectedOption, { name }) => {
        setFormData({
            ...formData,
            [name]: selectedOption ? selectedOption.value : ''
        });
    };
    // 2. Chỉnh sửa hàm handleBcsgChange để trim dữ liệu text
    const handleBcsgChange = (index, field, value) => {
        const updatedRows = [...bcsgRows];
        updatedRows[index][field] = value;
        setBcsgRows(updatedRows);
    };

    const addBcsgRow = () => {
        setBcsgRows([...bcsgRows, { tuyenCap: '', diemDau: '', diemCuoi: '', loaiCap: '', duToan: '' }]);
    };

    const removeBcsgRow = (index) => {
        const updatedRows = bcsgRows.filter((_, i) => i !== index);
        setBcsgRows(updatedRows);
    };

    const resetForm = () => {
        setFormData({
            ngayNhan: new Date().toISOString().split('T')[0],
            deadline: '',
            maKeHoach: '',
            tenCongTrinh: '',
            pop: '',
            diaChiThiCong: '',
            khuVuc: '',
            keHoach: '',
            nguoiGiaoViec: '',
            giamSat: '',
            tongBoChua: '',
            tongTuODFTapDiem: '',
            duToanCore: ''
        });

        setBcsgRows([{ tuyenCap: '', diemDau: '', diemCuoi: '', loaiCap: '', duToan: '' }]);
        setExcelFile(null);

        // Reset file input
        const fileInput = document.getElementById('excelFile');
        if (fileInput) fileInput.value = '';

        toast.success('Đã reset form về trạng thái ban đầu');
    };

    const copyBCGSToClipboard = async () => {
        try {
            setLoadingButtons({ ...loadingButtons, copyBCGS: true });

            // Validate if there are BCGS rows to copy
            if (bcsgRows.length === 0 || !bcsgRows.some(row => row.tuyenCap || row.diemDau || row.diemCuoi)) {
                toast.info('Không có dữ liệu BCGS để sao chép');
                return;
            }

            // Format data as tab-separated text for pasting into spreadsheets
            const headers = ["Tuyến cáp", "Điểm đầu", "Điểm cuối", "Loại cáp", "Dự toán"];
            let textData = headers.join('\t') + '\n';

            bcsgRows.forEach(row => {
                textData += `${row.tuyenCap || ''}\t${row.diemDau || ''}\t${row.diemCuoi || ''}\t${row.loaiCap || ''}\t${row.duToan || ''}\n`;
            });

            await navigator.clipboard.writeText(textData);
            toast.success('Đã sao chép dữ liệu BCGS vào clipboard');
        } catch (error) {
            toast.error(`Lỗi khi sao chép: ${error.message || 'Không xác định'}`);
        } finally {
            setLoadingButtons({ ...loadingButtons, copyBCGS: false });
        }
    };

    const openAddOptionModal = (category) => {
        const titles = {
            khuVuc: 'Thêm khu vực mới',
            keHoach: 'Thêm kế hoạch mới',
            nguoiGiaoViec: 'Thêm người giao việc mới',
            giamSat: 'Thêm giám sát mới'
        };

        const placeholders = {
            khuVuc: 'Nhập tên khu vực mới',
            keHoach: 'Nhập tên kế hoạch mới',
            nguoiGiaoViec: 'Nhập tên người giao việc mới',
            giamSat: 'Nhập tên giám sát mới'
        };

        setModalConfig({
            title: titles[category],
            category: category,
            placeholder: placeholders[category]
        });

        setNewOptionValue('');
        setModalOpen(true);
    };

    const addNewOption = () => {
        const { category } = modalConfig;

        if (!newOptionValue.trim()) {
            toast.error('Vui lòng nhập giá trị');
            return;
        }

        if (options[category].includes(newOptionValue)) {
            toast.warning(`${newOptionValue} đã tồn tại trong danh sách`);
            return;
        }

        // Update both options arrays
        const updatedOptions = {
            ...options,
            [category]: [...options[category], newOptionValue]
        };

        setOptions(updatedOptions);

        // Update select options
        selectOptions[category] = updatedOptions[category].map(item => ({ value: item, label: item }));

        setFormData({
            ...formData,
            [category]: newOptionValue
        });

        toast.success(`Đã thêm ${newOptionValue} vào danh sách`);
        setModalOpen(false);
    };
const normalizeLoaiCap = (loaiCap) => {
    if (!loaiCap) return '';
    
    const capStr = loaiCap.toString().trim().toUpperCase();
    
    // Regex để tìm pattern số + chữ (FO, DU, FM, v.v.)
    const match = capStr.match(/^(\d+)([A-Z]+)$/);
    
    if (match) {
        const [, number, suffix] = match;
        const paddedNumber = number.padStart(2, '0'); // Thêm số 0 phía trước nếu < 10
        return `${paddedNumber}${suffix}`;
    }
    
    return capStr; // Trả về nguyên gốc nếu không match pattern
};
    const readExcelFile = (e) => {
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        setExcelFile(file);

        const toastId = toast.loading("Đang đọc file Excel...");

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                const sheetDTVT = workbook.Sheets['NV-DTVT'];
                const sheetTT = workbook.Sheets['TT'];
                const sheetNVTH = workbook.Sheets['NV-TH'];

                setFormData(prev => ({
                    ...prev,
                    maKeHoach: sheetDTVT?.['C8']?.v || '',
                    tenCongTrinh: sheetDTVT?.['A7']?.v || '',
                    pop: sheetTT?.['E12']?.v || '',
                    diaChiThiCong: sheetTT?.['E22']?.v || '',
                    duToanCore: sheetNVTH?.['E18']?.v || '',
                    tongTuODFTapDiem: sheetNVTH?.['H18']?.v || '',
                    tongBoChua: sheetNVTH?.['K18']?.v ? (sheetNVTH['K18'].v / 8) : ''
                }));

                const sheetTM = workbook.Sheets['NV-TM'];
                const range = XLSX.utils.decode_range(sheetTM['!ref']);
                const newBcsgRows = [];

                for (let R = 13; R <= Math.min(513, range.e.r); ++R) {
                    const duToan = sheetTM[`F${R}`]?.v;

                    if (duToan > 0) {
                        newBcsgRows.push({
                            tuyenCap: sheetTM[`A${R}`]?.v || '',
                            diemDau: sheetTM[`C${R}`]?.v || '',
                            diemCuoi: sheetTM[`D${R}`]?.v || '',
                            loaiCap: normalizeLoaiCap(sheetTM[`E${R}`]?.v) || '',
                            duToan: duToan || ''
                        });
                    }
                }

                if (newBcsgRows.length > 0) {
                    setBcsgRows(newBcsgRows);
                }

                toast.update(toastId, {
                    render: "Đã đọc file Excel thành công",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000
                });
            } catch (error) {
                toast.update(toastId, {
                    render: "Đã xảy ra lỗi khi đọc file Excel",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000
                });
            }
        };

        reader.onerror = () => {
            toast.update(toastId, {
                render: "Đã xảy ra lỗi khi đọc file Excel",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
        };

        reader.readAsArrayBuffer(file);
    };

    const sendDataToAppSheet = async () => {
        try {
            setLoadingButtons({ ...loadingButtons, sendData: true });

            const requiredFields = ['maKeHoach', 'tenCongTrinh', 'pop', 'khuVuc', 'keHoach', 'nguoiGiaoViec', 'deadline'];
            for (const field of requiredFields) {
                if (!formData[field]) {
                    toast.info(`Trường ${field} là bắt buộc.`);
                    setLoadingButtons({ ...loadingButtons, sendData: false });
                    return;
                }
            }

            const localUser = authUtils.getUserData();
            const manv = localUser['Mã nhân viên'];

            const duAnData = {
                "Ngày nhận": formatDate(formData.ngayNhan),
                "Deadline KH": formatDate(formData.deadline),
                "Mã kế hoạch": formData.maKeHoach.trim(),
                "Tên công trình": formData.tenCongTrinh,
                "POP": formData.pop,
                "Địa chỉ thi công": formData.diaChiThiCong,
                "Khu vực": formData.khuVuc,
                "Kế hoạch": formData.keHoach,
                "Người giao việc": formData.nguoiGiaoViec,
                "Giám sát": formData.giamSat,
                "Tổng bộ chia": formData.tongBoChua,
                "Tổng số Tủ/ODF/tập điểm": formData.tongTuODFTapDiem,
                "Dự toán Core": formData.duToanCore,
                "Lịch sử": manv + " Đã nhận dự án vào ngày :" + formatDate(formData.ngayNhan),
                "Nhân viên dự án phụ trách": manv || '',
            };

            const duAnResponse = await authUtils.apiRequestErp('DUAN', 'Add', {}, {
                Rows: [duAnData]
            });

            if (!duAnResponse || duAnResponse.Failed) {
                throw new Error(`Lỗi khi thêm dữ liệu vào DUAN: ${duAnResponse.FailureMessage || 'Không xác định'}`);
            }

            const bcsgData = bcsgRows.map(row => ({
                "Mã kế hoạch": duAnData["Mã kế hoạch"].trim(),
                "POP": duAnData["POP"],
                "Khu vực": duAnData["Khu vực"],
                "Tuyến cáp": row.tuyenCap,
                "Điểm đầu": row.diemDau,
                "Điểm cuối": row.diemCuoi,
                "Loại cáp": row.loaiCap,
                "Dự toán": row.duToan
            }));

            for (const item of bcsgData) {
                if (!item["Tuyến cáp"] || !item["Điểm đầu"] || !item["Điểm cuối"] || !item["Loại cáp"] || !item["Dự toán"]) {
                    throw new Error('Vui lòng điền đủ thông tin các dòng bạn đã thêm vào báo cáo giáo sát');
                }
            }

            if (bcsgData.length > 0) {
                await authUtils.apiRequestErp('BCGS', 'Add', {}, { Rows: bcsgData });
            }

            if (excelFile) {
                const fileBase64 = await readFileAsBase64(excelFile);
                const fileData = {
                    "Tên File": "File dự toán" + duAnData["Mã kế hoạch"] + duAnData["POP"],
                    "Key": duAnData["Mã kế hoạch"],
                    "File": fileBase64
                };
                await authUtils.apiRequestErp('FILE', 'Add', {}, { Rows: [fileData] });
            }

            toast.success('Dữ liệu đã được gửi thành công!');
            // Optionally reset form after successful submission
            // resetForm();

        } catch (error) {
            toast.error(`Lỗi: ${error.message || 'Không xác định'}`);
        } finally {
            setLoadingButtons({ ...loadingButtons, sendData: false });
        }
    };

    const addBCGSData = async () => {
        try {
            setLoadingButtons({ ...loadingButtons, addBCGS: true });
            const { maKeHoach, pop, khuVuc } = formData;

            if (!maKeHoach || !pop || !khuVuc) {
                toast.info('Vui lòng điền đầy đủ thông tin Mã kế hoạch, POP và Khu vực.');
                setLoadingButtons({ ...loadingButtons, addBCGS: false });
                return;
            }

            const bcsgData = bcsgRows.map(row => ({
                "Mã kế hoạch": maKeHoach,
                "POP": pop,
                "Khu vực": khuVuc,
                "Tuyến cáp": row.tuyenCap,
                "Điểm đầu": row.diemDau,
                "Điểm cuối": row.diemCuoi,
                "Loại cáp": row.loaiCap,
                "Dự toán": row.duToan
            }));

            for (const item of bcsgData) {
                if (!item["Tuyến cáp"] || !item["Điểm đầu"] || !item["Điểm cuối"] || !item["Loại cáp"] || !item["Dự toán"]) {
                    throw new Error('Vui lòng điền đủ thông tin các dòng bạn đã thêm vào báo cáo giám sát');
                }
            }

            if (bcsgData.length === 0) {
                throw new Error('Không có dữ liệu BCGS để thêm.');
            }

            const response = await authUtils.apiRequestErp('BCGS', 'Add', {}, { Rows: bcsgData });

            if (!response || response.Failed) {
                throw new Error(`Lỗi khi thêm dữ liệu vào BCGS: ${response.FailureMessage || 'Không xác định'}`);
            }

            toast.success('Dữ liệu BCGS đã được gửi thành công!');

        } catch (error) {
            toast.error(`Lỗi: ${error.message || 'Không xác định'}`);
        } finally {
            setLoadingButtons({ ...loadingButtons, addBCGS: false });
        }
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    const readFileAsBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    // Custom styles for react-select
    const customSelectStyles = {
        control: (base) => ({
            ...base,
            minHeight: '38px',
            borderColor: '#D1D5DB',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#9CA3AF'
            }
        }),
        valueContainer: (base) => ({
            ...base,
            padding: '0 8px'
        }),
        input: (base) => ({
            ...base,
            margin: '0',
            padding: '0'
        }),
        indicatorsContainer: (base) => ({
            ...base,
            height: '38px'
        })
    };

    return (
        <div className="bg-white h-[calc(100vh-7rem)]">
            <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />

            {/* Modal component */}
            {modalOpen && (
                <Modal
                    title={modalConfig.title}
                    onClose={() => setModalOpen(false)}
                >
                    <div className="p-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {modalConfig.placeholder}
                        </label>
                        <input
                            type="text"
                            value={newOptionValue}
                            onChange={(e) => setNewOptionValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder={modalConfig.placeholder}
                        />
                        <div className="mt-3 flex justify-end space-x-2">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={addNewOption}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Thêm
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Header with reset button */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-lg font-semibold text-gray-800">Form Kế Hoạch</h1>
                <button
                    onClick={resetForm}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Reset Form
                </button>
            </div>

            {/* Upload file section */}
            <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="font-medium text-blue-900">Tải lên file Excel</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <input
                        className="flex-grow text-sm py-1.5 px-2 border border-gray-300 rounded-md bg-white"
                        type="file"
                        id="excelFile"
                        accept=".xlsx, .xls"
                        onChange={readExcelFile}
                    />

                    <button
                        type="button"
                        onClick={sendDataToAppSheet}
                        disabled={loadingButtons.sendData}
                        className={`px-3 py-1.5 rounded-md text-white ${loadingButtons.sendData ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} flex items-center`}
                    >
                        {loadingButtons.sendData ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang gửi...
                            </>
                        ) : (
                            <>Đẩy dữ liệu</>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={addBCGSData}
                        disabled={loadingButtons.addBCGS}
                        className={`px-3 py-1.5 rounded-md text-white ${loadingButtons.addBCGS ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} flex items-center`}
                    >
                        {loadingButtons.addBCGS ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang thêm...
                            </>
                        ) : (
                            <>Thêm BCGS</>
                        )}
                    </button>
                </div>
            </div>

            {/* Thông tin cơ bản */}
            <h2 className="text-sm font-medium text-gray-700 mb-2">Thông tin cơ bản</h2>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <div className="text-xs bg-blue-100 text-blue-600 py-0.5 px-1 rounded mb-1 inline-block">
                        NGÀY NHẬN *
                    </div>
                    <input
                        type="date"
                        id="ngayNhan"
                        name="ngayNhan"
                        value={formData.ngayNhan}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <div className="text-xs bg-blue-100 text-blue-600 py-0.5 px-1 rounded mb-1 inline-block">
                        DEADLINE KH *
                    </div>
                    <input
                        type="date"
                        id="deadline"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <div className="text-xs bg-blue-100 text-blue-600 py-0.5 px-1 rounded mb-1 inline-block">
                        MÃ KẾ HOẠCH *
                    </div>
                    <input
                        type="text"
                        id="maKeHoach"
                        name="maKeHoach"
                        value={formData.maKeHoach}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <div className="text-xs bg-blue-100 text-blue-600 py-0.5 px-1 rounded mb-1 inline-block">
                        POP *
                    </div>
                    <input
                        type="text"
                        id="pop"
                        name="pop"
                        value={formData.pop}
                        onChange={handleInputChange}
                        required
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                    />
                </div>
            </div>



            <div className="mb-3">
                <div className="text-xs bg-blue-100 text-blue-600 py-0.5 px-1 rounded mb-1 inline-block">
                    TÊN CÔNG TRÌNH *
                </div>
                <textarea
                    id="tenCongTrinh"
                    name="tenCongTrinh"
                    value={formData.tenCongTrinh}
                    onChange={handleInputChange}
                    required
                    rows="2"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                />
            </div>

            <div className="mb-3">
                <div className="text-xs bg-gray-100 text-gray-600 py-0.5 px-1 rounded mb-1 inline-block">
                    ĐỊA CHỈ THI CÔNG
                </div>
                <textarea
                    id="diaChiThiCong"
                    name="diaChiThiCong"
                    value={formData.diaChiThiCong}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                />
            </div>

            {/* Thông tin dự án */}
            <h2 className="text-sm font-medium text-gray-700 mt-4 mb-2">Thông tin dự án</h2>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <div className="text-xs bg-blue-100 text-blue-600 py-0.5 px-1 rounded mb-1 inline-block">
                        KHU VỰC *
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="flex-grow">
                            <Select
                                id="khuVuc"
                                name="khuVuc"
                                value={selectOptions.khuVuc.find(option => option.value === formData.khuVuc) || null}
                                onChange={(option) => handleSelectChange(option, { name: 'khuVuc' })}
                                options={selectOptions.khuVuc}
                                placeholder="Chọn khu vực"
                                isClearable
                                styles={customSelectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => openAddOptionModal('khuVuc')}
                            className="px-2 py-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div>
                    <div className="text-xs bg-blue-100 text-blue-600 py-0.5 px-1 rounded mb-1 inline-block">
                        KẾ HOẠCH *
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="flex-grow">
                            <Select
                                id="keHoach"
                                name="keHoach"
                                value={selectOptions.keHoach.find(option => option.value === formData.keHoach) || null}
                                onChange={(option) => handleSelectChange(option, { name: 'keHoach' })}
                                options={selectOptions.keHoach}
                                placeholder="Chọn kế hoạch"
                                isClearable
                                styles={customSelectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => openAddOptionModal('keHoach')}
                            className="px-2 py-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <div className="text-xs bg-blue-100 text-blue-600 py-0.5 px-1 rounded mb-1 inline-block">
                        NGƯỜI GIAO VIỆC *
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="flex-grow">
                            <Select
                                id="nguoiGiaoViec"
                                name="nguoiGiaoViec"
                                value={selectOptions.nguoiGiaoViec.find(option => option.value === formData.nguoiGiaoViec) || null}
                                onChange={(option) => handleSelectChange(option, { name: 'nguoiGiaoViec' })}
                                options={selectOptions.nguoiGiaoViec}
                                placeholder="Chọn người giao việc"
                                isClearable
                                styles={customSelectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => openAddOptionModal('nguoiGiaoViec')}
                            className="px-2 py-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div>
                    <div className="text-xs bg-gray-100 text-gray-600 py-0.5 px-1 rounded mb-1 inline-block">
                        GIÁM SÁT
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="flex-grow">
                            <Select
                                id="giamSat"
                                name="giamSat"
                                value={selectOptions.giamSat.find(option => option.value === formData.giamSat) || null}
                                onChange={(option) => handleSelectChange(option, { name: 'giamSat' })}
                                options={selectOptions.giamSat}
                                placeholder="Chọn giám sát"
                                isClearable
                                styles={customSelectStyles}
                                className="react-select-container"
                                classNamePrefix="react-select"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => openAddOptionModal('giamSat')}
                            className="px-2 py-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                    <div className="text-xs bg-gray-100 text-gray-600 py-0.5 px-1 rounded mb-1 inline-block">
                        TỔNG BỘ CHIA
                    </div>
                    <input
                        type="number"
                        id="tongBoChua"
                        name="tongBoChua"
                        value={formData.tongBoChua}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <div className="text-xs bg-gray-100 text-gray-600 py-0.5 px-1 rounded mb-1 inline-block">
                        TỔNG TỦ/ODF/TẬP ĐIỂM
                    </div>
                    <input
                        type="number"
                        id="tongTuODFTapDiem"
                        name="tongTuODFTapDiem"
                        value={formData.tongTuODFTapDiem}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <div className="text-xs bg-gray-100 text-gray-600 py-0.5 px-1 rounded mb-1 inline-block">
                        DỰ TOÁN CORE
                    </div>
                    <input
                        type="number"
                        id="duToanCore"
                        name="duToanCore"
                        value={formData.duToanCore}
                        onChange={handleInputChange}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            {/* BCGS Section */}
            <div className="mt-4 mb-2 flex justify-between items-center">
                <h2 className="text-sm font-medium text-gray-700">Thông tin BCGS</h2>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={copyBCGSToClipboard}
                        disabled={loadingButtons.copyBCGS}
                        className={`px-2 py-1 ${loadingButtons.copyBCGS ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'} text-white text-sm rounded-md flex items-center`}
                    >
                        {loadingButtons.copyBCGS ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang sao chép...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Sao chép
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={addBcsgRow}
                        className="px-2 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Thêm BCGS
                    </button>
                </div>
            </div>

            <div className="border border-gray-200 rounded-md">
                <div >
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-blue-50">
                                <th className="px-2 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Tuyến cáp</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Điểm đầu</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Điểm cuối</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Loại cáp</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Dự toán</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-blue-700 uppercase tracking-wider w-16">Xóa</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bcsgRows.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-1 py-1">
                                        <input
                                            type="text"
                                            value={row.tuyenCap}
                                            onChange={(e) => handleBcsgChange(index, 'tuyenCap', e.target.value)}
                                            className="border border-gray-300 px-2 py-1 rounded-md w-full text-sm"
                                            required
                                            placeholder="Tuyến cáp"
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input
                                            type="text"
                                            value={row.diemDau}
                                            onChange={(e) => handleBcsgChange(index, 'diemDau', e.target.value)}
                                            className="border border-gray-300 px-2 py-1 rounded-md w-full text-sm"
                                            required
                                            placeholder="Điểm đầu"
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input
                                            type="text"
                                            value={row.diemCuoi}
                                            onChange={(e) => handleBcsgChange(index, 'diemCuoi', e.target.value)}
                                            className="border border-gray-300 px-2 py-1 rounded-md w-full text-sm"
                                            required
                                            placeholder="Điểm cuối"
                                        />
                                    </td>

                                    <td className="px-1 py-1" style={{ position: 'relative' }}>
                                        <Select
                                            value={row.loaiCap ? { value: row.loaiCap, label: row.loaiCap } : null}
                                            onChange={(option) => handleBcsgChange(index, 'loaiCap', option ? option.value : '')}
                                            options={[
                                                {
                                                    label: 'Cáp treo', options: [
                                                        { value: '04FO', label: '04FO' },
                                                        { value: '08FO', label: '08FO' },
                                                        { value: '12FO', label: '12FO' },
                                                        { value: '16FO', label: '16FO' },
                                                        { value: '24FO', label: '24FO' },
                                                        { value: '48FO', label: '48FO' },
                                                        { value: '96FO', label: '96FO' },
                                                        { value: '144FO', label: '144FO' }
                                                    ]
                                                },
                                                {
                                                    label: 'Cáp ngầm', options: [
                                                        { value: '04DU', label: '04DU' },
                                                        { value: '06DU', label: '06DU' },
                                                        { value: '08DU', label: '08DU' },
                                                        { value: '12DU', label: '12DU' },
                                                        { value: '16DU', label: '16DU' },
                                                        { value: '24DU', label: '24DU' },
                                                        { value: '48DU', label: '48DU' },
                                                        { value: '96DU', label: '96DU' },
                                                        { value: '144DU', label: '144DU' }
                                                    ]
                                                },
                                                {
                                                    label: 'Cáp Mipan', options: [
                                                        { value: '04FM', label: '04FM' },
                                                        { value: '08FM', label: '08FM' },
                                                        { value: '12FM', label: '12FM' },
                                                        { value: '16FM', label: '16FM' },
                                                        { value: '24FM', label: '24FM' }
                                                    ]
                                                },
                                                {
                                                    label: 'Cáp khác', options: [
                                                        { value: '24ADSS', label: '24ADSS' }
                                                    ]
                                                }
                                            ]}
                                            placeholder="Chọn loại cáp"
                                            className="react-select-container"
                                            classNamePrefix="react-select"
                                            menuPosition="fixed"
                                            menuPortalTarget={document.body}
                                            menuPlacement="auto"
                                            styles={{
                                                ...customSelectStyles,
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: '32px',
                                                    height: '32px'
                                                }),
                                                indicatorsContainer: (base) => ({
                                                    ...base,
                                                    height: '32px'
                                                }),
                                                menuPortal: (base) => ({
                                                    ...base,
                                                    zIndex: 99999 // Tăng z-index cao hơn
                                                }),
                                                menu: (base) => ({
                                                    ...base,
                                                    zIndex: 99999
                                                })
                                            }}
                                        />
                                    </td>
                                    <td className="px-1 py-1">
                                        <input
                                            type="number"
                                            value={row.duToan}
                                            onChange={(e) => handleBcsgChange(index, 'duToan', e.target.value)}
                                            className="border border-gray-300 px-2 py-1 rounded-md w-full text-sm"
                                            required
                                            placeholder="Dự toán"
                                        />
                                    </td>
                                    <td className="px-1 py-1 text-center">
                                        <button
                                            onClick={() => removeBcsgRow(index)}
                                            className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                            title="Xóa dòng"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default KeHoachForm;