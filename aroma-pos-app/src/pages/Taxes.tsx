import React, { useState, useEffect } from 'react';
import { message, Modal, Spin } from 'antd';
import TaxView from '../features/catalog/components/TaxView';
import { Tax } from '../shared/types';
import { TaxesService } from '../features/catalog/api/taxes.service';
import { showErrorMessage } from '../shared/types/ui/ErrorMessageModel';

const Taxes: React.FC = () => {
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [loading, setLoading] = useState(true);

    const[popup, contextHolder] = Modal.useModal();


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await TaxesService.getTaxes();
            if(data.success){
                setTaxes(data.data ?? []);
            }else{
                showErrorMessage(popup, data.message, "Tax Fetch Failed");
            }
        } catch (error) {
            message.error("Failed to load taxes");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (t: Tax) => {
        try {
            if (t.id) await TaxesService.updateTax(t.id, t);
            else await TaxesService.createTax(t);
            message.success("Tax saved");
            fetchData();
        } catch (e) { }
    };

    const handleDelete = async (id: string) => {
        try {
            await TaxesService.deleteTax(id);
            setTaxes(prev => prev.filter(x => x.id !== id));
            message.success("Tax deleted");
        } catch (e) { }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return (

        <>
        {contextHolder}
        <TaxView 
            taxes={taxes}
            onSave={handleSave}
            onDelete={handleDelete}
        />
        </>
    );
};

export default Taxes;