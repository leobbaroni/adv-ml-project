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
  colQty: { width: '15%' },
  colUnit: { width: '20%' },
  colTotal: { width: '25%' },
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
  items: Array<{ name: string; qty: number; unitPrice: number | null }>;
  generatedAt: Date;
}

function fmtDate(d: Date): string {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function InvoicePdfDocument({ property, items, generatedAt }: Props) {
  const grandTotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? 0) * item.qty,
    0,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{property.name}</Text>
          <Text style={styles.subtitle}>
            {property.address}, {property.city}, {property.country}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Invoice</Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, styles.colName]}>
              <Text>Item</Text>
            </View>
            <View style={[styles.headerCell, styles.colQty]}>
              <Text>Qty</Text>
            </View>
            <View style={[styles.headerCell, styles.colUnit]}>
              <Text>Unit Price</Text>
            </View>
            <View style={[styles.headerCell, styles.colTotal]}>
              <Text>Total</Text>
            </View>
          </View>

          {items.map((item, i) => {
            const total = (item.unitPrice ?? 0) * item.qty;
            return (
              <View key={i} style={styles.row}>
                <View style={[styles.cell, styles.colName]}>
                  <Text>{item.name}</Text>
                </View>
                <View style={[styles.cell, styles.colQty]}>
                  <Text>{item.qty}</Text>
                </View>
                <View style={[styles.cell, styles.colUnit]}>
                  <Text>
                    {item.unitPrice != null
                      ? `€${item.unitPrice.toFixed(2)}`
                      : '—'}
                  </Text>
                </View>
                <View style={[styles.cell, styles.colTotal]}>
                  <Text>
                    {item.unitPrice != null
                      ? `€${total.toFixed(2)}`
                      : '—'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalValue}>€{grandTotal.toFixed(2)}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Generated at {fmtDate(generatedAt)}</Text>
        </View>
      </Page>
    </Document>
  );
}
