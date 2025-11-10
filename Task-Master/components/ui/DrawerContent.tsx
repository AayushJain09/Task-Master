import React from 'react';
import Dashboard from '../screens/Dashboard';
import Tasks from '../screens/Tasks';
import Reminders from '../screens/Reminders';
import { TaskStatistics } from '@/types/task.types';

interface DrawerContentProps {
  activeOption: string;
  taskStatistics?: TaskStatistics | null;
  statisticsLoading?: boolean;
  onRefreshStatistics?: () => Promise<void> | void;
}

export default function DrawerContent({
  activeOption,
  taskStatistics,
  statisticsLoading,
  onRefreshStatistics,
}: DrawerContentProps) {
  switch (activeOption) {
    case 'dashboard':
      return (
        <Dashboard
          statistics={taskStatistics}
          statisticsLoading={statisticsLoading}
          onRefreshStatistics={onRefreshStatistics}
        />
      );
    case 'tasks':
      return (
        <Tasks
          taskStatistics={taskStatistics}
          statisticsLoading={statisticsLoading}
          onRefreshStatistics={onRefreshStatistics}
        />
      );
    case 'reminders':
      return <Reminders />;
    default:
      return (
        <Dashboard
          statistics={taskStatistics}
          statisticsLoading={statisticsLoading}
          onRefreshStatistics={onRefreshStatistics}
        />
      );
  }
}
