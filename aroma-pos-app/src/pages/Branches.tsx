import React from 'react';
import BranchView from '../features/system/components/BranchView';
import {
    useBranches,
    useCreateBranch,
    useUpdateBranch,
    useDeleteBranch,
} from '../features/system/hooks/useBranches';
import type { Branch } from '../shared/types';

const Branches: React.FC = () => {
    const { data: branches = [], isLoading } = useBranches();
    const createBranch = useCreateBranch();
    const updateBranch = useUpdateBranch();
    const deleteBranch = useDeleteBranch();

    const handleSave = async (branch: Branch) => {
        if (branch.id) {
            await updateBranch.mutateAsync({ id: branch.id, data: branch });
        } else {
            const { id, ...createDto } = branch;
            await createBranch.mutateAsync(createDto);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteBranch.mutateAsync(id);
    };

    return (
        <BranchView
            branches={branches}
            loading={isLoading}
            onSave={handleSave}
            onDelete={handleDelete}
        />
    );
};

export default Branches;
