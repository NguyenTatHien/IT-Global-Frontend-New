import { IUser } from "@/types/backend";
import { Badge, Descriptions, Drawer, Button, Space } from "antd";
import dayjs from 'dayjs';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import MailButton from '../mail/MailButton';

interface IProps {
    onClose: (v: boolean) => void;
    open: boolean;
    dataInit: IUser | null;
    setDataInit: (v: any) => void;
}
const ViewDetailUser = (props: IProps) => {
    const { onClose, open, dataInit, setDataInit } = props;

    const getEmployeeTypeText = (type: string) => {
        switch (type) {
            case 'official':
                return 'Nhân viên chính thức';
            case 'contract':
                return 'Nhân viên hợp đồng';
            case 'intern':
                return 'Thực tập sinh';
            default:
                return 'Không xác định';
        }
    };

    const getEmployeeTypeStatus = (type: string) => {
        switch (type) {
            case 'official':
                return 'success';
            case 'contract':
                return 'warning';
            case 'intern':
                return 'processing';
            default:
                return 'default';
        }
    };

    return (
        <>
            <Drawer
                title="Thông Tin User"
                placement="right"
                onClose={() => { onClose(false); setDataInit(null) }}
                open={open}
                maskClosable={false}
            >
                <Descriptions title="" bordered column={2} layout="vertical">
                    <Descriptions.Item label="Tên hiển thị">{dataInit?.name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{dataInit?.email}</Descriptions.Item>

                    <Descriptions.Item label="Giới Tính">{dataInit?.gender}</Descriptions.Item>
                    <Descriptions.Item label="Tuổi">{dataInit?.age}</Descriptions.Item>

                    <Descriptions.Item label="Loại nhân viên">
                        <Badge
                            status={getEmployeeTypeStatus(dataInit?.employeeType || '')}
                            text={getEmployeeTypeText(dataInit?.employeeType || '')}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label="Vai trò">
                        <Badge status="processing" text={dataInit?.role && typeof dataInit.role === 'object' ? dataInit.role.name : ''} />
                    </Descriptions.Item>

                    {/* <Descriptions.Item label="Địa chỉ">{dataInit?.address}</Descriptions.Item> */}
                    {/* <Descriptions.Item label="Thông tin công ty" span={2}>
                        Id: {dataInit?.company?._id ?? "-"}
                        <br />
                        Tên: {dataInit?.company?.name ?? "-"}
                        <br />
                    </Descriptions.Item> */}
                    <Descriptions.Item label="Ngày tạo">
                        {dataInit && dataInit.createdAt ? dayjs(dataInit.createdAt).format('DD-MM-YYYY HH:mm:ss') : ""}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày sửa" span={2}>
                        {dataInit && dataInit.updatedAt ? dayjs(dataInit.updatedAt).format('DD-MM-YYYY HH:mm:ss') : ""}
                    </Descriptions.Item>
                </Descriptions>
            </Drawer>
        </>
    )
}

export default ViewDetailUser;