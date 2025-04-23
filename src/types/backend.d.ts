export interface IBackendRes<T> {
    error?: string | string[];
    message: string;
    statusCode: number | string;
    data?: T;
}

export interface IModelPaginate<T> {
    meta: {
        current: number;
        pageSize: number;
        pages: number;
        total: number;
    },
    result: T[]
}

export interface IAccount {
    access_token: string;
    user: {
        _id: string;
        email: string;
        name: string;
        company: string;
        image?: string;
        age?: number;
        gender?: 'MALE' | 'FEMALE' | 'OTHER';
        address?: string;
        employeeType?: 'OFFICIAL' | 'PROBATION';
        role: {
            _id: string;
            name: string;
        }
        faceDescriptor: number[];
        permissions: {
            _id: string;
            name: string;
            apiPath: string;
            method: string;
            module: string;
        }[];
        userShiftId?: IUserShift;
    }
}

export interface IGetAccount extends Omit<IAccount, "access_token"> { }

export interface ICompany {
    _id?: string;
    name?: string;
    address?: string;
    logo: string;
    description?: string;
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IUserShift {
    _id: string;
    name: string;
    startTime: string;
    endTime: string;
}

export interface IUser {
    _id?: string;
    email: string;
    name: string;
    password: string;
    age: number;
    gender: string;
    address: string;
    role: {
        _id: string;
        name: string;
    };
    permissions: {
        _id: string;
        name: string;
        apiPath: string;
        method: string;
        module: string;
    }[];
    userShiftId?: IUserShift;
    faceDescriptor?: number[];
    employeeType: 'official' | 'contract' | 'intern';
    age?: number;
    gender?: string;
    address?: string;
    createdAt?: string;
    updatedAt?: string;
    image?: string;
}

export interface IPermission {
    _id?: string;
    name?: string;
    apiPath?: string;
    method?: string;
    module?: string;

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;

}

export interface IRole {
    _id?: string;
    name: string;
    description: string;
    isActive: boolean;
    permissions: IPermission[] | string[];

    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ISubscribers {
    _id?: string;
    name?: string;
    email?: string;
    skills: string[];
    createdBy?: string;
    isDeleted?: boolean;
    deletedAt?: boolean | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface IAttendanceData {
    data: {
        meta: {
            current: number;
            pageSize: number;
            total: number;
        };
        result: Array<{
            _id: string;
            userId: string;
            checkInTime: string;
            checkOutTime?: string;
            status: 'on-time' | 'late' | 'early' | 'absent';
            totalHours: string;
            overtimeHours: number;
            lateMinutes: number;
            earlyMinutes: number;
            userShiftId: {
                _id: string;
                name: string;
                startTime: string;
                endTime: string;
                shiftId?: {
                    _id: string;
                    name: string;
                    startTime: string;
                    endTime: string;
                }
            } | null;
        }>;
    };
} 