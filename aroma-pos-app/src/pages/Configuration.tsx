import React from 'react';
import ConfigurationView from '../features/system/components/ConfigurationView';

interface ConfigurationPageProps {
    permissions: string[];
}

const ConfigurationPage: React.FC<ConfigurationPageProps> = ({ permissions }) => {
    return <ConfigurationView permissions={permissions} />;
};

export default ConfigurationPage;