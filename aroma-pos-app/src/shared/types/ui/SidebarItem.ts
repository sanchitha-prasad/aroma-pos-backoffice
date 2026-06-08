import React from 'react';
import { ViewState } from './ViewState';

export interface SidebarItem {
  id: ViewState;
  label: string;
  icon: React.ReactNode;
}
