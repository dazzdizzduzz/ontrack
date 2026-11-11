import { formLeaveTypes, leaveFormLabels, type LeaveType } from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';

type FormType = LeaveType;

const icons: Record<FormType, IconName> = { cuti: 'calendar', izin: 'flag', sakit: 'paperclip', wfh: 'map' };

type TypeSheetProps = {
  visible: boolean;
  value: FormType;
  /** Sisa kuota untuk keterangan "Memotong kuota · sisa 9 hari". */
  remaining: number;
  onSelect: (type: FormType) => void;
  onClose: () => void;
};

/** M38 · Pilih jenis pengajuan (bottom sheet). Pilihan langsung berlaku. */
export function TypeSheet({ visible, value, remaining, onSelect, onClose }: TypeSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const descriptions: Record<FormType, string> = {
    cuti: `Memotong kuota · sisa ${remaining} hari`,
    izin: 'Tidak memotong kuota cuti',
    sakit: 'Lampirkan surat dokter bila lebih dari 1 hari',
    wfh: 'Tidak memotong kuota · disetujui Team Lead',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup" style={styles.scrim} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(space[32], bottom) }]}>
          <View style={styles.handle} />
          <Text accessibilityRole="header" style={styles.title}>
            Jenis pengajuan
          </Text>
          <View accessibilityRole="radiogroup">
            {formLeaveTypes.map((type) => {
              const selected = type === value;
              return (
                <Pressable
                  key={type}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  aria-checked={selected}
                  onPress={() => onSelect(type)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={[styles.icon, selected && styles.iconSelected]}>
                    <Icon name={icons[type]} size={24} />
                  </View>
                  <View style={styles.text}>
                    <Text style={styles.optionTitle}>{leaveFormLabels[type]}</Text>
                    <Text style={styles.optionMeta}>{descriptions[type]}</Text>
                  </View>
                  {selected && <Icon name="check-24" size={24} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: color.bg.scrim,
  },
  sheet: {
    gap: space[4],
    paddingTop: space[12],
    paddingHorizontal: space[24],
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    marginBottom: space[8],
    borderRadius: 2,
    backgroundColor: color.border.strong,
  },
  title: {
    ...textStyle('headingH2'),
    marginBottom: space[8],
    color: color.text.primary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    minHeight: 68,
    paddingHorizontal: space[12],
    paddingVertical: space[12],
    borderRadius: radius.md,
  },
  optionSelected: {
    backgroundColor: color.bg.subtle,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: color.bg.subtle,
  },
  iconSelected: {
    backgroundColor: color.accent.default,
  },
  text: {
    flex: 1,
    gap: space[2],
  },
  optionTitle: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  optionMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
});
