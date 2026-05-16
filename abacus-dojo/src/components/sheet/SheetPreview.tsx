import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { SheetPDFDocument } from './SheetPDFDocument';
import type { Question } from '../../utils/questionGenerator';

interface SheetConfig {
  title?: string;
  includeNameField?: boolean;
  includeDateField?: boolean;
  includeAnswerKey?: boolean;
}

interface Props {
  config: SheetConfig;
  questions: Question[];
}

export function SheetPreview({ config, questions }: Props) {
  return (
    <div className="flex flex-col gap-6 w-full h-full">
      {/* Preview — same document component, rendered inline */}
      <div className="flex-1 min-h-[600px] border-4 border-ink rounded-2xl overflow-hidden shadow-[4px_4px_0_0_var(--color-ink)] bg-gray-50 dark:bg-gray-900">
        <PDFViewer width="100%" height="100%" className="border-0">
          <SheetPDFDocument config={config} questions={questions} />
        </PDFViewer>
      </div>

      {/* Download */}
      <div className="flex justify-end">
        <PDFDownloadLink
          document={<SheetPDFDocument config={config} questions={questions} />}
          fileName={`${config.title || 'abacus-sheet'}.pdf`}
        >
          {({ loading }) => (
            <button
              className="px-8 py-4 bg-teal text-white rounded-2xl border-4 border-teal-dark font-bold text-xl hover:bg-teal-light hover:-translate-y-1 hover:shadow-[0_6px_0_0_var(--color-teal-dark)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          )}
        </PDFDownloadLink>
      </div>
    </div>
  );
}
