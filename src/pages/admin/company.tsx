import React, { useEffect, useRef, useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { callGetCompanies, callCreateCompany, callUpdateCompany, callDeleteCompany } from '@/config/api';
import DataTable from '@/components/share/data-table';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCompany } from '@/redux/slice/companySlide';
import ModalCompany from '@/components/admin/company/modal.company';
import dayjs from 'dayjs';

interface Company {
    _id: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    ipAddress?: string;
    isActive?: boolean;
    createdAt?: string;
}

const CompanyPage: React.FC = () => {
    const [openModal, setOpenModal] = useState(false);
    const [dataInit, setDataInit] = useState<any>(null);
    const tableRef = useRef<any>();
    const dispatch = useAppDispatch();
    const companies = useAppSelector((state: any) => state.company?.result || []);
    const meta = useAppSelector((state: any) => state.company?.meta || {});
    const isFetching = useAppSelector((state: any) => state.company?.isFetching || false);

    const handleDelete = async (id: any) => {
        await callDeleteCompany(id);
        message.success('Đã xóa công ty');
        tableRef.current?.reload();
    };

    const handleAdd = () => {
        setDataInit({});
        setOpenModal(true);
    };

    const handleOk = async (values: any) => {
        if (values._id) {
            await callUpdateCompany(values._id, values);
            message.success('Cập nhật thành công');
        } else {
            await callCreateCompany(values);
            message.success('Thêm mới thành công');
        }
        setOpenModal(false);
        setDataInit({});
        tableRef.current?.reload();
    };

    const columns = [
        { title: 'Tên công ty', dataIndex: 'name' },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            render: (text: any) => {
                try {
                    const addr = JSON.parse(text);
                    return `${addr.street || ''}, ${addr.ward || ''}, ${addr.district || ''}, ${addr.city || ''}`;
                } catch { return text; }
            }
        },
        { title: 'Số điện thoại', dataIndex: 'phone' },
        { title: 'Email', dataIndex: 'email' },
        { title: 'IP', dataIndex: 'ipAddress' },
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
                dataSource={companies}
                loading={isFetching}
                scroll={{ x: 'max-content' }}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    total: meta.total,
                }}
                request={async (params: any, sort: any, filter: any) => {
                    // build query string từ params/sort/filter
                    const query = '';
                    dispatch(fetchCompany({ query }));
                }}
                toolBarRender={() => (
                    <Button type="primary" onClick={handleAdd}>Thêm mới</Button>
                )}
            />
            <ModalCompany
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

export default CompanyPage; 