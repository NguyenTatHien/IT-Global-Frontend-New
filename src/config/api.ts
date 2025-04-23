import { IBackendRes, IAccount, IUser, IModelPaginate, IGetAccount, IPermission, IRole, IAttendanceData } from '@/types/backend';
import axios from 'config/axios-customize';
import axiosClient from 'config/axios-customize';

/**
 * 
Module Auth
 */
export const callRegister = (name: string, email: string, password: string, age: number, gender: string, address: string, file: File) => {
    const formData = new FormData();

    // Append all fields to FormData
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('age', age.toString());
    formData.append('gender', gender);
    formData.append('address', address);
    formData.append('image', file);

    return axios.post<IBackendRes<IUser>>('/api/v1/auth/register', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

export const callLogin = (username: string, password: string) => {
    return axios.post<IBackendRes<IAccount>>('/api/v1/auth/login1', { username, password })
}

interface ILoginResponseData {
    message: any;
    data: any;
    access_token: string;
    user: {
        _id: string;
        name: string;
        email: string;
        role: {
            _id: string;
            name: string;
            permissions?: string[];
        };
    };
}

interface ILoginResponse {
    statusCode: number;
    message: string;
    data: ILoginResponseData;
}

export const callLoginWithFaceId = async (fileDescriptor: File) => {
    const MAX_RETRIES = 2;
    const TIMEOUT = 30000; // 30 seconds
    const RETRY_DELAY = 2000; // 2 seconds
    let retryCount = 0;

    const attemptLogin = async () => {
        try {
            // Validate input
            if (!fileDescriptor) {
                throw new Error('File ảnh là bắt buộc');
            }

            if (!(fileDescriptor instanceof File)) {
                throw new Error('File không hợp lệ');
            }

            const formData = new FormData();
            formData.append('image', fileDescriptor);

            // Make API call with proper error handling
            const response = await axios.post<ILoginResponse>(
                '/api/v1/auth/login',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: TIMEOUT,
                    validateStatus: (status) => {
                        return status >= 200 && status < 500; // Handle only client errors
                    }
                }
            );

            // Check for specific error messages in response
            if (response.data?.message?.includes('Invalid response format') || 
                response.data?.message?.includes('không hợp lệ')) {
                throw new Error('Không thể xác thực khuôn mặt. Vui lòng thử lại với ánh sáng tốt hơn.');
            }

            // Validate response structure
            if (!response.data?.data?.access_token) {
                throw new Error('Không thể xác thực. Vui lòng đảm bảo khuôn mặt rõ ràng và thử lại.');
            }

            return response.data;

        } catch (error: any) {
            // Log error details
            console.error('Login error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                attempt: retryCount + 1
            });

            // Handle specific error cases
            if (error.code === 'ECONNABORTED') {
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    return attemptLogin();
                }
                throw new Error('Kết nối đến server quá lâu. Vui lòng thử lại sau.');
            }

            // If there's a response from server, use its message
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            throw error;
        }
    };

    return attemptLogin();
};

export const callScanFace = async (formData: FormData) => {
    return axios.post('/api/v1/face-recognition/scan', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const callFetchAccount = () => {
    return axios.get<IBackendRes<IGetAccount>>('/api/v1/auth/account')
}

export const callRefreshToken = () => {
    return axios.get<IBackendRes<IAccount>>('/api/v1/auth/refresh')
}

export const callLogout = () => {
    return axios.post<IBackendRes<string>>('/api/v1/auth/logout')
}

/**
 * Upload single file
 */
export const callUploadSingleFile = (file: File, folderType: string) => {
    const bodyFormData = new FormData();
    bodyFormData.append('image', file);
    return axios<IBackendRes<{ fileName: string }>>({
        method: 'post',
        url: '/api/v1/files/upload',
        data: bodyFormData,
        headers: {
            "Content-Type": "multipart/form-data",
            "folder_type": folderType
        },
    });
}

/**
 * 
Module User
 */
export const callCreateUser = (user: IUser, file: File) => {
    const formData = new FormData();
    formData.append("name", user.name);
    formData.append("email", user.email);
    formData.append("password", user.password || "");
    formData.append("age", user.age.toString());
    formData.append("gender", user.gender);
    formData.append("address", user.address);
    formData.append("role", user.role as any);
    formData.append("image", file);

    return axios.post<IBackendRes<IUser>>("/api/v1/users", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const callUpdateUser = (id: string, user: any, file?: File) => {
    const formData = new FormData();

    // Thêm các trường cần cập nhật vào FormData
    for (const key in user) {
        if (user.hasOwnProperty(key) && user[key] !== undefined) {
            formData.append(key, user[key] as string);
        }
    }

    // Nếu có file, thêm file vào FormData
    if (file) {
        formData.append("image", file); // Gửi file ảnh với key 'image'
    }

    return axios.patch<IBackendRes<IUser>>(`/api/v1/users/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const callDeleteUser = (id: string) => {
    return axios.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
}

export const callFetchUser = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`)
}

export const callCreatePermission = (permission: IPermission) => {
    return axios.post<IBackendRes<IPermission>>('/api/v1/permissions', permission)
}

export const callUpdatePermission = (permission: IPermission, id: string) => {
    return axios.patch<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`, permission)
}

export const callDeletePermission = (id: string) => {
    return axios.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`)
}

export const callFetchPermission = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${query}`)
}

export const callFetchPermissionById = (id: string) => {
    return axios.get<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`)
}

export const callCreateRole = (role: IRole) => {
    return axios.post<IBackendRes<IRole>>('/api/v1/roles', role)
}

export const callUpdateRole = (role: IRole, id: string) => {
    return axios.patch<IBackendRes<IRole>>(`/api/v1/roles/${id}`, role)
}

export const callDeleteRole = (id: string) => {
    return axios.delete<IBackendRes<IRole>>(`/api/v1/roles/${id}`)
}

export const callFetchRole = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IRole>>>(`/api/v1/roles?${query}`)
}

export const callFetchRoleById = (id: string) => {
    return axios.get<IBackendRes<IRole>>(`/api/v1/roles/${id}`)
}

export const callCreateShift = (data: any) => {
    return axios.post<IBackendRes<any>>('/api/v1/shifts', data);
}

export const callGetShifts = (query: string = '') => {
    return axios.get<IBackendRes<IModelPaginate<any>>>(`/api/v1/shifts?${query}`);
}

export const callUpdateShift = (id: string, data: any) => {
    return axios.patch<IBackendRes<any>>(`/api/v1/shifts/${id}`, data);
}

export const callDeleteShift = (id: string) => {
    return axios.delete<IBackendRes<any>>(`/api/v1/shifts/${id}`);
}

export const callCreateUserShift = (data: any) => {
    return axios.post<IBackendRes<any>>('/api/v1/user-shifts', data);
}

export const callGetUserShifts = (query: string) => {
    return axios.get(`/api/v1/user-shifts?${query}`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
    });
}

export const callGetMyShifts = () => {
    return axios.get('/api/v1/user-shifts/my-shifts');
}

export const callGetUserShiftById = async (id: string) => {
    try {
        const res = await axios.get(`/api/v1/user-shifts/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        return res;
    } catch (error) {
        console.error('Error fetching user shift by id:', error);
        throw error;
    }
};

export const callUpdateUserShift = (id: string, data: any) => {
    return axios.patch<IBackendRes<any>>(`/api/v1/user-shifts/${id}`, data);
}

export const callDeleteUserShift = (id: string) => {
    return axios.delete<IBackendRes<any>>(`/api/v1/user-shifts/${id}`);
}

export const callGetUsers = (query: string = '') => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
}

interface IAttendanceResponse {
    _id: string;
    checkInTime: string;
    checkOutTime?: string;
    status: 'on-time' | 'late' | 'early';
    lateMinutes?: number;
    earlyMinutes?: number;
    totalHours?: number;
    overtimeHours?: number;
    userShiftId: {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
    };
}

export const callCheckIn = (data: { location?: { latitude: number; longitude: number } }) => {
    return axios.post<IBackendRes<IAttendanceResponse>>('/api/v1/attendance/check-in', data);
}

export const callCheckOut = () => {
    return axios.post<IBackendRes<IAttendanceResponse>>('/api/v1/attendance/check-out');
}

export const callGetTodayAttendance = () => {
    return axios.get<IBackendRes<IAttendanceResponse>>('/api/v1/attendance/today');
}

export const callGetMyAttendance = (query: string) => {
    return axios.get<IBackendRes<IAttendanceData>>(`/api/v1/attendance/my-attendance?${query}`);
}

export const callGetProfile = () => {
    return axios.get<IBackendRes<IUser>>('/api/v1/users/profile/me');
}