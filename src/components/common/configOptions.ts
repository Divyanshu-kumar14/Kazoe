export const QUESTION_TYPE_OPTIONS = [
  { value: 'add_sub' as const, label: 'Add / Sub', icon: 'add' },
  { value: 'multiplication' as const, label: 'Multiply', icon: 'close' },
  { value: 'division' as const, label: 'Division', icon: 'more_horiz' },
];

export type QuestionType = (typeof QUESTION_TYPE_OPTIONS)[number]['value'];

export function getRankForLevel(lvl: number) {
  if (lvl <= 2) return 'Beginner';
  if (lvl <= 4) return 'Intermediate';
  if (lvl <= 6) return 'Advanced';
  if (lvl <= 8) return 'Expert';
  if (lvl <= 9) return 'Master';
  return 'Grandmaster';
}
