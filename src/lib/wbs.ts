export function calculateProgress(children: { status: string; weight: number }[]) {
  if (!children || children.length === 0) return null;

  const total = children.reduce((sum, c) => sum + c.weight, 0);
  if (total === 0) return null;

  const completed = children.reduce(
    (sum, c) => sum + (c.status === "COMPLETED" ? c.weight : 0),
    0
  );

  return { completed, total, percentage: Math.round((completed / total) * 100) };
}
