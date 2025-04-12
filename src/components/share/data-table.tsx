import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';

interface DataTableProps<T> {
    columns: ProColumns<T>[];
    dataSource: T[];
    request: (params: any, sort: any, filter: any) => Promise<any>;
    loading?: boolean;
    rowKey: string;
    headerTitle?: string;
    actionRef?: any;
    pagination?: any;
    rowSelection?: any;
    toolBarRender?: any;
    scroll?: any;
}

const DataTable = <T extends Record<string, any>>(props: DataTableProps<T>) => {
    return <ProTable<T> {...props} />;
};

export default DataTable; 