export const AchievementCode = {
  CREATED_ACCOUNT: 'created_account',
  FIRST_RECIPE: 'first_recipe',
  PERFECT_MONTH_TRACKING: 'perfect_month_tracking',
  PUBLIC_RECIPE: 'public_recipe',
  TEN_RECIPES: 'ten_recipes',
  FIRST_RATE: 'first_rate',
  ALL_ACHIEVEMENTS: 'all_achievements',
} as const;

export type AchievementCodeValue =
  (typeof AchievementCode)[keyof typeof AchievementCode];

export const ACHIEVEMENT_META: Record<
  AchievementCodeValue,
  { title: string; body: string }
> = {
  [AchievementCode.CREATED_ACCOUNT]: {
    title: 'Achievement unlocked',
    body: 'You created your account. Welcome to Fluff!',
  },
  [AchievementCode.FIRST_RECIPE]: {
    title: 'Achievement unlocked',
    body: 'You created your first recipe.',
  },
  [AchievementCode.PERFECT_MONTH_TRACKING]: {
    title: 'Achievement unlocked',
    body: 'You tracked your meals every day this month.',
  },
  [AchievementCode.PUBLIC_RECIPE]: {
    title: 'Achievement unlocked',
    body: 'You published your first public recipe.',
  },
  [AchievementCode.TEN_RECIPES]: {
    title: 'Achievement unlocked',
    body: 'You created 10 recipes.',
  },
  [AchievementCode.FIRST_RATE]: {
    title: 'Achievement unlocked',
    body: 'You rated a recipe for the first time.',
  },
  [AchievementCode.ALL_ACHIEVEMENTS]: {
    title: 'Achievement unlocked',
    body: 'You unlocked all achievements. Legend!',
  },
};
