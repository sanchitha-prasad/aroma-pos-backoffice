import type { MessageInstance } from 'antd/es/message/interface';

let messageApi: MessageInstance | null = null;

export const setGlobalMessageApi = (api: MessageInstance) => {
  messageApi = api;
};

export const globalMessage = {
  error: (content: string) => {
    if (messageApi) messageApi.error(content);
    else console.error('[API Error]', content);
  },
  success: (content: string) => {
    if (messageApi) messageApi.success(content);
  },
  warning: (content: string) => {
    if (messageApi) messageApi.warning(content);
  },
};
