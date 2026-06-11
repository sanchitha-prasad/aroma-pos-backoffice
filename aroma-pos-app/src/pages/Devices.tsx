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
import { useBranches } from '../features/system/hooks/useBranches';

const Devices: React.FC = () => {
    const { data: devices = [], isLoading } = useDevices();
    const { data: deviceTypes = [] } = useDeviceTypes();
    const { data: protocols = [] } = useDeviceProtocols();
    const { data: branches = [] } = useBranches();

    const createDevice = useCreateDevice();
    const updateDevice = useUpdateDevice();
    const deleteDevice = useDeleteDevice();

    return (
        <DeviceView
            devices={devices}
            deviceTypes={deviceTypes}
            protocols={protocols}
            branches={branches}
            isLoading={isLoading}
            createDevice={createDevice}
            updateDevice={updateDevice}
            deleteDevice={deleteDevice}
        />
    );
};

export default Devices;
