import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import DashboardView from '../features/dashboard/components/DashboardView';
import { Activity } from '../shared/types';
import { systemService } from '../features/system/api/system.service';

interface DashboardPageProps {
    isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardPageProps> = ({ isDarkMode }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // const fetchData = async () => {
        //     try {
        //         const data = await systemService.getActivities();
        //         setActivities(data);
        //     } catch (error) {
        //         console.error("Failed to load dashboard data", error);
        //     } finally {
        //         setLoading(false);
        //     }
        // };
        // fetchData();
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return <DashboardView isDarkMode={isDarkMode} activities={activities} />;
};

export default Dashboard;