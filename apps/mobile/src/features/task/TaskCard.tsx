import { formatTaskDue, isOverdue, sampleTaskNow, type Task } from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { textStyle } from '@/theme/text';
import { taskBadge } from './taskBadge';

/** Kartu task M06 (Figma "Task Card"). Overdue = garis merah + badge + jam merah (FR-20). */
export function TaskCard({
  task,
  client,
  initials,
  onPress,
}: {
  task: Task;
  client: string;
  initials: string;
  onPress: () => void;
}) {
  const late = isOverdue(task, sampleTaskNow);
  const badge = taskBadge(task);
  const due = task.revision?.due ?? task.due;
  const dueText = due ? formatTaskDue(due) : 'Tanpa tenggat';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${client}, ${badge.label}, tenggat ${dueText}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, late && styles.late, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <Text numberOfLines={1} style={styles.client}>
          {client}
        </Text>
        <Badge tone={badge.tone} label={badge.label} />
      </View>
      <Text style={styles.title}>{task.title}</Text>
      <View style={styles.row}>
        <View style={styles.due}>
          <Icon name={late ? 'clock-small-danger' : 'clock-small'} size={16} />
          <Text style={[styles.dueText, late && styles.dueLate]}>{dueText}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space[12],
    padding: space[16],
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.md,
    backgroundColor: color.bg.surface,
  },
  late: {
    borderWidth: 1.5,
    borderColor: color.status.dangerFg,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[8],
  },
  client: {
    ...textStyle('labelS'),
    flexShrink: 1,
    color: color.text.secondary,
  },
  title: {
    ...textStyle('labelM'),
    color: color.text.primary,
  },
  due: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  dueText: {
    ...textStyle('caption'),
    color: color.text.secondary,
  },
  dueLate: {
    color: color.status.dangerFg,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.accent.subtle,
  },
  avatarText: {
    ...textStyle('caption'),
    fontFamily: 'Inter_500Medium',
    color: color.text.accent,
  },
});
