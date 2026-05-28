import React, { useState, useEffect } from 'react';
import { message, Modal, Spin } from 'antd';
import BranchView from '../features/system/components/BranchView';
import { Branch } from '../shared/types';
import { BranchServices } from '../features/system/api/branch.service';
import { showErrorMessage } from '../shared/types/ui/ErrorMessageModel';

const Branches: React.FC = () => {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);

    const [popup, contextHolder] = Modal.useModal();


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await BranchServices.getBranches();
            if (data.success) {
                setBranches(data.data ?? []);
            } else {
                showErrorMessage(popup, data.message, "Branch Fetch Failed");
            }
        } catch (error) {
            message.error("Failed to load branches");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (b: Branch) => {
        try {
            const {id,...createBrach} = b;
            const data = b.id ? await BranchServices.updateBranch(b.id, b) : await BranchServices.createBranch(createBrach);
            if (data.success) {
                message.success("Branch saved");
                fetchData();
            } else {
                showErrorMessage(popup, data.message, "Save Failed");
            }
        } catch (e) { }
    };

    const handleDelete = async (id: string) => {
        try {
            const data = await BranchServices.deleteBranch(id);
            if (data.success) {
                message.success("Branch deleted");
                fetchData();
            } else {
                showErrorMessage(popup, data.message, "Delete Failed");
            }
        } catch (e) { }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return (
        <>
            {contextHolder}
            <BranchView
                branches={branches}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </>
    );
};

export default Branches;