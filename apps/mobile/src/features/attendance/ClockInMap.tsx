import { color, radius } from '@on-track/tokens';
import { Image } from 'expo-image';
import { StyleSheet, View, type ImageStyle } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import type { GeofenceResult } from '@on-track/core';

/** Posisi relatif ke titik kantor di tengah peta, dalam piksel Figma (M03, M07, M29). */
const youOffset = { 'dalam-area': { x: 36, y: 26 }, 'luar-area': { x: 138, y: 74 } };
const ACCURACY_OFFSET = { x: 91, y: 15 };

/** Kotak berukuran w×h yang titik tengahnya bergeser (x, y) dari tengah peta. */
function centered(x: number, y: number, w: number, h: number, rotate?: string): ImageStyle {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: w,
    height: h,
    marginLeft: x - w / 2,
    marginTop: y - h / 2,
    transform: rotate ? [{ rotate }] : undefined,
  };
}

type ClockInMapProps = {
  result: GeofenceResult;
  height?: number;
  label: string;
};

/** Ilustrasi peta dari Figma, bukan peta sungguhan. Semua posisi dihitung dari titik kantor. */
export function ClockInMap({ result, height = 190, label }: ClockInMapProps) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={[styles.map, { height }]}>
      <View style={[styles.road, centered(9, -18, 400, 14)]} />
      <View style={[styles.road, centered(-15, 5, 12, 240)]} />
      <View style={[styles.road, centered(-6, 103, 420, 8, '12deg')]} />
      <View style={[styles.road, centered(100, 3, 8, 240, '-8deg')]} />
      <Image
        source={require('@/assets/images/geofence-radius.png')}
        style={centered(0, 0, 150, 150)}
        accessible={false}
      />
      {result === 'gps-lemah' && (
        <Image
          source={require('@/assets/images/gps-accuracy.png')}
          style={centered(ACCURACY_OFFSET.x, ACCURACY_OFFSET.y, 240, 240)}
          accessible={false}
        />
      )}
      <View style={centered(0, 0, 20, 20)}>
        <Icon name="map-office" size={20} />
      </View>
      {result !== 'gps-lemah' && (
        <View style={centered(youOffset[result].x, youOffset[result].y, 18, 18)}>
          <Icon name={result === 'luar-area' ? 'map-you-outside' : 'map-you'} size={18} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: color.bg.canvas,
  },
  road: {
    backgroundColor: color.bg.surface,
  },
});
