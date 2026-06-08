import React from 'react';
import { message } from 'antd';
import EmployeesView from '../features/system/components/UsersView';
import { Employee } from '../shared/types';
import {
    useEmployees,
    useCreateEmployee,
    useUpdateEmployee,
    useDeleteEmployee,
} from '../features/system/hooks/useEmployees';
import { useBranches } from '../features/system/hooks/useBranches';

const Employees: React.FC = () => {
    const { data: employees = [], isLoading: empLoading } = useEmployees();
    const { data: branches = [], isLoading: branchLoading } = useBranches();

    const createEmployee = useCreateEmployee();
    const updateEmployee = useUpdateEmployee();
    const deleteEmployee = useDeleteEmployee();

    const handleSave = async (emp: Employee) => {
        try {
            if (emp.id) {
                await updateEmployee.mutateAsync({ id: emp.id, data: emp });
            } else {
                const { id, ...createData } = emp;
                await createEmployee.mutateAsync(createData);
            }
            message.success('Employee saved');
        } catch {
            message.error('Failed to save employee');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteEmployee.mutateAsync(id);
            message.success('Employee deleted');
        } catch {
            message.error('Failed to delete employee');
        }
    };

    return (
        <EmployeesView
            branches={branches}
            employees={employees}
            isLoading={empLoading || branchLoading}
            onSave={handleSave}
            onDelete={handleDelete}
        />
    );
};

export default Employees;
