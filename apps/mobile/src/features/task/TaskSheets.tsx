import {
  taskPriorityLabels,
  taskStatusLabels,
  type TaskPriority,
  type TaskStatus,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';

export type DueFilter = 'semua' | 'hari-ini' | 'minggu-ini' | 'overdue';

export type TaskFilters = { status: TaskStatus | null; priority: TaskPriority | null; due: DueFilter };

export const emptyFilters: TaskFilters = { status: null, priority: null, due: 'semua' };

const dueLabels: Record<DueFilter, string> = {
  semua: 'Semua',
  'hari-ini': 'Hari ini',
  'minggu-ini': 'Minggu ini',
  overdue: 'Overdue',
};

/** Kerangka bottom sheet bersama M60 dan M61. */
function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tutup" style={styles.scrim} onPress={onClose} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(space[32], bottom) }]}>
          <View style={styles.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

function Chips<T extends string | null>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              aria-checked={selected}
              onPress={() => onChange(option.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              {selected && <Icon name="check-inverse" size={16} />}
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** M60 · Filter task: status, prioritas, tenggat. Berlaku setelah "Terapkan". */
export function FilterSheet({
  visible,
  value,
  onApply,
  onClose,
}: {
  visible: boolean;
  value: TaskFilters;
  onApply: (filters: TaskFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<TaskFilters>(value);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text accessibilityRole="header" style={styles.title}>
        Filter task
      </Text>
      <Chips
        label="Status"
        value={draft.status}
        onChange={(status) => setDraft((d) => ({ ...d, status }))}
        options={[
          { value: null, label: 'Semua' },
          ...(['todo', 'in_progress', 'review', 'done'] as const).map((status) => ({ value: status, label: taskStatusLabels[status] })),
        ]}
      />
      <Chips
        label="Prioritas"
        value={draft.priority}
        onChange={(priority) => setDraft((d) => ({ ...d, priority }))}
        options={[
          { value: null, label: 'Semua' },
          ...(['tinggi', 'sedang', 'rendah'] as const).map((priority) => ({ value: priority, label: taskPriorityLabels[priority] })),
        ]}
      />
      <Chips
        label="Tenggat"
        value={draft.due}
        onChange={(due) => setDraft((d) => ({ ...d, due }))}
        options={(Object.keys(dueLabels) as DueFilter[]).map((due) => ({ value: due, label: dueLabels[due] }))}
      />
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button fullWidth variant="secondary" label="Reset" onPress={() => setDraft(emptyFilters)} />
        </View>
        <View style={styles.action}>
          <Button fullWidth label="Terapkan" onPress={() => onApply(draft)} />
        </View>
      </View>
    </Sheet>
  );
}

/** M61 · Menu ⋯ detail task. */
export function TaskMenuSheet({
  visible,
  title,
  meta,
  items,
  onClose,
}: {
  visible: boolean;
  title: string;
  meta: string;
  items: { icon: IconName; label: string; onPress: () => void }[];
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.menuHead}>
        <Text accessibilityRole="header" style={styles.menuTitle}>
          {title}
        </Text>
        <Text style={styles.menuMeta}>{meta}</Text>
      </View>
      <View>
        {items.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={item.onPress}
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <Icon name={item.icon} size={20} />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
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
    gap: space[16],
    paddingTop: space[12],
    paddingHorizontal: space[20],
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: color.bg.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: color.border.default,
  },
  title: {
    ...textStyle('headingH2'),
    color: color.text.primary,
  },
  group: {
    gap: space[8],
  },
  groupLabel: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[8],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    minHeight: 38,
    paddingHorizontal: space[12],
    borderWidth: 1,
    borderColor: color.border.strong,
    borderRadius: radius.full,
    backgroundColor: color.bg.surface,
  },
  chipSelected: {
    borderColor: color.bg.inverse,
    backgroundColor: color.bg.inverse,
  },
  chipLabel: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  chipLabelSelected: {
    color: color.text.inverse,
  },
  actions: {
    flexDirection: 'row',
    gap: space[12],
  },
  action: {
    flex: 1,
  },
  menuHead: {
    gap: space[2],
  },
  menuTitle: {
    ...textStyle('headingH3'),
    color: color.text.primary,
  },
  menuMeta: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    minHeight: 52,
  },
  pressed: {
    opacity: 0.7,
  },
  menuLabel: {
    ...textStyle('bodyM'),
    color: color.text.primary,
  },
});
