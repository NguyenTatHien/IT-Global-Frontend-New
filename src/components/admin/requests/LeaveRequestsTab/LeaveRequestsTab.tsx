import React, { useEffect, useRef, useState } from 'react';
import { Table, Tag, Button, Modal, Input, message, notification } from 'antd';
import moment from 'moment';
import { LeaveRequest, LeaveType, RequestStatus } from '@/types/requests';
import { ILeaveRequest } from '@/types/backend';
import { ActionType } from '@ant-design/pro-components';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { callDeleteLeaveRequest } from '@/config/api';
import { ProColumns } from '@ant-design/pro-table';
import queryString from 'query-string';
import DataTable from '@/components/share/data-table';
import ModalLeaveRequest from './modal.leaverequest';
import { fetchLeaveRequests } from '@/redux/slice/requestLeaveSlide';
import dayjs from 'dayjs';

const LeaveRequestsTab: React.FC = () => {
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [dataInit, setDataInit] = useState<ILeaveRequest | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);

    const tableRef = useRef<ActionType>();

    const isFetching = useAppSelector(state => state.leaveRequests.isFetching);
    const meta = useAppSelector(state => state.leaveRequests.meta);
    const requests = useAppSelector(state => state.leaveRequests.result);
    const dispatch = useAppDispatch();
    const handleDeleteRequest = async (_id: string | undefined) => {
        if (_id) {
            const res = await callDeleteLeaveRequest(_id);
            if (res && res.data) {
                message.success('Xóa đơn làm việc từ xa thành công');
                reloadTable();
            } else {
                notification.error({
                    message: 'Có lỗi xảy ra',
                    description: res.message
                });
            }
        }
    }

    const reloadTable = () => {
        tableRef?.current?.reload();
    }

    const columns: ProColumns<ILeaveRequest>[] = [
        {
            title: 'Mã nhân viên',
            dataIndex: 'employee',
            key: 'employeeCode',
            render: (dom, entity) => {
                setDataInit(entity);
                return (
                    entity.employee?.employeeCode || "-"
                )
            }
        },
        {
            title: 'Nhân viên',
            dataIndex: 'employeeName',
            key: 'employeeName',
            render: (dome, entity) => {
                return (
                    entity.employee?.name || "-"
                )
            }
        },
        {
            title: 'Loại nghỉ',
            dataIndex: 'leaveType',
            key: 'type',
        },
        {
            title: 'Từ ngày',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (text, record, index, action) => {
                return (
                    <>{dayjs(record.startDate).format('DD/MM/YYYY')}</>
                )
            },
        },
        {
            title: 'Đến ngày',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (text, record, index, action) => {
                return (
                    <>{dayjs(record.endDate).format('DD/MM/YYYY')}</>
                )
            },
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (text, record) => {
                const statusColors = {
                    [RequestStatus.PENDING]: 'warning',
                    [RequestStatus.APPROVED]: 'success',
                    [RequestStatus.REJECTED]: 'error',
                    [RequestStatus.CANCELLED]: 'default',
                } as Record<string, string>;
                return <Tag color={statusColors[record.status]}>{record.status}</Tag>;
            },
            sorter: true
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: ILeaveRequest) => {
                if (record.status !== 'PENDING') return null;
                return (
                    <div>
                        <Button type="primary" onClick={() => {
                            setOpenModal(true);
                            setDataInit(record);
                        }} style={{ marginRight: 8 }}>
                            Cập nhật
                        </Button>
                        <Button danger onClick={() => handleDeleteRequest(record._id)}>
                            Xóa
                        </Button>
                    </div>
                );
            },
        },
    ];

    const buildQuery = (params: any, sort: any, filter: any) => {
        const clone = { ...params };
        if (clone.name) clone.name = `/${clone.name}/i`;
        if (clone.email) clone.email = `/${clone.email}/i`;

        let temp = queryString.stringify(clone);

        let sortBy = "";
        if (sort && sort.name) {
            sortBy = sort.name === 'ascend' ? "sort=name" : "sort=-name";
        }
        if (sort && sort.email) {
            sortBy = sort.email === 'ascend' ? "sort=email" : "sort=-email";
        }
        if (sort && sort.createdAt) {
            sortBy = sort.createdAt === 'ascend' ? "sort=createdAt" : "sort=-createdAt";
        }
        if (sort && sort.updatedAt) {
            sortBy = sort.updatedAt === 'ascend' ? "sort=updatedAt" : "sort=-updatedAt";
        }

        //mặc định sort theo updatedAt
        if (Object.keys(sortBy).length === 0) {
            temp = `${temp}&sort=-updatedAt`;
        } else {
            temp = `${temp}&${sortBy}`;
        }
        temp += "&populate=role&fields=role._id, role.name";

        return temp;
    }

    return (
        <div>
            <DataTable
                actionRef={tableRef}
                columns={columns as any}
                dataSource={requests}
                loading={isFetching}
                rowKey="_id"
                scroll={{ x: 'max-content' }}
                search={{
                    labelWidth: 'auto',
                    defaultCollapsed: true,
                    layout: 'vertical',
                    span: {
                        xs: 24,
                        sm: 12,
                        md: 8,
                        lg: 6,
                        xl: 6,
                        xxl: 6
                    },
                }}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showSizeChanger: true,
                    showTotal: (total: number, range: number[]) => { return (<div> {range[0]}-{range[1]} trên {total} hànghàng</div>) }
                }}
                request={async (params, sort, filter): Promise<any> => {
                    const query = buildQuery(params, sort, filter);
                    dispatch(fetchLeaveRequests({ query }))
                }}
            />
            <ModalLeaveRequest
                openModal={openModal}
                setOpenModal={setOpenModal}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={reloadTable}
            />
        </div>
    );
};

export default LeaveRequestsTab; 