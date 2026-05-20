# Kazoe Performance Optimization Plan

## Issues Found & Fixes

### 1. Home.tsx - History subscription causes unnecessary re-renders (HIGH)

**Problem**: `useAppStore(s => s.history)` subscribes to the entire history array. Every time any store property changes (including session answers during active play), the Home component re-renders and `computeStats` iterates the full history.

**Fix**: Move `computeStats` logic directly into the Zustand selector function. This way the selector only returns a plain object with computed values, and React will only re-render when one of those computed values actually changes.

**File**: `src/pages/Home.tsx`
**Change**: Replace lines 209-213 with inline computed selector

```tsx
// BEFORE:
const history = useAppStore(s => s.history);
const stats = useMemo(() => computeStats(history), [history]);

// AFTER:
const stats = useAppStore((s) => {
  // computeStats logic inlined here, returns plain object
  // Only re-renders when computed values actually change
});
```

---

### 2. Multiplayer timer fires 100ms updating Zustand store (HIGH)

**Problem**: `useMultiplayerGame.ts` line 154 fires `setInterval` every 100ms, calling `useMultiplayerStore.setState({ timeRemaining: remaining })` — this causes ALL components subscribed to the store to re-render 10 times per second.

**Fix**: Only update the store when the integer second changes (not every 100ms). The timer display already uses `Math.ceil(timeRemaining)`, so sub-second precision isn't needed for rendering.

**File**: `src/hooks/useMultiplayerGame.ts`
**Change**: Lines 154-173

```tsx
// BEFORE:
timerIntervalRef.current = setInterval(() => {
  const state = useMultiplayerStore.getState();
  const duration = state.match?.config?.timeLimitSeconds ?? 180;
  const elapsed = (performance.now() - state.gameStartTime) / 1000;
  const remaining = Math.max(0, duration - elapsed);

  if (Math.floor(remaining) !== Math.floor(state.timeRemaining)) {
    useMultiplayerStore.setState({ timeRemaining: remaining });
  }
  // ...
}, 100);

// AFTER:
timerIntervalRef.current = setInterval(() => {
  const state = useMultiplayerStore.getState();
  const duration = state.match?.config?.timeLimitSeconds ?? 180;
  const elapsed = (performance.now() - state.gameStartTime) / 1000;
  const remaining = Math.max(0, duration - elapsed);

  // Only update store once per second
  if (Math.round(remaining) !== Math.round(state.timeRemaining)) {
    useMultiplayerStore.setState({ timeRemaining: remaining });
  }
  // ...
}, 250); // Check 4x/sec but only update store once/sec
```

---

### 3. Multiplayer sends full answers array on every sync (HIGH)

**Problem**: `useMultiplayerStore.ts` `scheduleProgressUpdate` sends the entire `answers` array (growing up to 60 items) to Supabase every 500ms after each answer submission.

**Fix**: Only send the latest answer payload, not the full array. Accumulate answers on the DB side or send incremental updates.

**File**: `src/store/useMultiplayerStore.ts`
**Change**: Lines 409-454

```tsx
// BEFORE: sends full filteredAnswers array every time
const filteredAnswers = p.answers.filter((a): a is AnswerPayload => a !== null);
const updatedScores = p.playerNumber === 1
  ? { ...currentScores, player1: p.playerScore, player1_answers: filteredAnswers }
  : { ...currentScores, player2: p.playerScore, player2_answers: filteredAnswers };

// AFTER: track only the latest answer index and send incrementally
// Store lastSyncedIndex in pendingProgress, only send new answers
```

---

### 4. memo() wrappers defeated by new array references (MEDIUM)

**Problem**: `AccuracySparkline` and `BadgeGrid` in Home.tsx receive `history` and `badges` as props. Since these are new array references from the store on every update, `memo()` always sees "new" props and re-renders.

**Fix**: Pass stable derived values instead of raw arrays. For `AccuracySparkline`, pass `history.slice(-20)` as a stable selector. For `BadgeGrid`, pass badge IDs or use the selector approach from fix #1.

**File**: `src/pages/Home.tsx`
**Change**: Pass derived stable props to memoized children

---

### 5. TestInterface useCallback invalidated by questions array (MEDIUM)

**Problem**: `handleSubmit` useCallback depends on `questions` array (line 196), which is a new reference from the store on every change. This invalidates the callback and recreates `handleKeyDown`.

**Fix**: Use `useAppStore.getState().session.questions` inside the callback instead of depending on the prop.

**File**: `src/components/practice/TestInterface.tsx`
**Change**: Lines 174-196

```tsx
// BEFORE:
const handleSubmit = useCallback(() => {
  const currentQuestion = questions[currentIndex];
  // ...
}, [submitAnswer, currentIndex, questions, playCorrect, playWrong, triggerShake]);

// AFTER:
const handleSubmit = useCallback(() => {
  const currentQuestion = useAppStore.getState().session.questions[currentIndex];
  // ...
}, [submitAnswer, currentIndex, playCorrect, playWrong, triggerShake]);
```

---

### 6. No React.memo on page-level components (MEDIUM)

**Problem**: Page components (`MultiplayerHome`, `MultiplayerGame`, `LevelGuide`, `SheetGenerator`) will re-render on any parent context change.

**Fix**: Wrap default exports with `memo()`.

**Files**: 
- `src/pages/MultiplayerHome.tsx`
- `src/pages/MultiplayerGame.tsx`
- `src/pages/LevelGuide.tsx`
- `src/pages/SheetGenerator.tsx`

---

### 7. Minor: Unused `columns` state in SheetGenerator (LOW)

**Problem**: `columns` state is set but never used (hardcoded `COLS = 2`).

**Fix**: Either use the state or remove it.

---

## Expected Impact

| Fix | Impact | Before | After |
|-----|--------|--------|-------|
| #1 History selector | HIGH | Re-render on every store change | Only re-render when stats change |
| #2 Timer interval | HIGH | 10 store updates/sec | 1 store update/sec |
| #3 Answers sync | HIGH | 60 answers × 500ms | Only new answers |
| #4 Memo wrappers | MEDIUM | Always re-render | Stable memo comparison |
| #5 useCallback | MEDIUM | Callback recreated often | Stable callback |
| #6 Page memo | MEDIUM | Re-render on context | Skip when props same |

## Verification Steps

1. Run `npm run build` to verify no TypeScript errors
2. Run `npm run lint` to verify no lint errors
3. Run `npm test` to verify tests pass
4. Manual testing: Home page should not re-render during active sessions
5. Manual testing: Multiplayer timer should be smooth without excessive re-renders
