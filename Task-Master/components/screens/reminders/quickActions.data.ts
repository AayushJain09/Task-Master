import { QuickActionConfig } from './QuickActions';
import { BellPlus, ClipboardPlus } from 'lucide-react-native';

/**
 * Static presets that seed the quick actions module.
 * Each entry captures the visual language (icon + color system) and the copywriting
 * used inside the grid so the Reminders screen stays declarative.
 */
export const reminderQuickActions: QuickActionConfig[] = [
  {
    id: 'create-reminder',
    label: 'Create reminder',
    description: 'Log a fresh personal or work touchpoint.',
    icon: BellPlus,
    accent: '#2563EB',
    badgeBackground: 'rgba(37, 99, 235, 0.08)',
    badgeBorder: 'rgba(37, 99, 235, 0.25)',
  },
  {
    id: 'task-reminder',
    label: 'Add reminder to task',
    description: 'Attach a follow-up to an existing task.',
    icon: ClipboardPlus,
    accent: '#0EA5E9',
    badgeBackground: 'rgba(14, 165, 233, 0.08)',
    badgeBorder: 'rgba(14, 165, 233, 0.25)',
  },
];
