/**
 * Map a grade letter to its display color.
 * Used across Home, Analytics, and charts.
 */
export function gradeColor(grade: string): string {
  switch (grade) {
    case 'S':
      return '#f59e0b';
    case 'A':
      return '#10b981';
    case 'B':
      return '#3b82f6';
    case 'C':
      return '#8b5cf6';
    default:
      return '#6b7280';
  }
}
