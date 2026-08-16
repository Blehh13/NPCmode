import { Achievement } from '../types';

export const AVATAR_OPTIONS = [
  { id: '1', emoji: '🧑‍🚀', label: 'Astronaut', color: '#00D9F5' },
  { id: '2', emoji: '👩', label: 'Banu', color: '#10B981' },
  { id: '3', emoji: '👦', label: 'Arjun', color: '#3B82F6' },
  { id: '4', emoji: '🐼', label: 'Panda', color: '#EC4899' },
  { id: '5', emoji: '🤖', label: 'Cyborg', color: '#8B5CF6' },
  { id: '6', emoji: '🦊', label: 'Fox', color: '#F97316' },
  { id: '7', emoji: '🐱', label: 'Cat', color: '#F59E0B' },
  { id: '8', emoji: '🐻', label: 'Bear', color: '#D97706' },
  { id: '9', emoji: '🦁', label: 'Lion', color: '#EF4444' },
];

export const ACCENT_COLORS = [
  '#00D9F5', // Cyan / Celestial
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
];

export function computeAchievements(
  gamesPlayed: number,
  wins: number,
  bestScore: number,
  bestStreak: number
): Achievement[] {
  return [
    {
      id: 'first_win',
      title: 'First Win',
      description: 'Win your first game',
      icon: 'Trophy',
      unlocked: wins >= 1,
      category: 'BADGES'
    },
    {
      id: 'streak_master',
      title: 'Streak Master',
      description: 'Get a 3+ streak in a game',
      icon: 'Flame',
      unlocked: bestStreak >= 3,
      progress: Math.min(3, bestStreak),
      maxProgress: 3,
      category: 'BADGES'
    },
    {
      id: 'explorer',
      title: 'Explorer',
      description: 'Play 10 games',
      icon: 'Compass',
      unlocked: gamesPlayed >= 10,
      progress: Math.min(10, gamesPlayed),
      maxProgress: 10,
      category: 'BADGES'
    },
    {
      id: 'top_scorer',
      title: 'Top Scorer',
      description: 'Score 300+ points in a match',
      icon: 'Star',
      unlocked: bestScore >= 300,
      progress: Math.min(300, bestScore),
      maxProgress: 300,
      category: 'BADGES'
    },
    {
      id: 'quick_thinker',
      title: 'Quick Thinker',
      description: 'Submit in under 5 seconds',
      icon: 'Zap',
      unlocked: gamesPlayed >= 2,
      category: 'BADGES'
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Win all rounds in a 3+ round game',
      icon: 'Target',
      unlocked: bestStreak >= 3,
      category: 'BADGES'
    },
    {
      id: 'challenge_pro',
      title: 'Challenge Pro',
      description: 'Play all 6 challenge types',
      icon: 'ShieldCheck',
      unlocked: gamesPlayed >= 3,
      progress: Math.min(6, Math.max(1, gamesPlayed * 2)),
      maxProgress: 6,
      category: 'MILESTONES'
    },
    {
      id: 'marathoner',
      title: 'Marathoner',
      description: 'Play 25 games',
      icon: 'Medal',
      unlocked: gamesPlayed >= 25,
      progress: Math.min(25, gamesPlayed),
      maxProgress: 25,
      category: 'MILESTONES'
    },
    {
      id: 'legend',
      title: 'Legend',
      description: 'Reach 1000 career points',
      icon: 'Crown',
      unlocked: bestScore >= 500 || gamesPlayed >= 5,
      progress: Math.min(1000, bestScore * 2 + gamesPlayed * 50),
      maxProgress: 1000,
      category: 'MILESTONES'
    }
  ];
}
