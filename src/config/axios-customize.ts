import { IBackendRes } from "@/types/backend";
import { Mutex } from "async-mutex";
import axios from "axios";
import { store } from "@/redux/store";
import { setRefreshTokenAction } from "@/redux/slice/accountSlide";

interface AccessTokenResponse {
    access_token: string;
}

/**
 * Creates an initial 'axios' instance with custom settings.
 */

const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const instance = axios.create({
    baseURL: baseUrl,
    withCredentials: true
});

const mutex = new Mutex();
const NO_RETRY_HEADER = 'x-no-retry';

const handleRefreshToken = async (): Promise<string | null> => {
    return await mutex.runExclusive(async () => {
        const res = await instance.get<IBackendRes<AccessTokenResponse>>('/api/v1/auth/refresh');
        if (res && res.data) return res.data.access_token;
        else return null;
    });
};

// Add a request interceptor
instance.interceptors.request.use(function (config) {
    // Get token from localStorage
    const access_token = localStorage.getItem('access_token');
    
    // If token exists, add it to the headers
    if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
    }
    
    return config;
}, function (error) {
    return Promise.reject(error);
});

/**
 * Handle all responses. It is possible to add handlers
 * for requests, but it is omitted here for brevity.
 */
instance.interceptors.response.use(
    (res) => res.data,
    async (error) => {
        if (error.config && error.response
            && +error.response.status === 401
            && error.config.url !== '/api/v1/auth/login'
            && !error.config.headers[NO_RETRY_HEADER]
        ) {
            const access_token = await handleRefreshToken();
            error.config.headers[NO_RETRY_HEADER] = 'true'
            if (access_token) {
                error.config.headers['Authorization'] = `Bearer ${access_token}`;
                localStorage.setItem('access_token', access_token)
                return instance.request(error.config);
            }
        }

        if (
            error.config && error.response
            && +error.response.status === 400
            && error.config.url === '/api/v1/auth/refresh'
            && location.pathname.startsWith("/admin")
        ) {
            const message = error?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng login.";
            //dispatch redux action
            store.dispatch(setRefreshTokenAction({ status: true, message }));
        }

        return error?.response?.data ?? Promise.reject(error);
    }
);

// Add a response interceptor
instance.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    // Handle 401 Unauthorized error
    if (error.response && error.response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});

/**
 * Replaces main `axios` instance with the custom-one.
 *
 * @param cfg - Axios configuration object.
 * @returns A promise object of a response of the HTTP request with the 'data' object already
 * destructured.
 */
// const axios = <T>(cfg: AxiosRequestConfig) => instance.request<any, T>(cfg);

// export default axios;

export default instance;