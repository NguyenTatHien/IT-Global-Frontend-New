import React from 'react';
import { Drawer, Descriptions } from 'antd';
import dayjs from 'dayjs';
import FaceAttendanceImage from './attendance.image';

interface IAttendance {
    _id: string;
    userId: {
        _id: string;
        name: string;
        employeeCode: string;
    };
    userName: string;
    checkInTime: string;
    checkOutTime: string | null;
    status: string;
    lateMinutes: number;
    earlyMinutes: number;
    totalHours: string;
    overtimeHours: number;
    checkInImage: string;
    checkOutImage: string;
    userShiftId: {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
    } | null;
    ipAddress: string;
    location: string;
}

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IAttendance | null;
    setDataInit: (v: any) => void;
}

const ViewDetailAttendance: React.FC<IProps> = ({ open, onClose, dataInit, setDataInit }) => {
    return (
        <Drawer
            title="Chi tiết chấm công"
            placement="right"
            onClose={() => { onClose(false); setDataInit(null); }}
            open={open}
            maskClosable={false}
        >
            {dataInit && (
                <Descriptions title="" bordered column={2} layout="vertical">
                    <Descriptions.Item label="Tên nhân viên">{dataInit.userId?.name}</Descriptions.Item>
                    <Descriptions.Item label="Mã nhân viên">{dataInit.userId?.employeeCode}</Descriptions.Item>
                    <Descriptions.Item label="Ngày">{dayjs(dataInit.checkInTime).format('DD/MM/YYYY')}</Descriptions.Item>
                    <Descriptions.Item label="Giờ check-in">{dayjs(dataInit.checkInTime).format('HH:mm:ss')}</Descriptions.Item>
                    <Descriptions.Item label="Giờ check-out">{dataInit.checkOutTime ? dayjs(dataInit.checkOutTime).format('HH:mm:ss') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Ảnh check-in">
                        {dataInit.checkInImage ? <FaceAttendanceImage type='check-in' attendanceId={dataInit._id} width={80} height={80} /> : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ảnh check-out">
                        {dataInit.checkOutImage ? <FaceAttendanceImage type='check-out' attendanceId={dataInit._id} width={80} height={80} /> : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Đi muộn">{dataInit.lateMinutes > 0 ? `${dataInit.lateMinutes} phút` : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Về sớm">{dataInit.earlyMinutes > 0 ? `${dataInit.earlyMinutes} phút` : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Tổng giờ">{dataInit.totalHours || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Tăng ca">{dataInit.overtimeHours > 0 ? `${dataInit.overtimeHours} giờ` : '-'}</Descriptions.Item>
                    <Descriptions.Item label="IP">{dataInit.ipAddress || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Vị trí">{dataInit.location || '-'}</Descriptions.Item>
                </Descriptions>
            )}
        </Drawer>
    );
};

export default ViewDetailAttendance; 