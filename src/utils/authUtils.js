// src/utils/authUtils.js
import config from '../config/config';

class AuthUtils {
    async apiRequest(tableName, action, data, select = {}) {
        try {
            const response = await fetch(`${config.API_URL}/${tableName}/Action`, {
                method: 'POST',
                headers: {
                    'ApplicationAccessKey': config.ACCESS_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Action: action,

                    select,
                    ...data
                })
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    async apiRequestHSHC(tableName, action, Properties = {}, data) {
        const apiUrl = `https://www.appsheet.com/api/v2/apps/8df0bddc-26ed-4635-933d-c3b27ea34209/tables/${tableName}/Action`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'ApplicationAccessKey': 'V2-Vlggt-v63lj-pVJ48-cWTVr-RzWot-ppy1m-PUNEg-SKZQb',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Action: action,
                    Properties: {
                        Locale: 'vi-VN',
                        Timezone: 'Asia/Ho_Chi_Minh',
                        ...Properties
                    },
                    ...data
                })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            // Check if response is empty
            const text = await response.text();
            if (!text) {
                return {}; // Return empty object if response is empty
            }
            
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Error parsing JSON response:', e);
                return {}; // Return empty object if parsing fails
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    async apiRequestThuChi(tableName, action, data, select = {}) {
        const apiUrl = `https://www.appsheet.com/api/v2/apps/1a8d9270-a4ff-46b8-94fc-db1e4632f273/tables/${tableName}/Action`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'ApplicationAccessKey': 'V2-IEkJl-GKXgi-aBjtl-fN3Ur-QQSYX-Ggn6e-m9pkA-GtxEU',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Action: action,

                    select,
                    ...data
                })
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    async apiRequestErp(tableName, action, Properties = {}, data) {
        const apiUrl = `https://www.appsheet.com/api/v2/apps/509dd5b5-bc8b-4962-8122-bbc6d3cf3f55/tables/${tableName}/Action`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'ApplicationAccessKey': 'V2-eztny-HRi4G-gHO8S-0N0TN-J3PSa-lKZ5q-7mlUT-oAnS2',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Action: action,
                    Properties: {
                        Locale: 'vi-VN',
                        Timezone: 'Asia/Ho_Chi_Minh',
                        ...Properties
                    },
                    ...data
                })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            // Check if response is empty
            const text = await response.text();
            if (!text) {
                return {}; // Return empty object if response is empty
            }
            
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Error parsing JSON response:', e);
                return {}; // Return empty object if parsing fails
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async apiRequestChamcong(tableName, action, data, select = {}) {
        try {
            const response = await fetch(`${config.API_URL_Chamcong}/${tableName}/Action`, {
                method: 'POST',
                headers: {
                    'ApplicationAccessKey': config.ACCESS_KEY_Chamcong,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Action: action,

                    select,
                    ...data
                })
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    saveReturnUrl(url) {
        if (url && !url.includes('/login')) {
            localStorage.setItem('returnUrl', url);
        }
    }
    getAndClearReturnUrl() {
        const returnUrl = localStorage.getItem('returnUrl');
        localStorage.removeItem('returnUrl');
        return returnUrl || config.ROUTES.DASHBOARD;
    }
    saveAuthData(userData) {
        const now = new Date();
        const expiryTime = new Date(now.getTime() + config.AUTH.TOKEN_DURATION);

        localStorage.setItem(config.AUTH.TOKEN_KEY, 'Bearer ' + Math.random().toString(36).substring(7));
        localStorage.setItem(config.AUTH.USER_DATA_KEY, JSON.stringify(userData));
        localStorage.setItem(config.AUTH.TOKEN_EXPIRY_KEY, expiryTime.toISOString());
    }

    getUserData() {
        const userData = localStorage.getItem(config.AUTH.USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    isAuthenticated(currentPath) {
        const token = localStorage.getItem(config.AUTH.TOKEN_KEY);
        const expiryTime = localStorage.getItem(config.AUTH.TOKEN_EXPIRY_KEY);
        const userData = localStorage.getItem(config.AUTH.USER_DATA_KEY);

        if (!token || !expiryTime || !userData) {
            if (currentPath) {
                this.saveReturnUrl(currentPath);
            }
            return false;
        }

        if (new Date() > new Date(expiryTime)) {
            this.clearAuthData();
            if (currentPath) {
                this.saveReturnUrl(currentPath);
            }
            return false;
        }

        return true;
    }


    clearAuthData() {
        localStorage.removeItem(config.AUTH.TOKEN_KEY);
        localStorage.removeItem(config.AUTH.USER_DATA_KEY);
        localStorage.removeItem(config.AUTH.TOKEN_EXPIRY_KEY);
        localStorage.removeItem('returnUrl');
    }

    async login(username, password) {
        if (!username || !password) {
            throw new Error('Vui lòng nhập đầy đủ thông tin đăng nhập!');
        }

        const result = await this.apiRequest('DSNV', 'Find', {
            Properties: {
                Selector: `Filter(DSNV, and( [username] = "${username}" , [password] = "${password}"))`
            }
        });

        if (result && Array.isArray(result) && result.length === 1) {
            const user = result[0];
            if (user.password === password) {
                this.saveAuthData(user);
                return user;
            }
        }
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng!');
    }

    logout() {
        this.clearAuthData();
        return config.ROUTES.LOGIN;
    }
    async uploadImage(file) {
        // Validate file
        if (!file) {
            throw new Error('Không tìm thấy file');
        }

        if (file.size > config.UPLOAD.MAX_SIZE) {
            throw new Error(`Kích thước file không được vượt quá ${config.UPLOAD.MAX_SIZE / 1024 / 1024}MB`);
        }

        if (!config.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
            throw new Error('Định dạng file không được hỗ trợ');
        }

        try {
            // Convert file to base64 if needed
            const base64Image = await this.getImageAsBase64(file);

            // Cloudinary configuration
            const CLOUDINARY_CLOUD_NAME = config.CLOUD_NAME || 'duv9pccwi';
            const CLOUDINARY_UPLOAD_PRESET = config.UPLOAD_PRESET || 'poalupload';

            // Prepare form data
            const formData = new FormData();
            formData.append('file', base64Image);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            // Make request to Cloudinary
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error('Upload failed: ' + response.statusText);
            }

            const data = await response.json();

            if (!data.secure_url) {
                throw new Error('Invalid response from Cloudinary');
            }

            return {
                success: true,
                url: data.secure_url,
                public_id: data.public_id,
                metadata: {
                    name: data.original_filename,
                    size: data.bytes,
                    format: data.format,
                    width: data.width,
                    height: data.height
                }
            };
        } catch (error) {
            console.error('Image upload failed:', error);
            throw new Error('Không thể tải ảnh lên: ' + error.message);
        }
    }

    async getImageAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    validateImage(file) {
        const errors = [];

        if (!file) {
            errors.push('Không tìm thấy file');
        }

        if (file.size > config.UPLOAD.MAX_SIZE) {
            errors.push(`Kích thước file không được vượt quá ${config.UPLOAD.MAX_SIZE / 1024 / 1024}MB`);
        }

        if (!config.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
            errors.push('Định dạng file không được hỗ trợ');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default new AuthUtils();