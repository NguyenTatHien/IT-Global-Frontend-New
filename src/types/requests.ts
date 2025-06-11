export enum LeaveType {
    ANNUAL = 'ANNUAL',
    SICK = 'SICK',
    PERSONAL = 'PERSONAL',
    MATERNITY = 'MATERNITY',
    BEREAVEMENT = 'BEREAVEMENT',
}

export enum RequestType {
    LATE = 'LATE',
    EARLY = 'EARLY',
}

export enum RequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export interface LeaveRequest {
    id: string;
    employee: {
        id: string;
        name: string;
    };
    startDate: string;
    endDate: string;
    leaveType: LeaveType;
    reason: string;
    status: RequestStatus;
    approvedBy?: {
        id: string;
        name: string;
    };
    approvedAt?: string;
    rejectionReason?: string;
}

export interface OvertimeRequest {
    id: string;
    employee: {
        id: string;
        name: string;
    };
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    status: RequestStatus;
    approvedBy?: {
        id: string;
        name: string;
    };
    approvedAt?: string;
    rejectionReason?: string;
    totalHours: number;
}

export interface LateEarlyRequest {
    id: string;
    employee: {
        id: string;
        name: string;
    };
    date: string;
    requestType: RequestType;
    time: string;
    reason: string;
    status: RequestStatus;
    approvedBy?: {
        id: string;
        name: string;
    };
    approvedAt?: string;
    rejectionReason?: string;
}

export interface RemoteWorkRequest {
    id: string;
    employee: {
        id: string;
        name: string;
    };
    startDate: string;
    endDate: string;
    workLocation: string;
    reason: string;
    workPlan: string;
    status: RequestStatus;
    approvedBy?: {
        id: string;
        name: string;
    };
    approvedAt?: string;
    rejectionReason?: string;
}

export interface ShiftChangeRequest {
    id: string;
    employee: {
        id: string;
        name: string;
    };
    date: string;
    currentShift: {
        id: string;
        name: string;
    };
    requestedShift: {
        id: string;
        name: string;
    };
    reason: string;
    status: RequestStatus;
    approvedBy?: {
        id: string;
        name: string;
    };
    approvedAt?: string;
    rejectionReason?: string;
} 