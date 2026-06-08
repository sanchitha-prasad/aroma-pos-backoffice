import React from 'react';
import VariantsView from '../features/catalog/components/VariantsView';
import {
    useVariants,
    useCreateVariant,
    useUpdateVariant,
    useDeleteVariant,
} from '../features/catalog/hooks/useVariants';

const Variants: React.FC = () => {
    const { data: variants = [], isLoading } = useVariants();

    const createVariant = useCreateVariant();
    const updateVariant = useUpdateVariant();
    const deleteVariant = useDeleteVariant();

    return (
        <VariantsView
            variants={variants}
            isLoading={isLoading}
            createVariant={createVariant}
            updateVariant={updateVariant}
            deleteVariant={deleteVariant}
        />
    );
};

export default Variants;
