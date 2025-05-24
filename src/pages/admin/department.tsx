import React, { useRef, useState } from 'react';
import DataTable from '@/components/share/data-table';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchDepartment } from '@/redux/slice/departmentSlide';
import ModalDepartment from '@/components/admin/department/modal.department';
import { callDeleteDepartment, callCreateDepartment, callUpdateDepartment } from '@/config/api';
import dayjs from 'dayjs';
import { Button, message, Space, Popconfirm, Tag } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface Department {
    _id: string;
    name: string;
    prefix?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
}

const DepartmentPage: React.FC = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<any>(null);
    const tableRef = useRef<any>();
    const dispatch = useAppDispatch();
    const departments = useAppSelector((state: any) => state.department?.result || []);
    const meta = useAppSelector((state: any) => state.department?.meta || {});
    const isFetching = useAppSelector((state: any) => state.department?.isFetching || false);

    const handleDelete = async (id: any) => {
        await callDeleteDepartment(id);
        message.success('Đã xóa phòng ban');
        tableRef.current?.reload();
    };

    const handleAdd = () => {
        setDataInit({});
        setOpenModal(true);
    };

    const handleOk = async (values: any) => {
        if (values._id) {
            await callUpdateDepartment(values._id, values);
            message.success('Cập nhật thành công');
        } else {
            await callCreateDepartment(values);
            message.success('Thêm mới thành công');
        }
        setOpenModal(false);
        setDataInit({});
        tableRef.current?.reload();
    };

    const columns = [
        { title: 'Tên phòng ban', dataIndex: 'name' },
        { title: 'Mã phòng ban', dataIndex: 'prefix' },
        { title: 'Mô tả', dataIndex: 'description' },
        {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            render: (val: any) =>
                val
                    ? <Tag color="green">Đang hoạt động</Tag>
                    : <Tag color="red">Ngừng hoạt động</Tag>
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            render: (val: any) => dayjs(val).format('DD-MM-YYYY HH:mm:ss')
        },
        {
            title: 'Hành động',
            render: (_: any, record: any) => (
                <Space>
                    <EditOutlined
                        style={{ fontSize: 20, color: '#ffa500', cursor: 'pointer' }}
                        onClick={() => {
                            setOpenModal(true);
                            setDataInit(record);
                        }}
                    />
                    <Popconfirm
                        title="Xác nhận xóa?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                    >
                        <DeleteOutlined
                            style={{ fontSize: 20, color: '#ff4d4f', cursor: 'pointer' }}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <DataTable
                rowKey="_id"
                actionRef={tableRef}
                columns={columns}
                dataSource={departments}
                loading={isFetching}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    total: meta.total,
                }}
                request={async (params: any, sort: any, filter: any) => {
                    const query = '';
                    dispatch(fetchDepartment({ query }));
                }}
                toolBarRender={() => (
                    <Button type="primary" onClick={handleAdd}>Thêm mới</Button>
                )}
            />
            <ModalDepartment
                key={dataInit?._id || 'new'}
                open={openModal}
                onClose={() => setOpenModal(false)}
                onOk={handleOk}
                initialValues={dataInit}
                setDataInit={setDataInit}
            />
        </div>
    );
};

export default DepartmentPage; 