import { HookAPI } from 'antd/es/modal/useModal';

// 1. Accept 'modal' as the first argument
export const showErrorMessage = (modal: HookAPI, error: any, title: string = 'Operation Failed') => {
  const errorMessage = 
    error?.response?.data?.message || 
    error?.message || 
    (typeof error === 'string' ? error : "An unexpected error occurred.");

  // 2. Use the passed 'modal' instance instead of the static 'Modal'
  modal.error({
    title: title,
    content: errorMessage,
    okText: 'Dismiss',
    centered: true,
    maskClosable: true,
    keyboard: true,
  });
};