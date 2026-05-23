import { type RefObject } from 'react';
import type { Question } from '../../utils/questionGenerator';

interface MathProblemProps {
  question: Question;
  inputRef: RefObject<HTMLInputElement | null>;
  inputVal: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  shakeKey: number;
  flashKey: number;
}

export function MathProblem({
  question,
  inputRef,
  inputVal,
  onChange,
  onKeyDown,
  shakeKey,
  flashKey,
}: MathProblemProps) {
  const isMultDiv = question.operation === 'multiplication' || question.operation === 'division';
  
  // Base classes for the input
  let inputClasses = "w-full font-mono text-4xl font-semibold tracking-wider bg-surface-container-low border-none focus:outline-none focus:ring-2 focus:ring-primary text-center px-3 py-2 transition-all rounded-t-lg caret-primary ";
  
  if (inputVal) {
    inputClasses += "text-primary border-b-[3px] border-primary ";
  } else {
    inputClasses += "text-outline border-b-[3px] border-outline-variant ";
  }

  const animationStyle = flashKey > 0 
    ? { animation: 'flashSuccess 0.4s ease-out' } 
    : (shakeKey > 0 ? { animation: 'headShake 0.4s ease-in-out' } : {});

  if (isMultDiv) {
    return (
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="flex items-baseline justify-center gap-3 flex-wrap">
          <span className="font-mono text-[clamp(2rem,5vw,2.75rem)] font-semibold text-on-surface tracking-wider">
            {question.operands[0]?.toLocaleString()}
          </span>
          <span className="font-mono text-2xl font-medium text-primary">
            {question.operation === 'multiplication' ? '×' : '÷'}
          </span>
          <span className="font-mono text-[clamp(2rem,5vw,2.75rem)] font-semibold text-on-surface tracking-wider">
            {question.operands[1]}
          </span>
          <span className="font-mono text-2xl font-medium text-outline">
            =
          </span>
        </div>

        <div className="w-full max-w-[200px]" style={shakeKey > 0 ? { animation: 'headShake 0.4s ease-in-out' } : {}}>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={inputVal}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder="?"
            aria-label="Your answer"
            autoComplete="off"
            className={inputClasses}
            style={animationStyle}
          />
        </div>
      </div>
    );
  }

  // Add/Sub vertical layout
  return (
    <>
      <div className="flex flex-col items-end gap-1 pr-1">
        {question.operands.map((op, idx) => {
          const rowKey = question.operands.slice(0, idx + 1).join('-');
          return (
            <div
              key={`op-${rowKey}`}
              className="flex items-baseline gap-3 animate-fade-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span className="font-mono text-lg font-medium text-outline w-5 text-right">
                {idx === 0 ? '' : op < 0 ? '−' : '+'}
              </span>
              <span className="font-mono text-4xl font-medium text-on-surface tracking-wider leading-tight">
                {Math.abs(op)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-[2px] bg-on-surface my-3 rounded-[1px]" />

      <div className="flex items-center gap-3" style={shakeKey > 0 ? { animation: 'headShake 0.4s ease-in-out' } : {}}>
        <span className="font-mono text-lg font-medium text-outline w-5 text-right shrink-0">
          =
        </span>
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={inputVal}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="?"
          aria-label="Your answer"
          autoComplete="off"
          className={`${inputClasses} text-right !border-b-2`}
          style={animationStyle}
        />
      </div>
    </>
  );
}
