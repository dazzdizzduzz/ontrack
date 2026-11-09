import { color, radius, space } from '@on-track/tokens';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';

/**
 * Warna ilustrasi bahu dari Figma (M27). Bukan warna UI, jadi tidak ada di token;
 * hilang saat ilustrasi diganti foto kamera asli.
 */
const ILLUSTRATION_SHOULDERS = '#7A7875';

type SelfieViewfinderProps =
  /** `camera`: tampilan kamera depan asli di bawah bingkai wajah; tanpa itu, latar gelap Figma. */
  | { state: 'kamera'; height?: number; camera?: ReactNode }
  | { state: 'terdeteksi' | 'gagal'; height?: number; caption: string }
  /** Foto dari kamera asli. Deteksi wajah belum ada, jadi badge wajah tidak ditampilkan. */
  | { state: 'foto'; height?: number; caption: string; uri: string };

/**
 * Bingkai kamera (M03) dan pratinjau selfie (M27, M30). Contoh `?state=` memakai ilustrasi
 * Figma; mode perangkat memakai kamera depan dan foto asli.
 */
export function SelfieViewfinder(props: SelfieViewfinderProps) {
  if (props.state === 'kamera') {
    const height = props.height ?? 280;
    return (
      <View
        accessible
        accessibilityLabel="Kamera depan. Posisikan wajah di dalam bingkai."
        style={[styles.frame, { height }]}
      >
        {props.camera}
        <Image
          source={require('@/assets/images/face-guide.png')}
          style={[styles.centerX, { top: 36, width: 150, height: 190, marginLeft: -75 }]}
          accessible={false}
        />
        <Text style={[styles.hint, props.camera ? styles.hintOnCamera : null]}>
          Posisikan wajah di dalam bingkai
        </Text>
      </View>
    );
  }

  if (props.state === 'foto') {
    return (
      <View
        accessible
        accessibilityLabel={`Pratinjau selfie. ${props.caption}`}
        style={[styles.frame, { height: props.height ?? 236 }]}
      >
        <Image
          source={{ uri: props.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessible={false}
        />
        <Text style={[styles.caption, styles.captionOnPhoto]}>{props.caption}</Text>
      </View>
    );
  }

  const height = props.height ?? 236;
  // Posisi kepala dan bingkai mengikuti M27 (236px) dan bergeser rata tengah di M30 (200px).
  const shift = (height - 236) / 2;
  const detected = props.state === 'terdeteksi';

  return (
    <View
      accessible
      accessibilityLabel={`Pratinjau selfie. ${detected ? 'Wajah terdeteksi' : 'Wajah tidak terdeteksi'}. ${props.caption}`}
      style={[styles.frame, { height }]}
    >
      <Image
        source={require('@/assets/images/selfie-photo.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        accessible={false}
      />
      <Image
        source={require('@/assets/images/selfie-head.svg')}
        style={[styles.centerX, { top: 46 + shift, width: 96, height: 118, marginLeft: -48 }]}
        accessible={false}
      />
      <View style={[styles.centerX, styles.shoulders, { top: 170 + shift }]} />
      <Image
        source={
          detected
            ? require('@/assets/images/face-guide-ok.png')
            : require('@/assets/images/face-guide-fail.png')
        }
        style={[styles.centerX, { top: 26 + shift, width: 132, height: 168, marginLeft: -66 }]}
        accessible={false}
      />
      <View style={[styles.detection, detected ? styles.detected : styles.failed]}>
        <Icon name={detected ? 'check' : 'alert'} size={14} />
        <Text style={[styles.detectionText, !detected && styles.failedText]}>
          {detected ? 'Wajah terdeteksi' : 'Wajah tidak terdeteksi'}
        </Text>
      </View>
      <Text style={styles.caption}>{props.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: color.bg.inverse,
  },
  centerX: {
    position: 'absolute',
    left: '50%',
  },
  shoulders: {
    width: 210,
    height: 120,
    marginLeft: -105,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    backgroundColor: ILLUSTRATION_SHOULDERS,
  },
  hint: {
    ...textStyle('caption'),
    position: 'absolute',
    right: 0,
    bottom: 19,
    left: 0,
    color: color.text.inverse,
    textAlign: 'center',
  },
  detection: {
    position: 'absolute',
    top: space[12],
    left: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  detected: {
    backgroundColor: color.accent.default,
  },
  failed: {
    backgroundColor: color.status.dangerBg,
  },
  detectionText: {
    ...textStyle('labelS'),
    color: color.text.onAccent,
    textTransform: 'none',
  },
  failedText: {
    color: color.status.dangerFg,
  },
  caption: {
    ...textStyle('caption'),
    position: 'absolute',
    bottom: space[12],
    left: space[12],
    color: color.text.inverse,
  },
  hintOnCamera: {
    bottom: 0,
    paddingVertical: space[8],
    backgroundColor: color.bg.inverse,
  },
  /** Foto asli bisa terang, jadi teks diberi latar gelap agar tetap terbaca. */
  captionOnPhoto: {
    right: space[12],
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: color.bg.inverse,
  },
});
