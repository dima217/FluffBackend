const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Mirrors mobile useIsCheatMealDay logic. */
export function isCheatMealDay(
  cheatMealDay: string | null | undefined,
  periodOfDays: string | null | undefined,
): boolean {
  const cheatDay = parseInt(cheatMealDay ?? '1', 10) || 1;
  const period = parseInt(periodOfDays ?? '7', 10) || 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let firstCheatDate = new Date(today.getFullYear(), today.getMonth(), cheatDay);

  if (firstCheatDate > today) {
    firstCheatDate = new Date(today.getFullYear(), today.getMonth() - 1, cheatDay);
  }

  firstCheatDate.setHours(0, 0, 0, 0);

  const diffInDays = Math.floor((today.getTime() - firstCheatDate.getTime()) / MS_PER_DAY);

  if (diffInDays < 0) return false;

  return diffInDays % period === 0;
}

export function excludeCheatMealRecipeIds<T extends { id: number }>(
  recipes: T[],
  cheatMealIds: number[],
  cheatMealDay: string | null | undefined,
  periodOfDays: string | null | undefined,
): T[] {
  if (isCheatMealDay(cheatMealDay, periodOfDays) || cheatMealIds.length === 0) {
    return recipes;
  }

  const cheatMealSet = new Set(cheatMealIds);
  return recipes.filter((recipe) => !cheatMealSet.has(recipe.id));
}
