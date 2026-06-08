import React from 'react';
import TaxView from '../features/catalog/components/TaxView';
import {
    useTaxes,
    useCreateTax,
    useUpdateTax,
    useDeleteTax,
} from '../features/catalog/hooks/useTaxes';

const Taxes: React.FC = () => {
    const { data: taxes = [], isLoading } = useTaxes();

    const createTax = useCreateTax();
    const updateTax = useUpdateTax();
    const deleteTax = useDeleteTax();

    return (
        <TaxView
            taxes={taxes}
            isLoading={isLoading}
            createTax={createTax}
            updateTax={updateTax}
            deleteTax={deleteTax}
        />
    );
};

export default Taxes;
