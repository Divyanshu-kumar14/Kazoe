import { useAppStore } from '../../store/useAppStore';
import { SOROBAN_LEVELS } from '../../utils/levelConfig';

export function SheetConfigForm() {
  const config = useAppStore((s) => s.sheetConfig);
  const setConfig = useAppStore((s) => s.setSheetConfig);

  return (
    <div className="flex flex-col gap-6 p-8 bg-white dark:bg-gray-800 rounded-3xl border-4 border-ink shadow-[8px_8px_0_0_var(--color-ink)]">
      <h2 className="text-3xl font-heading font-bold text-ink">Configuration</h2>

      <div className="flex flex-col gap-4">
        {/* Title */}
        <label className="flex flex-col gap-2">
          <span className="font-bold text-lg">Title</span>
          <input
            type="text"
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 font-medium focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all"
            value={config.title}
            onChange={(e) => setConfig({ title: e.target.value })}
            placeholder="e.g., Level 7 Practice"
          />
        </label>

        {/* Level */}
        <label className="flex flex-col gap-2">
          <span className="font-bold text-lg">Level Preset</span>
          <select
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 font-medium focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all cursor-pointer"
            value={config.level}
            onChange={(e) => setConfig({ level: Number(e.target.value) })}
          >
            {Object.keys(SOROBAN_LEVELS).sort((a,b) => Number(a) - Number(b)).map((lvl) => (
              <option key={lvl} value={lvl}>
                Level {lvl}
              </option>
            ))}
          </select>
        </label>

        {/* Rows */}
        <label className="flex flex-col gap-2">
          <span className="font-bold text-lg">Rows (Operands)</span>
          <select
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 font-medium focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all cursor-pointer"
            value={config.rowCountOverride || ''}
            onChange={(e) => {
              const val = e.target.value;
              setConfig({ rowCountOverride: val ? Number(val) : undefined });
            }}
          >
            <option value="">Default ({SOROBAN_LEVELS[config.level].rowCount})</option>
            {Array.from({ length: 9 }, (_, i) => i + 2).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {/* Questions Count */}
        <label className="flex flex-col gap-2">
          <span className="font-bold text-lg">Number of Questions</span>
          <select
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 font-medium focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all cursor-pointer"
            value={config.questionCount}
            onChange={(e) => setConfig({ questionCount: Number(e.target.value) })}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>

        {/* Questions Per Row */}
        <label className="flex flex-col gap-2">
          <span className="font-bold text-lg">Questions Per Row</span>
          <select
            className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-900 font-medium focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all cursor-pointer"
            value={config.questionsPerRow || 2}
            onChange={(e) => setConfig({ questionsPerRow: Number(e.target.value) })}
          >
            {Array.from({ length: 9 }, (_, i) => i + 2).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        {/* Toggles */}
        <div className="flex flex-col gap-3 mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border-2 border-gray-300 dark:border-gray-600">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-2 border-gray-300 text-teal focus:ring-teal/20"
              checked={config.includeNameField}
              onChange={(e) => setConfig({ includeNameField: e.target.checked })}
            />
            <span className="font-medium text-lg">Include Name Field</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-2 border-gray-300 text-teal focus:ring-teal/20"
              checked={config.includeDateField}
              onChange={(e) => setConfig({ includeDateField: e.target.checked })}
            />
            <span className="font-medium text-lg">Include Date Field</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-2 border-gray-300 text-teal focus:ring-teal/20"
              checked={config.includeAnswerKey}
              onChange={(e) => setConfig({ includeAnswerKey: e.target.checked })}
            />
            <span className="font-medium text-lg">Include Answer Key</span>
          </label>
        </div>
      </div>
    </div>
  );
}
