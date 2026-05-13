import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';

interface FlatReservation {
  id: string;
  property: { id: string; name: string };
  summary: string;
  startDate: Date;
  endDate: Date;
  sourceLabel: string;
  status: string;
  nextCheckIn: Date | null;
}

interface Props {
  rows: FlatReservation[];
  referenceDate: Date;
  generatedAt: Date;
}

const GREY_50 = '#f9fafb';
const GREY_100 = '#f3f4f6';
const GREY_200 = '#e5e7eb';
const GREY_400 = '#9ca3af';
const GREY_500 = '#6b7280';
const GREY_900 = '#111827';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: GREY_900,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: GREY_500,
    marginBottom: 16,
  },
  table: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: GREY_200,
    borderLeftWidth: 1,
    borderLeftColor: GREY_200,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    borderBottomWidth: 1,
    borderBottomColor: GREY_200,
    borderRightWidth: 1,
    borderRightColor: GREY_200,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    backgroundColor: GREY_100,
    borderBottomWidth: 1,
    borderBottomColor: GREY_200,
    borderRightWidth: 1,
    borderRightColor: GREY_200,
  },
  cell: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    minHeight: 32,
    justifyContent: 'center',
  },
  headerCell: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    minHeight: 28,
    justifyContent: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  muted: {
    color: GREY_400,
  },
  smallMuted: {
    fontSize: 8,
    color: GREY_500,
    marginTop: 1,
  },
  suppressed: {
    opacity: 0.5,
  },
  strike: {
    textDecoration: 'line-through',
  },
});

const COLS = [
  { key: 'property', width: '28%', label: 'Property' },
  { key: 'checkin', width: '16%', label: 'Check-in' },
  { key: 'checkout', width: '16%', label: 'Check-out' },
  { key: 'nextCheckin', width: '16%', label: 'Next Check-in' },
  { key: 'source', width: '24%', label: 'Source' },
] as const;

function fmt(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function SchedulePdfDocument({
  rows,
  referenceDate,
  generatedAt,
}: Props) {
  return (
    <Document title="Schedule" author="Concierge">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.subtitle}>
          Reference date: {fmt(referenceDate)} · Generated at:{' '}
          {fmt(generatedAt)} {generatedAt.toISOString().slice(11, 16)}
        </Text>

        <View style={styles.table}>
          {/* Header */}
          <View style={styles.headerRow}>
            {COLS.map((col) => (
              <View
                key={col.key}
                style={[
                  styles.headerCell,
                  {
                    width: col.width,
                    backgroundColor:
                      col.key === 'nextCheckin' ? GREY_50 : GREY_100,
                  },
                ]}
              >
                <Text>{col.label}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {rows.map((row, index) => {
            const isSuppressed = row.status === 'SUPPRESSED';
            return (
              <View
                key={index}
                style={[
                  styles.row,
                  isSuppressed ? styles.suppressed : {},
                ]}
              >
                {/* Property */}
                <View style={[styles.cell, { width: COLS[0].width }]}>
                  <Text style={isSuppressed ? styles.strike : undefined}>
                    {row.property.name}
                  </Text>
                  <Text style={styles.smallMuted}>
                    {row.summary}
                  </Text>
                </View>

                {/* Check-in */}
                <View style={[styles.cell, { width: COLS[1].width }]}>
                  <Text style={isSuppressed ? styles.strike : undefined}>
                    {fmt(row.startDate)}
                  </Text>
                </View>

                {/* Check-out */}
                <View style={[styles.cell, { width: COLS[2].width }]}>
                  <Text style={isSuppressed ? styles.strike : undefined}>
                    {fmt(row.endDate)}
                  </Text>
                </View>

                {/* Next Check-in */}
                <View
                  style={[
                    styles.cell,
                    { width: COLS[3].width, backgroundColor: GREY_50 },
                  ]}
                >
                  <Text>{fmt(row.nextCheckIn)}</Text>
                </View>

                {/* Source */}
                <View style={[styles.cell, { width: COLS[4].width }]}>
                  <Text style={isSuppressed ? styles.muted : undefined}>
                    {row.sourceLabel}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {rows.length === 0 && (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: GREY_400 }}>
              No reservations found for this date.
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
