import React from 'react';
import ReportsView from '../features/reports/components/ReportsView';

interface ReportsPageProps {
    isDarkMode: boolean;
    permissions: string[];
}

const Reports: React.FC<ReportsPageProps> = ({ isDarkMode, permissions }) => {
    return <ReportsView isDarkMode={isDarkMode} permissions={permissions} />;
};

export default Reports;