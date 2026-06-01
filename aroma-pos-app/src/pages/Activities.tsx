import React, { useState, useEffect } from 'react';
import { Spin } from 'antd';
import ActivityLogView from '../features/system/components/ActivityLogView';
import { Activity } from '../shared/types';
import { systemService } from '../features/system/api/system.service';

const Activities: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // const data = await systemService.getActivities();
                // setActivities(data);
            } catch (error) {
                console.error("Failed to load activities");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return <ActivityLogView activities={activities} />;
};

export default Activities;