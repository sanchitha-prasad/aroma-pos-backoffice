import React, { useState, useEffect } from 'react';
import { message, Modal, Spin } from 'antd';
import { Category, Device, Tax, Variant } from '../shared/types';
import { showErrorMessage } from '../shared/types/ui/ErrorMessageModel';
import VariantsView from '../features/catalog/components/VariantsView';
import { VariantService } from '../features/catalog/api/variants.service';

const Variants: React.FC = () => {
    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);

    const[popup, contextHolder] = Modal.useModal();


    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const variants = await VariantService.getVariants();
            if(variants.success){
                setVariants(variants.data ?? []);
            }else{
                showErrorMessage(popup, variants.message, "Variant Fetch Failed");
            }
        } catch (error) {
            message.error("Failed to load variants");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (variant: Variant) => {
        try {
            if (variant.id) await VariantService.updateVariant(variant.id, variant);
            else await VariantService.createVariant(variant);
            message.success("Variant saved");
            fetchData();
        } catch (e) {
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await VariantService.deleteVariant(id);
            setVariants(prev => prev.filter(c => c.id !== id));
            message.success("Variant deleted");
        } catch (e) { }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spin size="large" /></div>;

    return (
        <>
        {contextHolder}
        <VariantsView
            variants={variants}
            onSave={handleSave}
            onDelete={handleDelete}
        />
        </>
    );
};

export default Variants;