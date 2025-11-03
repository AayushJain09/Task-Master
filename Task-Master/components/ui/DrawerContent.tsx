import React from 'react';
import Dashboard from '../screens/Dashboard';
import Tasks from '../screens/Tasks';
import Reminders from '../screens/Reminders';

interface DrawerContentProps {
  activeOption: string;
}

export default function DrawerContent({ activeOption }: DrawerContentProps) {
  switch (activeOption) {
    case 'dashboard':
      return <Dashboard />;
    case 'tasks':
      return <Tasks />;
    case 'reminders':
      return <Reminders />;
    default:
      return <Dashboard />;
  }
}