import { trackingPx, typography, type TypeStyle, type TypographyName } from '@on-track/tokens';
import type { TextStyle } from 'react-native';

const fontByWeight: Record<TypeStyle['weight'], string> = {
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
};

/** Mengubah token tipografi menjadi style React Native. */
export function textStyle(name: TypographyName): TextStyle {
  const style: TypeStyle = typography[name];
  return {
    fontFamily: fontByWeight[style.weight],
    fontSize: style.size,
    lineHeight: style.size * style.lineHeight,
    letterSpacing: trackingPx(style),
    textTransform: style.uppercase ? 'uppercase' : 'none',
  };
}
