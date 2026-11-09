import { color, radius, space } from '@on-track/tokens';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Alert } from '@/components/ui/Alert';
import { Icon } from '@/components/ui/Icon';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { textStyle } from '@/theme/text';

/** Data contoh dari Figma M26; belum tersambung ke API. */
const sample = {
  hours: '09.00 – 17.00',
  summary: 'Reguler · Senin–Jumat · WITA',
  days: [
    { name: 'Senin', working: true },
    { name: 'Selasa', working: true },
    { name: 'Rabu', working: true },
    { name: 'Kamis', working: true },
    { name: 'Jumat', working: true },
    { name: 'Sabtu', working: false },
    { name: 'Minggu', working: false },
  ],
  tolerance: '10 menit',
  overtimeAfter: '+30 menit dari jam pulang',
  overtimeLimit: '3 jam',
  location: 'Kantor Sanur',
  address: 'Jl. Danau Tamblingan No. 226, Sanur, Denpasar',
  radiusMeters: 100,
  selfieRequired: true,
};

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View accessible style={styles.keyValue}>
      <Text style={styles.keyValueLabel}>{label}</Text>
      <Text style={styles.keyValueValue}>{value}</Text>
    </View>
  );
}

/** Ilustrasi peta dari Figma, bukan peta sungguhan. */
function GeofenceMap() {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Peta lokasi kantor, radius ${sample.radiusMeters} meter`}
      style={styles.map}
    >
      <View style={styles.roadA} />
      <View style={styles.roadB} />
      <View style={styles.roadC} />
      <View style={styles.roadD} />
      <View style={styles.mapCenter}>
        <Image
          source={require('@/assets/images/geofence.png')}
          style={styles.geofence}
          contentFit="contain"
          accessible={false}
        />
        <View style={styles.pin}>
          <Icon name="map-pin-office" size={24} />
        </View>
      </View>
    </View>
  );
}

/** M26 · Jadwal & Lokasi Saya */
export function MyScheduleScreen() {
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <TopAppBar
        title="Jadwal & lokasi"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/beranda'))}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(space[24], bottom) }]}
      >
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Jadwal kerja
          </Text>
          <Text style={styles.hours}>{sample.hours}</Text>
          <Text style={styles.secondary}>{sample.summary}</Text>
          <View style={styles.days}>
            {sample.days.map((day) => (
              <View
                key={day.name}
                accessible
                accessibilityLabel={`${day.name}: ${day.working ? 'hari kerja' : 'libur'}`}
                style={[styles.day, day.working && styles.dayOn]}
              >
                <Text style={[styles.dayText, day.working && styles.dayTextOn]}>
                  {day.name.charAt(0)}
                </Text>
              </View>
            ))}
          </View>
          <KeyValue label="Toleransi terlambat" value={sample.tolerance} />
          <KeyValue label="Lembur dihitung" value={sample.overtimeAfter} />
          <KeyValue label="Batas lembur harian" value={sample.overtimeLimit} />
        </View>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Lokasi kantor
          </Text>
          <GeofenceMap />
          <Text style={styles.locationName}>{sample.location}</Text>
          <Text style={styles.secondary}>{sample.address}</Text>
          <KeyValue label="Radius geofence" value={`${sample.radiusMeters} m`} />
          <KeyValue label="Wajib selfie saat clock-in" value={sample.selfieRequired ? 'Ya' : 'Tidak'} />
        </View>

        <Alert tone="info" title="Diatur oleh HRD">
          Clock-in hanya bisa dalam radius {sample.radiusMeters} m. Hubungi HRD jika ada perubahan.
        </Alert>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.surface,
  },
  content: {
    gap: space[12],
    paddingTop: space[24],
    paddingHorizontal: space[20],
  },
  card: {
    gap: space[12],
    padding: space[16],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  cardTitle: {
    ...textStyle('headingH3'),
    color: color.text.primary,
  },
  hours: {
    ...textStyle('headingH1'),
    color: color.text.primary,
  },
  secondary: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  days: {
    flexDirection: 'row',
    gap: space[8],
  },
  day: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: color.bg.subtle,
  },
  dayOn: {
    backgroundColor: color.bg.inverse,
  },
  dayText: {
    ...textStyle('labelS'),
    color: color.text.disabled,
  },
  dayTextOn: {
    color: color.text.inverse,
  },
  keyValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space[12],
  },
  keyValueLabel: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
  },
  keyValueValue: {
    ...textStyle('labelM'),
    flexShrink: 1,
    color: color.text.primary,
    textAlign: 'right',
  },
  locationName: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  map: {
    height: 110,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: color.bg.canvas,
  },
  roadA: {
    position: 'absolute',
    top: 55,
    left: -40,
    width: 500,
    height: 14,
    backgroundColor: color.bg.surface,
  },
  roadB: {
    position: 'absolute',
    top: -65,
    left: 180,
    width: 12,
    height: 340,
    backgroundColor: color.bg.surface,
  },
  roadC: {
    position: 'absolute',
    top: 190,
    left: -40,
    width: 500,
    height: 8,
    backgroundColor: color.bg.surface,
    transform: [{ rotate: '8deg' }],
  },
  roadD: {
    position: 'absolute',
    top: -66,
    left: 330,
    width: 8,
    height: 340,
    backgroundColor: color.bg.surface,
    transform: [{ rotate: '-10deg' }],
  },
  mapCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geofence: {
    width: 96,
    height: 96,
  },
  pin: {
    position: 'absolute',
  },
});
