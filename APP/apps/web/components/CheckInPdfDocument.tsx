import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const GREY_900 = '#1a1a1a';
const GREY_600 = '#666666';
const GREY_200 = '#e5e5e5';
const ACCENT = '#d97706';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', color: GREY_900 },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: GREY_600 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: ACCENT },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: 120, color: GREY_600, fontSize: 9 },
  value: { flex: 1, fontSize: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: GREY_200, marginVertical: 12 },
  footer: { marginTop: 20, fontSize: 8, color: GREY_600, textAlign: 'center' },
});

interface CheckInPdfProps {
  property: {
    name: string;
    address: string;
    city: string;
    country: string;
    wifiName?: string | null;
    wifiPassword?: string | null;
    lockCode?: string | null;
    arrivalInstructions?: string | null;
    ownerName?: string | null;
    ownerContact?: string | null;
  };
  reservation: {
    summary: string;
    startDate: string;
    endDate: string;
  };
  form: {
    fullName?: string | null;
    country?: string | null;
    citizenId?: string | null;
    dob?: string | null;
    submittedAt?: string | null;
  } | null;
  generatedAt: string;
}

export function CheckInPdfDocument({ property, reservation, form, generatedAt }: CheckInPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{property.name}</Text>
          <Text style={styles.subtitle}>
            {property.address}, {property.city}, {property.country}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reservation</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Guest</Text>
            <Text style={styles.value}>{reservation.summary}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-in</Text>
            <Text style={styles.value}>{reservation.startDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Check-out</Text>
            <Text style={styles.value}>{reservation.endDate}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property info</Text>
          {property.wifiName && (
            <View style={styles.row}>
              <Text style={styles.label}>Wi-Fi</Text>
              <Text style={styles.value}>{property.wifiName}</Text>
            </View>
          )}
          {property.wifiPassword && (
            <View style={styles.row}>
              <Text style={styles.label}>Password</Text>
              <Text style={styles.value}>{property.wifiPassword}</Text>
            </View>
          )}
          {property.lockCode && (
            <View style={styles.row}>
              <Text style={styles.label}>Lock code</Text>
              <Text style={styles.value}>{property.lockCode}</Text>
            </View>
          )}
          {property.arrivalInstructions && (
            <View style={styles.row}>
              <Text style={styles.label}>Instructions</Text>
              <Text style={styles.value}>{property.arrivalInstructions}</Text>
            </View>
          )}
          {property.ownerContact && (
            <View style={styles.row}>
              <Text style={styles.label}>Host contact</Text>
              <Text style={styles.value}>{property.ownerContact}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest registration</Text>
          {form?.submittedAt ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Full name</Text>
                <Text style={styles.value}>{form.fullName ?? '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Country</Text>
                <Text style={styles.value}>{form.country ?? '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>ID / Passport</Text>
                <Text style={styles.value}>{form.citizenId ?? '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date of birth</Text>
                <Text style={styles.value}>{form.dob ?? '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Submitted</Text>
                <Text style={styles.value}>{form.submittedAt}</Text>
              </View>
            </>
          ) : (
            <Text style={{ color: GREY_600, fontSize: 10 }}>Not submitted yet.</Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text>Generated by Concierge on {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}
