import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import type { Question } from '../../utils/questionGenerator';

const styles = StyleSheet.create({
  page:         { padding: 40, fontFamily: 'Helvetica' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title:        { fontSize: 14, fontWeight: 'bold' },
  fieldRow:     { flexDirection: 'row', gap: 40, marginBottom: 16 },
  fieldLabel:   { fontSize: 10 },
  fieldLine:    { borderBottom: '1pt solid black', width: 120, marginTop: 10 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  questionCell: { border: '1pt solid #ccc', padding: 8, minHeight: 80 },
  questionNum:  { fontSize: 8, color: '#888', marginBottom: 4 },
  operand:      { fontSize: 16, textAlign: 'right', fontFamily: 'Courier' },
  divider:      { borderTop: '1pt solid black', marginTop: 4, marginBottom: 4 },
  answerBox:    { height: 24, borderBottom: '1pt solid black' },
  footer:       { position: 'absolute', bottom: 20, left: 40, right: 40,
                  flexDirection: 'row', justifyContent: 'space-between' },
  footerText:   { fontSize: 8, color: '#aaa' },
});

interface SheetConfig {
  title?: string;
  includeNameField?: boolean;
  includeDateField?: boolean;
  includeAnswerKey?: boolean;
  questionsPerRow?: number;
}

interface Props {
  config: SheetConfig;
  questions: Question[];
}

export function SheetPDFDocument({ config, questions }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{config.title || 'Abacus Practice Sheet'}</Text>
        </View>

        {/* Name / Date fields */}
        {(config.includeNameField || config.includeDateField) && (
          <View style={styles.fieldRow}>
            {config.includeNameField && (
              <View><Text style={styles.fieldLabel}>Name</Text><View style={styles.fieldLine} /></View>
            )}
            {config.includeDateField && (
              <View><Text style={styles.fieldLabel}>Date</Text><View style={styles.fieldLine} /></View>
            )}
          </View>
        )}

        {/* Question Grid */}
        <View style={styles.grid}>
          {questions.map((q, i) => {
            const cellWidth = `${100 / (config.questionsPerRow || 2) - 2}%`;
            return (
            <View key={i} style={[styles.questionCell, { width: cellWidth }]}>
              <Text style={styles.questionNum}>Q{i + 1}</Text>
              {q.operands.map((op, j) => (
                <Text key={j} style={styles.operand}>
                  {j === 0 ? '  ' : op < 0 ? '− ' : '+ '}
                  {Math.abs(op)}
                </Text>
              ))}
              <View style={styles.divider} />
              {config.includeAnswerKey
                ? <Text style={styles.operand}>{q.answer}</Text>
                : <View style={styles.answerBox} />}
            </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>kazoe.app</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`} fixed />
        </View>
      </Page>
    </Document>
  );
}
