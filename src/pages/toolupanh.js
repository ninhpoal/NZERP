import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createWorker } from 'tesseract.js';

const ImageSlicer = () => {
    const [files, setFiles] = useState([]);
    const [dragOver, setDragOver] = useState(false);
    const [customNames, setCustomNames] = useState({});
    const [zipName, setZipName] = useState('hinh_anh_cua_toi');
    const [filePrefix, setFilePrefix] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const fileInputRef = useRef(null);
    const nameInputRefs = useRef({});

    // Create refs for all filename inputs
    useEffect(() => {
        files.forEach(fileObj => {
            if (!nameInputRefs.current[fileObj.id]) {
                nameInputRefs.current[fileObj.id] = React.createRef();
            }
        });
    }, [files]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );
        addFiles(droppedFiles);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files).filter(file =>
            file.type.startsWith('image/')
        );
        addFiles(selectedFiles);
    };

    const addFiles = (newFiles) => {
        const filesWithPreview = newFiles.map(file => ({
            file,
            id: Date.now() + Math.random().toString(36).substring(2),
            previewUrl: URL.createObjectURL(file)
        }));

        setFiles(prevFiles => {
            const updatedFiles = [...prevFiles, ...filesWithPreview];
            if (prevFiles.length === 0 && updatedFiles.length > 0) {
                setCurrentIndex(0);
            }
            return updatedFiles;
        });

        // Initialize with empty names instead of base filenames
        const newCustomNames = { ...customNames };
        filesWithPreview.forEach((fileObj) => {
            newCustomNames[fileObj.id] = '';
        });

        setCustomNames(newCustomNames);
    };

    const performOCR = async (fileObj) => {
        setIsProcessing(true);
        setOcrProgress(0);

        try {
            const worker = await createWorker({
                logger: progress => {
                    if (progress.status === 'recognizing text') {
                        setOcrProgress(parseInt(progress.progress * 100));
                    }
                }
            });

            await worker.load();
            await worker.loadLanguage('vie+eng');
            await worker.initialize('vie+eng');

            const { data } = await worker.recognize(fileObj.previewUrl);
            const text = data.text;

            await worker.terminate();

            let extractedName = text.split('\n')[0] || text;
            extractedName = extractedName.trim();

            extractedName = extractedName
                .substring(0, 30)
                .replace(/[^a-zA-Z0-9À-ỹ\s]/g, '')
                .trim();

            if (extractedName) {
                setCustomNames(prev => ({
                    ...prev,
                    [fileObj.id]: extractedName
                }));
                return extractedName;
            }

            return null;
        } catch (error) {
            console.error('OCR error:', error);
            return null;
        } finally {
            setIsProcessing(false);
            setOcrProgress(0);
        }
    };

    const processCurrentImageWithOCR = async () => {
        if (!currentFile) return;

        const extractedName = await performOCR(currentFile);
        if (extractedName) {
            alert(`Đã quét OCR thành công! Tên được đề xuất: "${extractedName}"`);
        } else {
            alert('Không thể trích xuất văn bản từ hình ảnh này.');
        }
    };

    const processAllImagesWithOCR = async () => {
        if (files.length === 0) {
            alert('Vui lòng tải lên ít nhất một hình ảnh.');
            return;
        }

        setIsProcessing(true);

        for (let i = 0; i < files.length; i++) {
            setCurrentIndex(i);
            await performOCR(files[i]);
        }

        setIsProcessing(false);
        alert('Đã quét OCR xong tất cả hình ảnh!');
    };

    const handleCustomNameChange = (id, newName) => {
        setCustomNames({
            ...customNames,
            [id]: newName
        });
    };

    const removeFile = (fileObj) => {
        URL.revokeObjectURL(fileObj.previewUrl);

        setFiles(files.filter(f => f.id !== fileObj.id));

        const updatedNames = { ...customNames };
        delete updatedNames[fileObj.id];
        setCustomNames(updatedNames);

        // Also clean up the ref
        delete nameInputRefs.current[fileObj.id];

        if (files.length <= 1) {
            setCurrentIndex(0);
        } else if (currentIndex >= files.length - 1) {
            setCurrentIndex(files.length - 2);
        }
    };

    const downloadAsZip = async () => {
        if (files.length === 0) {
            alert('Vui lòng tải lên ít nhất một hình ảnh.');
            return;
        }

        const zip = new JSZip();

        for (const fileObj of files) {
            const file = fileObj.file;
            const customName = customNames[fileObj.id] || '';
            const ext = file.name.split('.').pop();
            
            // Add prefix to custom name
            const finalFileName = customName 
                ? `${filePrefix ? filePrefix + '_' : ''}${customName}.${ext}`
                : `${filePrefix ? filePrefix + '_' : ''}image_${fileObj.id.substring(0, 8)}.${ext}`;
                
            const fileData = await file.arrayBuffer();
            zip.file(finalFileName, fileData);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${zipName || 'hinh_anh_cua_toi'}.zip`);
    };

    const clearAllFiles = () => {
        files.forEach(fileObj => {
            URL.revokeObjectURL(fileObj.previewUrl);
        });

        setFiles([]);
        setCustomNames({});
        setCurrentIndex(0);
        nameInputRefs.current = {};
    };

    const goToNextImage = () => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goToPrevImage = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Handle tab navigation between images
    const handleKeyDown = (e, index) => {
        if (isProcessing) return;

        if (e.key === 'Tab') {
            e.preventDefault();
            
            if (e.shiftKey) {
                // Shift+Tab: go to previous image
                if (index > 0) {
                    setCurrentIndex(index - 1);
                    setTimeout(() => {
                        const prevFileId = files[index - 1].id;
                        if (nameInputRefs.current[prevFileId] && nameInputRefs.current[prevFileId].current) {
                            nameInputRefs.current[prevFileId].current.focus();
                        }
                    }, 50);
                }
            } else {
                // Tab: go to next image
                if (index < files.length - 1) {
                    setCurrentIndex(index + 1);
                    setTimeout(() => {
                        const nextFileId = files[index + 1].id;
                        if (nameInputRefs.current[nextFileId] && nameInputRefs.current[nextFileId].current) {
                            nameInputRefs.current[nextFileId].current.focus();
                        }
                    }, 50);
                }
            }
        }
    };

    const currentFile = files.length > 0 ? files[currentIndex] : null;

    const getFileDetails = (fileObj) => {
        if (!fileObj || !fileObj.file) return { name: '', size: 0, date: '' };

        const file = fileObj.file;
        return {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            date: new Date().toLocaleDateString('vi-VN')
        };
    };

    const currentFileDetails = currentFile ? getFileDetails(currentFile) : null;

    return (
        <div className="mx-auto p-4 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">Bộ xử lý ảnh với OCR</h1>

                {/* File naming settings */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ZIP name input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên file ZIP:
                        </label>
                        <input
                            type="text"
                            value={zipName}
                            onChange={(e) => setZipName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Nhập tên cho file ZIP"
                        />
                    </div>
                    
                    {/* File prefix input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tiền tố cho tên file:
                        </label>
                        <input
                            type="text"
                            value={filePrefix}
                            onChange={(e) => setFilePrefix(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="Ví dụ: tento"
                        />
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <p className="text-blue-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                                <strong>Mẹo:</strong> Nhấn <kbd className="bg-blue-100 px-1 py-0.5 rounded mx-1">Tab</kbd> để chuyển sang hình tiếp theo, 
                                <kbd className="bg-blue-100 px-1 py-0.5 rounded mx-1">Shift+Tab</kbd> để quay lại hình trước.
                            </span>
                        </p>
                    </div>
                )}

                {/* Main content */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left side - Image viewer */}
                    <div className="flex-1">
                        {currentFile ? (
                            <div className="relative border rounded-xl overflow-hidden bg-[#fffff] h-[620px] shadow-md">
                                {/* Image viewer */}
                                <img
                                    src={currentFile.previewUrl}
                                    alt={currentFile.file.name}
                                    className="w-full h-full object-contain"
                                />

                                {/* Navigation arrows */}
                                <div className="absolute inset-0 flex items-center justify-between px-4">
                                    <button
                                        onClick={goToPrevImage}
                                        disabled={currentIndex === 0 || isProcessing}
                                        className={`p-3 rounded-full bg-black/40 text-white transform transition-all ${currentIndex === 0 || isProcessing ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/60 hover:scale-105'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={goToNextImage}
                                        disabled={currentIndex === files.length - 1 || isProcessing}
                                        className={`p-3 rounded-full bg-black/40 text-white transform transition-all ${currentIndex === files.length - 1 || isProcessing ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/60 hover:scale-105'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* OCR Processing overlay */}
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                                        <div className="text-white mb-3">Đang quét OCR...</div>
                                        <div className="w-64 h-3 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-300"
                                                style={{ width: `${ocrProgress}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-white mt-2">{ocrProgress}%</div>
                                    </div>
                                )}

                                {/* Progress indicator */}
                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex justify-center bg-black/50 backdrop-blur-sm text-white py-1 px-3 rounded-full text-sm font-medium">
                                    {files.length > 0 ? `${currentIndex + 1} / ${files.length}` : '0 / 0'}
                                </div>
                            </div>
                        ) : (
                            <div
                                className={`border-3 border-dashed rounded-xl flex items-center justify-center h-[500px] transition-all cursor-pointer ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                                    }`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <div className="text-center p-6">
                                    <div className="w-20 h-20 mx-auto mb-4 text-indigo-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                        </svg>
                                    </div>
                                    <p className="text-xl font-semibold text-gray-800 mb-2">
                                        Kéo và thả hình ảnh vào đây
                                    </p>
                                    <p className="text-gray-600 mb-4">
                                        hoặc nhấp để chọn từ máy tính
                                    </p>
                                    <button className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all font-medium">
                                        Chọn hình ảnh
                                    </button>
                                </div>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Right side - Controls and thumbnails */}
                    <div className="lg:w-1/3 flex flex-col">
                        {/* Image details and controls */}
                        {currentFile && (
                            <div className="border rounded-xl p-5 mb-5 bg-gray-50 shadow-sm">
                                <h3 className="font-medium mb-3 text-gray-800 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Thông tin hình ảnh
                                </h3>

                                <div className="mb-4 bg-white p-3 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Tên gốc:</span> {currentFileDetails.name}</p>
                                    <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Kích thước:</span> {currentFileDetails.size}</p>
                                    <p className="text-sm text-gray-700"><span className="font-medium">Ngày:</span> {currentFileDetails.date}</p>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên cho hình ảnh (không gồm tiền tố và đuôi file):
                                    </label>
                                    <input
                                        ref={nameInputRefs.current[currentFile.id]}
                                        type="text"
                                        value={customNames[currentFile.id] || ''}
                                        onChange={(e) => handleCustomNameChange(currentFile.id, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, currentIndex)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nhập tên cho hình ảnh"
                                        autoFocus={currentIndex === 0}
                                    />
                                    {filePrefix && (
                                        <p className="mt-2 text-sm text-gray-600">
                                            Tên file sẽ là: <span className="font-medium">{filePrefix}_{customNames[currentFile.id] || '[tên file]'}.{currentFile.file.name.split('.').pop()}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Nút OCR cho hình ảnh hiện tại */}
                                <button
                                    onClick={processCurrentImageWithOCR}
                                    disabled={isProcessing}
                                    className={`w-full mb-3 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${isProcessing
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Quét OCR hình ảnh này
                                </button>

                                <div className="flex items-center">
                                    <button
                                        onClick={() => removeFile(currentFile)}
                                        disabled={isProcessing}
                                        className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm rounded-lg font-medium transition-colors ${isProcessing
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Xóa hình ảnh
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Thumbnails */}
                        <div className="border rounded-xl p-4 flex-1 overflow-y-auto max-h-[300px] shadow-sm bg-white">
                            <h3 className="font-medium mb-3 text-gray-800 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Danh sách hình ảnh
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {files.length}
                                </span>
                            </h3>

                            <div className="grid grid-cols-3 gap-3">
                                {files.map((fileObj, index) => (
                                    <div
                                        key={fileObj.id}
                                        className={`relative border rounded-lg overflow-hidden cursor-pointer h-24 group transition-all ${index === currentIndex
                                            ? 'ring-2 ring-indigo-500 shadow-md scale-105 z-10'
                                            : 'hover:shadow-md hover:scale-105'
                                            }`}
                                        onClick={() => !isProcessing && setCurrentIndex(index)}
                                    >
                                        <img
                                            src={fileObj.previewUrl}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all"></div>
                                        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs rounded px-1.5 py-0.5">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {files.length === 0 && (
                                <div className="text-gray-500 text-center py-8">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm font-medium">
                                        Chưa có hình ảnh nào được tải lên
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-5 space-y-3">
                            {/* Nút OCR cho tất cả */}
                            <button
                                onClick={processAllImagesWithOCR}
                                disabled={isProcessing || files.length === 0}
                                className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${isProcessing || files.length === 0
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Quét OCR tất cả hình ảnh
                            </button>

                            <button
                                onClick={downloadAsZip}
                                disabled={files.length === 0 || isProcessing}
                                className={`w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${files.length === 0 || isProcessing
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Tải xuống dưới dạng ZIP
                           
                            </button>

                            <button
                                onClick={clearAllFiles}
                                disabled={files.length === 0 || isProcessing}
                                className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${files.length === 0 || isProcessing
                                        ? 'border border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'border border-red-200 text-red-600 hover:bg-red-50'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Xóa tất cả hình ảnh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center text-gray-500 text-sm mt-6">
                © 2025 Bộ xử lý ảnh OCR - Công cụ xử lý hình ảnh và quét văn bản miễn phí
            </div>
        </div>
    );
};

export default ImageSlicer;
