export type QuestionType = 'add_sub' | 'multiplication' | 'division';

export interface SheetQuestion {
  operands: number[];
  answer: number;
  operation: QuestionType;
}

export function getOpSymbol(type: QuestionType) {
  return type === 'multiplication' ? '×' : type === 'division' ? '÷' : '+';
}
