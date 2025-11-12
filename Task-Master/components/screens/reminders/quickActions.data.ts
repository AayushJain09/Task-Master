import { QuickActionConfig } from './QuickActions';
import {
  BellPlus,
  Share,
  Sparkles,
  ListChecks,
} from 'lucide-react-native';

/**
 * Static presets that seed the quick actions module.
 * Each entry captures the visual language (icon + color system) and the copywriting
 * used inside the grid so the Reminders screen stays declarative.
 */
export const reminderQuickActions: QuickActionConfig[] = [
  {
    id: 'new-reminder',
    label: 'New reminder',
    description: 'Schedule a task in seconds.',
    icon: BellPlus,
    accent: '#2563EB',
    badgeBackground: 'rgba(37, 99, 235, 0.08)',
    badgeBorder: 'rgba(37, 99, 235, 0.25)',
  },
  {
    id: 'share-summary',
    label: 'Share summary',
    description: 'Send today’s plan to Slack.',
    icon: Share,
    accent: '#0EA5E9',
    badgeBackground: 'rgba(14, 165, 233, 0.08)',
    badgeBorder: 'rgba(14, 165, 233, 0.25)',
  },
  {
    id: 'smart-suggestions',
    label: 'Smart fill',
    description: 'Let AI draft reminders.',
    icon: Sparkles,
    accent: '#A855F7',
    badgeBackground: 'rgba(168, 85, 247, 0.08)',
    badgeBorder: 'rgba(168, 85, 247, 0.25)',
  },
  {
    id: 'review-queue',
    label: 'Review queue',
    description: 'See pending approvals.',
    icon: ListChecks,
    accent: '#16A34A',
    badgeBackground: 'rgba(22, 163, 74, 0.08)',
    badgeBorder: 'rgba(22, 163, 74, 0.25)',
  },
];
