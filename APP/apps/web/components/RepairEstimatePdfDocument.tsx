import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const GREY_900 = '#1a1a1a';
const GREY_600 = '#666666';
const GREY_200 = '#e5e5e5';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', color: GREY_900 },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: GREY_600 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 10 },
  description: { fontSize: 10, marginBottom: 16, color: GREY_600 },
  table: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: GREY_200,
    borderLeftWidth: 1,
    borderLeftColor: GREY_200,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: GREY_200,
    borderRightWidth: 1,
    borderRightColor: GREY_200,
    minHeight: 28,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: GREY_200,
    borderRightWidth: 1,
    borderRightColor: GREY_200,
    minHeight: 24,
    alignItems: 'center',
  },
  cell: { paddingHorizontal: 8, paddingVertical: 5, justifyContent: 'center' },
  headerCell: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontFamily: 'Helvetica-Bold',
    justifyContent: 'center',
  },
  colName: { width: '40%' },
  colCategory: { width: '20%' },
  colCost: { width: '20%' },
  colTotal: { width: '20%' },
  totalRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'flex-end',
    gap: 8,
  },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    width: 100,
    textAlign: 'right',
  },
  footer: { marginTop: 30, fontSize: 8, color: GREY_600, textAlign: 'center' },
});

interface Props {
  property: {
    name: string;
    address: string;
    city: string;
    country: string;
  };
  description: string;
  lineItems: Array<{ name: string; cost: number; category: string }>;
  generatedAt: Date;
}

function fmtDate(d: Date): string {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function RepairEstimatePdfDocument({ property, description, lineItems, generatedAt }: Props) {
  const grandTotal = lineItems.reduce((sum, item) => sum + item.cost, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{property.name}</Text>
          <Text style={styles.subtitle}>
            {property.address}, {property.city}, {property.country}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Repair Estimate</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, styles.colName]}>
              <Text>Item</Text>
            </View>
            <View style={[styles.headerCell, styles.colCategory]}>
              <Text>Category</Text>
            </View>
            <View style={[styles.headerCell, styles.colCost]}>
              <Text>Cost</Text>
            </View>
          </View>

          {lineItems.map((item, i) => (
            <View key={i} style={styles.row}>
              <View style={[styles.cell, styles.colName]}>
                <Text>{item.name}</Text>
              </View>
              <View style={[styles.cell, styles.colCategory]}>
                <Text>{item.category}</Text>
              </View>
              <View style={[styles.cell, styles.colCost]}>
                <Text>€{item.cost.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Estimate</Text>
          <Text style={styles.totalValue}>€{grandTotal.toFixed(2)}</Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Generated on {fmtDate(generatedAt)} · Concierge Repair Estimate
          </Text>
        </View>
      </Page>
    </Document>
  );
}
