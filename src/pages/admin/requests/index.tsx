import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import LeaveRequestsTab from '@/components/admin/requests/LeaveRequestsTab/LeaveRequestsTab';
import OvertimeRequestsTab from '@/components/admin/requests/OvertimeRequestsTab/OvertimeRequestsTab';
import LateEarlyRequestsTab from '@/components/admin/requests/LateEarlyRequestsTab/LateEarlyRequestsTab';
import RemoteWorkRequestsTab from '@/components/admin/requests/RemoteWorkRequestsTab/RemoteWorkRequestsTab';
import ShiftChangeRequestsTab from '@/components/admin/requests/ShiftChangeRequestsTab/ShiftChangeRequestsTab';

const { TabPane } = Tabs;

const RequestsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('leave');

    const handleTabChange = (key: string) => {
        setActiveTab(key);
    };

    return (
        <Card title="Quản lý đơn từ" bordered={false}>
            <Tabs activeKey={activeTab} onChange={handleTabChange}>
                <TabPane tab="Đơn xin nghỉ phép" key="leave">
                    <LeaveRequestsTab />
                </TabPane>
                <TabPane tab="Đơn xin tăng ca" key="overtime">
                    <OvertimeRequestsTab />
                </TabPane>
                <TabPane tab="Đơn xin đi muộn/về sớm" key="late-early">
                    <LateEarlyRequestsTab />
                </TabPane>
                <TabPane tab="Đơn xin làm việc từ xa" key="remote-work">
                    <RemoteWorkRequestsTab />
                </TabPane>
                <TabPane tab="Đơn xin đổi ca" key="shift-change">
                    <ShiftChangeRequestsTab />
                </TabPane>
            </Tabs>
        </Card>
    );
};

export default RequestsPage; 