import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';

interface ScheduleRow {
  property: { id: string; name: string; city: string; country: string };
  current: { summary: string; endDate: Date } | null;
  next: { summary: string; startDate: Date } | null;
  turnoverDays: number | null;
  hasOverlap: boolean;
}

interface Props {
  rows: ScheduleRow[];
  referenceDate: Date;
  generatedAt: Date;
}

const GREY_50 = '#f9fafb';
const GREY_100 = '#f3f4f6';
const GREY_200 = '#e5e7eb';
const GREY_400 = '#9ca3af';
const GREY_500 = '#6b7280';
const GREY_900 = '#111827';
const RED_500 = '#ef4444';

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
  overlapRow: {
    borderLeftWidth: 3,
    borderLeftColor: RED_500,
  },
  muted: {
    color: GREY_400,
  },
  smallMuted: {
    fontSize: 8,
    color: GREY_500,
    marginTop: 1,
  },
});

const COLS = [
  { key: 'property', width: '22%', label: 'Property' },
  { key: 'currentGuest', width: '19%', label: 'Current Guest' },
  { key: 'checkout', width: '12%', label: 'Check-out' },
  { key: 'nextGuest', width: '19%', label: 'Next Guest' },
  { key: 'checkin', width: '12%', label: 'Check-in' },
  { key: 'turnover', width: '10%', label: 'Turnover' },
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
                      col.key === 'checkin' ? GREY_50 : GREY_100,
                  },
                ]}
              >
                <Text>{col.label}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {rows.map((row, index) => (
            <View
              key={index}
              style={[
                styles.row,
                row.hasOverlap ? styles.overlapRow : {},
              ]}
            >
              {/* Property */}
              <View style={[styles.cell, { width: COLS[0].width }]}>
                <Text>{row.property.name}</Text>
                <Text style={styles.smallMuted}>
                  {row.property.city}, {row.property.country}
                </Text>
              </View>

              {/* Current Guest */}
              <View style={[styles.cell, { width: COLS[1].width }]}>
                {row.current ? (
                  <Text>{row.current.summary}</Text>
                ) : (
                  <Text style={styles.muted}>—</Text>
                )}
              </View>

              {/* Check-out */}
              <View style={[styles.cell, { width: COLS[2].width }]}>
                <Text>{fmt(row.current?.endDate)}</Text>
              </View>

              {/* Next Guest */}
              <View style={[styles.cell, { width: COLS[3].width }]}>
                {row.next ? (
                  <Text>{row.next.summary}</Text>
                ) : (
                  <Text style={styles.muted}>—</Text>
                )}
              </View>

              {/* Check-in */}
              <View
                style={[
                  styles.cell,
                  { width: COLS[4].width, backgroundColor: GREY_50 },
                ]}
              >
                <Text>{fmt(row.next?.startDate)}</Text>
              </View>

              {/* Turnover */}
              <View style={[styles.cell, { width: COLS[5].width }]}>
                <Text>
                  {row.turnoverDays !== null ? `${row.turnoverDays}d` : '—'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {rows.length === 0 && (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: GREY_400 }}>
              No properties or reservations found for this date.
            </Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
