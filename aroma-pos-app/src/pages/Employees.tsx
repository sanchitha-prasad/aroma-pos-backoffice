import React, { useState, useEffect } from 'react';
import { message, Spin } from 'antd';
import EmployeesView from '../features/system/components/UsersView';
import { Activity, Branch, Employee } from '../shared/types';
import { systemService } from '../features/system/api/system.service';
import { EmployeesService } from '../features/system/api/employees.service';
import { BranchServices } from '../features/system/api/branch.service';

const Employees: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [empData, branchData, actData] = await Promise.all([
                EmployeesService.getEmployees(),
                BranchServices.getBranches(),
                systemService.getActivities()
            ]);
            if (empData.success) setEmployees(empData.data ?? []);
            if (branchData.success) setBranches(branchData.data ?? []);
            setActivities(actData);
        } catch (error) {
            message.error("Failed to load employee data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (emp: Employee) => {
        try {
            if (emp.id) {
                await EmployeesService.updateEmployee(emp.id, emp);
            } else {
                const { id, ...createData } = emp;
                await EmployeesService.createEmployee(createData);
            }
            message.success("Employee saved");
            fetchData();
        } catch (e) { }
    };

    const handleDelete = async (id: string) => {
        try {
            await EmployeesService.deleteEmployee(id);
            setEmployees(prev => prev.filter(x => x.id !== id));
            message.success("Employee deleted");
        } catch (e) { }
    };

    const handleLogActivity = (action: string, target: string) => {
        systemService.logActivity({ action, target, user: 'User' });
        const newAct: Activity = {
            id: Date.now().toString(),
            user: 'User',
            action,
            target,
            time: new Date()
        };
        setActivities(prev => [newAct, ...prev]);
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return (
        <EmployeesView
            onLogActivity={handleLogActivity}
            activities={activities}
            branches={branches}
            employees={employees}
            onSave={handleSave}
            onDelete={handleDelete}
        />
    );
};

export default Employees;
