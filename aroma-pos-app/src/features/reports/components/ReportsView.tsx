import React, { useState } from 'react';
import { 
    Layout, 
    Menu, 
    Typography, 
    Table, 
    DatePicker, 
    Button, 
    Space, 
    theme, 
    Tabs, 
    Card, 
    Tag, 
    Statistic, 
    Row, 
    Col,
    message,
    Empty,
    Radio
} from 'antd';
import { 
    BarChartOutlined, 
    UserOutlined, 
    CreditCardOutlined, 
    AuditOutlined, 
    DownloadOutlined, 
    PrinterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import RichTable from '../../../shared/components/rich-table/RichTable';
import { EmployeesService } from '../../system/api/employees.service';
import { Employee } from '../../../shared/types';
import { useCurrency } from '../../../shared/context/CurrencyContext';
import { useSalesReport } from '../hooks/useSalesReport';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;


interface ReportsViewProps {
    isDarkMode: boolean;
    permissions: string[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ isDarkMode, permissions }) => {
    const { token } = theme.useToken();
    const [mainCategory, setMainCategory] = useState('sales');
    const [subReport, setSubReport] = useState('summary');
    const { currencySymbol } = useCurrency();
    const [dates, setDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
        dayjs().startOf('day'),
        dayjs().endOf('day')
    ]);
    const [selectedFilter, setSelectedFilter] = useState<string>('today');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const reportEnabled = mainCategory === 'sales' || mainCategory === 'employee';
    const { data: reportData, isFetching: loading } = useSalesReport({
        fromDate: reportEnabled ? dates[0] : null,
        toDate: reportEnabled ? dates[1] : null,
    });

    const handleQuickFilter = (key: string) => {
        setSelectedFilter(key);
        setCurrentPage(1);
        let newDates: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs().startOf('day'), dayjs().endOf('day')];
        switch (key) {
            case 'today':
                newDates = [dayjs().startOf('day'), dayjs().endOf('day')];
                break;
            case 'thisWeek':
                newDates = [dayjs().startOf('week'), dayjs().endOf('week')];
                break;
            case 'lastWeek':
                newDates = [dayjs().subtract(1, 'week').startOf('week'), dayjs().subtract(1, 'week').endOf('week')];
                break;
            case 'thisMonth':
                newDates = [dayjs().startOf('month'), dayjs().endOf('month')];
                break;
            case 'lastMonth':
                newDates = [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')];
                break;
            default:
                break;
        }
        setDates(newDates);
    };

    let reportConfig = { data: [] as any[], columns: [] as any[], title: '' };

    const menuItems = [
        { key: 'sales', icon: <BarChartOutlined />, label: 'Sales Reports' },
        { key: 'employee', icon: <UserOutlined />, label: 'Employee Reports' },
        { key: 'payment', icon: <CreditCardOutlined />, label: 'Payment Reports' },
        { key: 'audit', icon: <AuditOutlined />, label: 'Audit Reports' },
    ];

    const handleMenuClick = (e: { key: string }) => {
        setMainCategory(e.key);
        setCurrentPage(1);
        if (e.key === 'sales') setSubReport('summary');
        if (e.key === 'employee') setSubReport('attendance');
        if (e.key === 'payment') setSubReport('payment_methods');
        if (e.key === 'audit') setSubReport('shift_summary');
    };

    const cardStyle = (color1: string, color2: string) => ({
        background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
    });

    const renderSalesReports = () => {
        const availableTabs = [
            { key: 'summary',  label: 'Sales Summary',     perm: 'BackOffice:report_sales:summary' },
            { key: 'hourly',   label: 'Hourly Sales',       perm: 'BackOffice:report_sales:hourly' },
            { key: 'tips',     label: 'Tip Report',         perm: 'BackOffice:report_sales:tips' },
            { key: 'item',     label: 'Sales by Item',      perm: 'BackOffice:report_sales:item' },
            { key: 'category', label: 'Sales by Category',  perm: 'BackOffice:report_sales:category' },
            { key: 'shift',    label: 'Sales by Shift',     perm: 'BackOffice:report_sales:shift' },
            { key: 'orders',   label: 'Order Summary',      perm: 'BackOffice:report_sales:orders' },
        ].filter(t => permissions.includes(t.perm));

        let content;
        let data: any[] = [];
        let columns: any[] = [];
        let title = '';

        switch (subReport) {
            case 'summary':
                title = 'Sales Summary';
                const summary = reportData?.salesSummary;
                data = summary ? [{
                    id: 'sales-summary-row',
                    date: dates[0] && dates[1] 
                        ? `${dates[0].format('MMM D, YYYY')} - ${dates[1].format('MMM D, YYYY')}`
                        : 'Selected Period',
                    orders: summary.ticketCount,
                    grossSales: summary.grossSales,
                    discounts: summary.totalDiscount,
                    netSales: summary.netSales,
                    tax: summary.totalTax,
                    total: summary.totalPaid
                }] : [];
                columns = [
                    { title: 'Date Range', dataIndex: 'date', key: 'date' },
                    { title: 'Orders', dataIndex: 'orders', key: 'orders' },
                    { title: 'Gross Sales', dataIndex: 'grossSales', key: 'grossSales', render: (val: number) => `${currencySymbol}${val?.toFixed(2) || '0.00'}` },
                    { title: 'Discounts', dataIndex: 'discounts', key: 'discounts', render: (val: number) => `-${currencySymbol}${val?.toFixed(2) || '0.00'}` },
                    { title: 'Net Sales', dataIndex: 'netSales', key: 'netSales', render: (val: number) => `${currencySymbol}${val?.toFixed(2) || '0.00'}` },
                    { title: 'Tax', dataIndex: 'tax', key: 'tax', render: (val: number) => `${currencySymbol}${val?.toFixed(2) || '0.00'}` },
                    { title: 'Total Paid', dataIndex: 'total', key: 'total', render: (val: number) => `${currencySymbol}${val?.toFixed(2) || '0.00'}` },
                ];
                break;
            case 'hourly':
                title = 'Hourly Sales';
                data = [];
                columns = [
                    { title: 'Hour', dataIndex: 'hour', key: 'hour' },
                    { title: 'Orders', dataIndex: 'orders', key: 'orders' },
                    { title: 'Total Sales', dataIndex: 'sales', key: 'sales', render: (val: string) => `${currencySymbol}${val}` },
                    { title: 'Labor %', dataIndex: 'labor', key: 'labor' },
                ];
                break;
            case 'item':
                title = 'Sales by Item';
                data = [];
                columns = [
                    { title: 'Item Name', dataIndex: 'item', key: 'item' },
                    { title: 'Category', dataIndex: 'category', key: 'category' },
                    { title: 'Qty Sold', dataIndex: 'qty', key: 'qty' },
                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val: string) => `${currencySymbol}${val}` },
                ];
                break;
            case 'category':
                title = 'Sales by Category';
                data = [];
                columns = [
                    { title: 'Category', dataIndex: 'category', key: 'category' },
                    { title: 'Qty Sold', dataIndex: 'qty', key: 'qty' },
                    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val: string) => `${currencySymbol}${val}` },
                ];
                break;
            case 'tips':
                title = 'Tip Report';
                data = [];
                columns = [
                    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
                    { title: 'Cash Tips', dataIndex: 'cashTips', key: 'cashTips', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                    { title: 'Credit Tips', dataIndex: 'creditTips', key: 'creditTips', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                ];
                break;
            case 'shift':
                title = 'Sales by Shift';
                data = [];
                columns = [
                    { title: 'Shift', dataIndex: 'shift', key: 'shift' },
                    { title: 'Orders', dataIndex: 'orders', key: 'orders' },
                    { title: 'Total Sales', dataIndex: 'sales', key: 'sales', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                ];
                break;
            case 'orders':
                title = 'Order Summary';
                data = [];
                columns = [
                    { title: 'Order ID', dataIndex: 'orderId', key: 'orderId' },
                    { title: 'Time', dataIndex: 'time', key: 'time' },
                    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
                    { title: 'Items', dataIndex: 'items', key: 'items' },
                    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: string) => `${currencySymbol}${v}` },
                    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color="green">{s}</Tag> },
                ];
                break;
        }

        reportConfig = { data, columns, title };
        
        if (subReport === 'summary') {
            const summary = reportData?.salesSummary;
            content = (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {summary && (
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} md={6}>
                                <Card style={cardStyle('#3b82f6', '#1d4ed8')} styles={{ body: { padding: '20px' } }}>
                                    <Statistic
                                        title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500 }}>Gross Sales</span>}
                                        value={summary.grossSales}
                                        precision={2}
                                        prefix={<span style={{ color: 'white' }}>{currencySymbol}</span>}
                                        valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card style={cardStyle('#10b981', '#047857')} styles={{ body: { padding: '20px' } }}>
                                    <Statistic
                                        title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500 }}>Net Sales</span>}
                                        value={summary.netSales}
                                        precision={2}
                                        prefix={<span style={{ color: 'white' }}>{currencySymbol}</span>}
                                        valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card style={cardStyle('#f59e0b', '#b45309')} styles={{ body: { padding: '20px' } }}>
                                    <Statistic
                                        title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500 }}>Total Discount</span>}
                                        value={summary.totalDiscount}
                                        precision={2}
                                        prefix={<span style={{ color: 'white' }}>-{currencySymbol}</span>}
                                        valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card style={cardStyle('#ec4899', '#be185d')} styles={{ body: { padding: '20px' } }}>
                                    <Statistic
                                        title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500 }}>Ticket Count</span>}
                                        value={summary.ticketCount}
                                        valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    )}
                    <RichTable
                        data={data}
                        columns={columns}
                        rowKey="id"
                        isLoading={loading}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={data.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        totalLabel="sales summaries"
                    />
                </div>
            );
        } else if (data.length > 0) {
            content = <Table dataSource={data} columns={columns} pagination={false} size="middle" />;
        } else {
             content = <Empty description="Select a report from the tabs" />;
        }

        return { tabs: availableTabs, content };
    };

    const renderEmployeeReports = () => {
        const availableTabs = [
            { key: 'attendance',  label: 'Attendance',        perm: 'BackOffice:report_employee:attendance' },
            { key: 'shifts',      label: 'Shift Report',       perm: 'BackOffice:report_employee:shifts' },
            { key: 'performance', label: 'Sales by Employee',  perm: 'BackOffice:report_employee:performance' },
        ].filter(t => permissions.includes(t.perm));

        let content;
        let data: any[] = [];
        let columns: any[] = [];
        let title = '';

        if (subReport === 'performance') {
            title = 'Sales by Employee';
            data = reportData?.salesByStaff?.map((staff: any) => ({
                key: staff.staffId,
                name: staff.staffName === "00000000-0000-0000-0000-000000000000" ? "System / Unknown" : staff.staffName,
                orders: staff.salesSummary?.ticketCount || 0,
                grossSales: staff.salesSummary?.grossSales || 0,
                discounts: staff.salesSummary?.totalDiscount || 0,
                netSales: staff.salesSummary?.netSales || 0,
                serviceCharge: staff.salesSummary?.totalServiceCharge || 0,
                totalPaid: staff.salesSummary?.totalPaid || 0,
            })) || [];

            columns = [
                { 
                    title: 'Employee Name', 
                    dataIndex: 'name', 
                    key: 'name',
                    render: (text: string) => <strong>{text}</strong>
                },
                { title: 'Orders', dataIndex: 'orders', key: 'orders' },
                { title: 'Gross Sales', dataIndex: 'grossSales', key: 'grossSales', render: (val: number) => `${currencySymbol}${val?.toFixed(2) || '0.00'}` },
                { title: 'Discounts', dataIndex: 'discounts', key: 'discounts', render: (val: number) => `-${currencySymbol}${val?.toFixed(2) || '0.00'}` },
                { title: 'Net Sales', dataIndex: 'netSales', key: 'netSales', render: (val: number) => `${currencySymbol}${val?.toFixed(2) || '0.00'}` },
                { title: 'Service Charge', dataIndex: 'serviceCharge', key: 'serviceCharge', render: (val: number) => `${currencySymbol}${val?.toFixed(2) || '0.00'}` },
                { title: 'Total Paid', dataIndex: 'totalPaid', key: 'totalPaid', render: (val: number) => `${currencySymbol}${val?.toFixed(2) || '0.00'}` },
            ];

            reportConfig = { data, columns, title };

            const paginatedEmpData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

            content = (
                <RichTable
                    data={paginatedEmpData}
                    columns={columns}
                    rowKey="key"
                    isLoading={loading}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={data.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    totalLabel="employees"
                />
            );
        } else {
            columns = [
                { title: 'Employee', dataIndex: 'name', key: 'name' },
                { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <Tag color="blue">{r}</Tag> },
                { title: 'Clock In', dataIndex: 'clockIn', key: 'clockIn' },
                { title: 'Clock Out', dataIndex: 'clockOut', key: 'clockOut' },
                { title: 'Hours', dataIndex: 'hours', key: 'hours' },
                { title: 'Total Sales', dataIndex: 'sales', key: 'sales', render: (val: number) => `${currencySymbol}${val.toFixed(2)}` },
                { title: 'Tips', dataIndex: 'tips', key: 'tips', render: (val: number) => `${currencySymbol}${val.toFixed(2)}` },
            ];
            reportConfig = { data, columns, title: 'Employee Report' };
            content = <Table dataSource={data} columns={columns} pagination={false} size="middle" />;
        }

        return { tabs: availableTabs, content };
    };

    const renderPaymentReports = () => {
        const availableTabs = [
            { key: 'payment_methods', label: 'Payment Methods', perm: 'BackOffice:report_payment:methods' },
            { key: 'batch',           label: 'Batch Report',    perm: 'BackOffice:report_payment:batch' },
            { key: 'summary',         label: 'Batch Summary',   perm: 'BackOffice:report_payment:summary' },
        ].filter(t => permissions.includes(t.perm));

        const data: any[] = [];
        const columns = [
            { title: 'Method', dataIndex: 'method', key: 'method', render: (t: string) => <strong>{t}</strong> },
            { title: 'Count', dataIndex: 'count', key: 'count' },
            { title: 'Total Amount', dataIndex: 'amount', key: 'amount', render: (val: number) => `${currencySymbol}${val.toFixed(2)}` },
            { title: '% of Sales', key: 'pct', render: (_: any, r: any) => `${(Math.random() * 30 + 5).toFixed(1)}%` },
        ];

        reportConfig = { data, columns, title: 'Payment Report' };

        return { tabs: availableTabs, content: <Table dataSource={data} columns={columns} pagination={false} size="middle" /> };
    };

    const renderAuditReports = () => {
        const availableTabs = [
            { key: 'shift_summary', label: 'Shift Summary', perm: 'BackOffice:report_audit:shift' },
            { key: 'drawer',        label: 'Drawer Report', perm: 'BackOffice:report_audit:drawer' },
            { key: 'logs',          label: 'Audit Logs',    perm: 'BackOffice:report_audit:logs' },
        ].filter(t => permissions.includes(t.perm));

        let content;
        let data: any[] = [];
        let columns: any[] = [];
        let title = '';

        if (subReport === 'drawer') {
            title = 'Drawer Report';
            data = [];
            columns = [
                { title: 'Drawer ID', dataIndex: 'drawerId', key: 'drawerId' },
                { title: 'User', dataIndex: 'user', key: 'user' },
                { title: 'Start', dataIndex: 'startAmount', key: 'start', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                { title: 'Cash Sales', dataIndex: 'cashSales', key: 'sales', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                { title: 'Drops', dataIndex: 'drops', key: 'drops', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                { title: 'Expected', dataIndex: 'expected', key: 'exp', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                { title: 'Actual', dataIndex: 'actual', key: 'act', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                { title: 'Variance', dataIndex: 'variance', key: 'var', render: (v: number) => <span style={{ color: v < 0 ? 'red' : 'green', fontWeight: 'bold' }}>{v < 0 ? '-' : ''}{currencySymbol}{Math.abs(v).toFixed(2)}</span> },
            ];
        } else if (subReport === 'shift_summary') {
            title = 'Shift Summary Audit';
            data = [];
            columns = [
                { title: 'Shift', dataIndex: 'shift', key: 'shift' },
                { title: 'Manager', dataIndex: 'manager', key: 'manager' },
                { title: 'Start Cash', dataIndex: 'startCash', key: 'startCash', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                { title: 'End Cash', dataIndex: 'endCash', key: 'endCash', render: (v: number) => `${currencySymbol}${v.toFixed(2)}` },
                { title: 'Over/Short', dataIndex: 'overShort', key: 'overShort', render: (v: number) => <span style={{ color: v !== 0 ? 'red' : 'green' }}>{v < 0 ? '-' : ''}{currencySymbol}{Math.abs(v).toFixed(2)}</span> },
            ];
        } else {
            title = 'Sensitive Action Logs';
            data = [];
            columns = [
                { title: 'Time', dataIndex: 'time', key: 'time' },
                { title: 'User', dataIndex: 'user', key: 'user' },
                { title: 'Action', dataIndex: 'action', key: 'action', render: (t: string) => <Tag color="orange">{t}</Tag> },
                { title: 'Details', dataIndex: 'details', key: 'details' },
                { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: string) => `${currencySymbol}${v}` },
            ];
        }

        reportConfig = { data, columns, title };

        if (data.length > 0) {
            content = <Table dataSource={data} columns={columns} pagination={false} size="middle" />;
        } else {
            content = <Empty description="Select a report" />;
        }

        return { tabs: availableTabs, content };
    };


    let currentData;
    switch(mainCategory) {
        case 'sales': currentData = renderSalesReports(); break;
        case 'employee': currentData = renderEmployeeReports(); break;
        case 'payment': currentData = renderPaymentReports(); break;
        case 'audit': currentData = renderAuditReports(); break;
        default: currentData = renderSalesReports();
    }

    const handleExportCSV = () => {
        if (!reportConfig.data || reportConfig.data.length === 0) {
            message.warning("No data to export");
            return;
        }

        const headers = reportConfig.columns.map(c => c.title).join(',');
        const rows = reportConfig.data.map(row => {
            return reportConfig.columns.map(c => {
                const val = row[c.dataIndex];
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',');
        }).join('\n');

        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${reportConfig.title.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        if (!reportConfig.data || reportConfig.data.length === 0) {
            message.warning("No data to print");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            message.error("Please allow popups to print");
            return;
        }

        const dateStr = dayjs().format('MMMM D, YYYY h:mm A');
        
        const tableHeaders = reportConfig.columns.map(c => `<th>${c.title}</th>`).join('');
        const tableRows = reportConfig.data.map(row => {
            return `<tr>${reportConfig.columns.map(c => {
                let val = row[c.dataIndex];
                if (c.title.includes('Sales') || c.title.includes('Amount') || c.title.includes('Total') || c.title.includes('Price')) {
                    if (typeof val === 'number') val = `${currencySymbol}${val.toFixed(2)}`;
                    else if (typeof val === 'string' && !val.includes(currencySymbol) && !isNaN(parseFloat(val))) val = `${currencySymbol}${val}`;
                }
                return `<td>${val}</td>`;
            }).join('')}</tr>`;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Report - ${reportConfig.title}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .logo-placeholder { 
                        width: 60px; height: 60px; background-color: #6132C0; color: white; 
                        border-radius: 8px; line-height: 60px; font-size: 24px; font-weight: bold;
                        margin: 0 auto 10px auto; display: inline-block;
                    }
                    .company-name { font-size: 24px; font-weight: bold; margin: 5px 0; color: #6132C0; }
                    .company-info { font-size: 12px; color: #666; line-height: 1.4; }
                    .report-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                    .report-meta { font-size: 12px; color: #888; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; }
                    th { text-align: left; background-color: #f8f9fa; padding: 10px 8px; border-bottom: 2px solid #ddd; font-weight: 600; text-transform: uppercase; color: #444; }
                    td { padding: 10px 8px; border-bottom: 1px solid #eee; }
                    tr:last-child td { border-bottom: none; }
                    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-placeholder">A</div>
                    <div class="company-name">THE BURGER JOINT</div>
                    <div class="company-info">
                        123 Culinary Avenue, Food District, NY 10012<br>
                        Mobile: +1 (555) 019-2834 &bull; Email: admin@burgerjoint.com
                    </div>
                </div>

                <div class="report-title">${reportConfig.title}</div>
                <div class="report-meta">Generated on: ${dateStr}</div>

                <table>
                    <thead><tr>${tableHeaders}</tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>

                <div class="footer">
                    Printed from Aroma POS System &bull; Page 1 of 1
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <Layout style={{ height: '100%', background: token.colorBgContainer }}>
            <Sider width={220} style={{ background: token.colorBgContainer, borderRight: `1px solid ${token.colorBorderSecondary}` }}>
                <div style={{ padding: '20px 16px', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                    <Title level={4} style={{ margin: 0 }}>Reports</Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[mainCategory]}
                    onClick={handleMenuClick}
                    items={menuItems}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            <Layout>
                <Content style={{ padding: '24px', overflowY: 'auto', background: token.colorBgLayout }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Space orientation="vertical" size={0}>
                            <Title level={3} style={{ margin: 0, textTransform: 'capitalize' }}>{mainCategory} Reports</Title>
                            <Text type="secondary">View and export detailed analytics</Text>
                        </Space>
                        <Space>
                            <Radio.Group 
                                value={selectedFilter} 
                                onChange={(e) => handleQuickFilter(e.target.value)}
                                optionType="button"
                                buttonStyle="solid"
                            >
                                <Radio.Button value="today">Today</Radio.Button>
                                <Radio.Button value="thisWeek">This Week</Radio.Button>
                                <Radio.Button value="lastWeek">Last Week</Radio.Button>
                                <Radio.Button value="thisMonth">This Month</Radio.Button>
                                <Radio.Button value="lastMonth">Last Month</Radio.Button>
                            </Radio.Group>
                            <RangePicker 
                                value={dates} 
                                onChange={(val) => {
                                    setDates(val || [null, null]);
                                    setSelectedFilter('custom');
                                }}
                            />
                            <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
                            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV}>Export CSV</Button>
                        </Space>
                    </div>

                    <Card 
                        variant="borderless" 
                        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: 8 }}
                        styles={{ body: { padding: 0 } }}
                    >
                        {currentData.tabs.length > 0 ? (
                            <Tabs 
                                activeKey={subReport}
                                onChange={setSubReport}
                                items={currentData.tabs.map(tab => ({
                                    key: tab.key,
                                    label: tab.label,
                                    children: (
                                        <div style={{ padding: '0 24px 24px' }}>
                                            <div style={{ marginBottom: 24, padding: 16, background: token.colorFillAlter, borderRadius: 8 }}>
                                                <Row gutter={16}>
                                                    <Col span={6}>
                                                        <Statistic title="Total Records" value={reportConfig.data.length || 0} />
                                                    </Col>
                                                    <Col span={6}>
                                                        <Statistic title="Generated At" value={dayjs().format('HH:mm A')} styles={{ content: { fontSize: 16 } }} />
                                                    </Col>
                                                </Row>
                                            </div>
                                            {currentData.content}
                                        </div>
                                    )
                                }))}
                                tabBarStyle={{ padding: '0 24px' }}
                            />
                        ) : (
                            <div style={{ padding: 48, textAlign: 'center' }}>
                                <Empty description="You do not have permission to view reports in this category." />
                            </div>
                        )}
                    </Card>
                </Content>
            </Layout>
        </Layout>
    );
};

export default ReportsView;