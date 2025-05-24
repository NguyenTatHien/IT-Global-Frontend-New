export const ALL_PERMISSIONS = {
    PERMISSIONS: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/permissions', module: "PERMISSIONS" },
        CREATE: { method: "POST", apiPath: '/api/v1/permissions', module: "PERMISSIONS" },
        UPDATE: { method: "PATCH", apiPath: '/api/v1/permissions/:id', module: "PERMISSIONS" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/permissions/:id', module: "PERMISSIONS" },
    },
    ROLES: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/roles', module: "ROLES" },
        CREATE: { method: "POST", apiPath: '/api/v1/roles', module: "ROLES" },
        UPDATE: { method: "PATCH", apiPath: '/api/v1/roles/:id', module: "ROLES" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/roles/:id', module: "ROLES" },
    },
    USERS: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/users', module: "USERS" },
        CREATE: { method: "POST", apiPath: '/api/v1/users', module: "USERS" },
        UPDATE: { method: "PATCH", apiPath: '/api/v1/users/:id', module: "USERS" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/users/:id', module: "USERS" },
    },
    ATTENDANCE: {
        CHECK_IN: { method: "POST", apiPath: '/api/v1/attendance/check-in', module: "ATTENDANCE" },
        CHECK_OUT: { method: "POST", apiPath: '/api/v1/attendance/check-out', module: "ATTENDANCE" },
    },
    SHIFTS: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/shifts', module: "SHIFTS" },
        CREATE: { method: "POST", apiPath: '/api/v1/shifts', module: "SHIFTS" },
        UPDATE: { method: "PATCH", apiPath: '/api/v1/shifts/:id', module: "SHIFTS" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/shifts/:id', module: "SHIFTS" },
    },
    USER_SHIFTS: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/user-shifts', module: "USER_SHIFTS" },
        CREATE: { method: "POST", apiPath: '/api/v1/user-shifts', module: "USER_SHIFTS" },
        UPDATE: { method: "PATCH", apiPath: '/api/v1/user-shifts/:id', module: "USER_SHIFTS" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/user-shifts/:id', module: "USER_SHIFTS" },
    },
    REPORTS: {
        GET_PAGINATE: { method: "POST", apiPath: '/api/v1/reports', module: "REPORTS" },
    },
    LEAVE_REQUESTS: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/leave-requests', module: "LEAVE_REQUESTS" },
        CREATE: { method: "POST", apiPath: '/api/v1/leave-requests', module: "LEAVE_REQUESTS" },
        UPDATE: { method: "PATCH", apiPath: '/api/v1/leave-requests/:id', module: "LEAVE_REQUESTS" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/leave-requests/:id', module: "LEAVE_REQUESTS" },
    },
    PAYROLL: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/payroll', module: "PAYROLL" },
        CREATE: { method: "POST", apiPath: '/api/v1/payroll', module: "PAYROLL" },
        UPDATE: { method: "PATCH", apiPath: '/api/v1/payroll/:id', module: "PAYROLL" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/payroll/:id', module: "PAYROLL" },
    },
    DEPARTMENTS: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/departments', module: "DEPARTMENTS" },
        CREATE: { method: "POST", apiPath: '/api/v1/departments', module: "DEPARTMENTS" },
        UPDATE: { method: "PATCH", apiPath: '/api/v1/departments/:id', module: "DEPARTMENTS" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/departments/:id', module: "DEPARTMENTS" },
    },
    COMPANIES: {
        GET_PAGINATE: { method: "GET", apiPath: '/api/v1/companies', module: "COMPANIES" },
        CREATE: { method: "POST", apiPath: '/api/v1/companies', module: "COMPANIES" },
        UPDATE: { method: "PATCH", apiPath: '/api/v1/companies/:id', module: "COMPANIES" },
        DELETE: { method: "DELETE", apiPath: '/api/v1/companies/:id', module: "COMPANIES" },
    },
}

export const ALL_MODULES = {
    AUTH: 'AUTH',
    FILES: 'FILES',
    PERMISSIONS: 'PERMISSIONS',
    ROLES: 'ROLES',
    USERS: 'USERS',
    ATTENDANCE: 'ATTENDANCE',
    SHIFTS: 'SHIFTS',
    USER_SHIFTS: 'USER_SHIFTS',
    REPORTS: 'REPORTS',
    LEAVE_REQUESTS: 'LEAVE_REQUESTS',
    PAYROLL: 'PAYROLL',
    DEPARTMENTS: 'DEPARTMENTS',
    COMPANIES: 'COMPANIES',
}
