import React from 'react';
import DeviceView from '../features/system/components/DeviceView';
import {
    useDevices,
    useDeviceTypes,
    useDeviceProtocols,
    useCreateDevice,
    useUpdateDevice,
    useDeleteDevice,
} from '../features/system/hooks/useDevices';

const Devices: React.FC = () => {
    const { data: devices = [], isLoading } = useDevices();
    const { data: deviceTypes = [] } = useDeviceTypes();
    const { data: protocols = [] } = useDeviceProtocols();

    const createDevice = useCreateDevice();
    const updateDevice = useUpdateDevice();
    const deleteDevice = useDeleteDevice();

    return (
        <DeviceView
            devices={devices}
            deviceTypes={deviceTypes}
            protocols={protocols}
            isLoading={isLoading}
            createDevice={createDevice}
            updateDevice={updateDevice}
            deleteDevice={deleteDevice}
        />
    );
};

export default Devices;
