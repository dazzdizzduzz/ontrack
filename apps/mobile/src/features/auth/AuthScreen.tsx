import { color, radius, space } from '@on-track/tokens';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { TopAppBar } from '@/components/ui/TopAppBar';
import { textStyle } from '@/theme/text';

type AuthScreenProps = {
  /** Judul Top App Bar. Tanpa judul, bar tidak ditampilkan. */
  appBarTitle?: string;
  footer: ReactNode;
  children: ReactNode;
};

/** Kerangka layar reset kata sandi: app bar, isi yang bisa di-scroll, dan tombol di bawah. */
export function AuthScreen({ appBarTitle, footer, children }: AuthScreenProps) {
  const { top, bottom } = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {appBarTitle ? (
        <TopAppBar
          title={appBarTitle}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
        />
      ) : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          !appBarTitle && { paddingTop: top + space[24] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(space[32], bottom) }]}>{footer}</View>
    </KeyboardAvoidingView>
  );
}

export function AuthIconBadge({ name }: { name: IconName }) {
  return (
    <View style={styles.badge}>
      <Icon name={name} size={26.88} />
    </View>
  );
}

export function AuthHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: space[20],
    paddingHorizontal: space[20],
    paddingVertical: space[24],
  },
  footer: {
    gap: space[8],
    paddingTop: space[12],
    paddingHorizontal: space[20],
    backgroundColor: color.bg.surface,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: color.accent.subtle,
  },
  heading: {
    gap: space[8],
  },
  title: {
    ...textStyle('headingH1'),
    color: color.text.primary,
  },
  body: {
    ...textStyle('bodyM'),
    color: color.text.secondary,
  },
});
