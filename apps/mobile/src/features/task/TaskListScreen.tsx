import {
  isOverdue,
  sampleTaskNow,
  sampleTaskUserId,
  taskStatusLabels,
  type Task,
  type TaskStatus,
} from '@on-track/core';
import { color, radius, space } from '@on-track/tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/ui/BottomNav';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { mainTabs } from '@/components/ui/mainTabs';
import { textStyle } from '@/theme/text';
import { TaskCard } from './TaskCard';
import { clientLabel, useTasks } from './TaskProvider';

type Filter = TaskStatus | null;

const filters: Filter[] = [null, 'todo', 'in_progress', 'review', 'done'];

type Group = { key: string; label: string; tasks: Task[] };

/** Grup M06: Overdue dulu (tanpa angka), lalu per status dengan jumlah. */
function groupTasks(tasks: Task[]): Group[] {
  const overdue = tasks.filter((task) => isOverdue(task, sampleTaskNow));
  const rest = tasks.filter((task) => !overdue.includes(task));
  const groups: Group[] = overdue.length ? [{ key: 'overdue', label: 'Overdue', tasks: overdue }] : [];
  for (const status of ['in_progress', 'review', 'todo', 'done'] as const) {
    const list = rest.filter((task) => task.status === status);
    if (list.length) {
      groups.push({ key: status, label: `${taskStatusLabels[status]} · ${list.length}`, tasks: list });
    }
  }
  return groups;
}

/**
 * M06 · Task Saya dengan grup overdue, dan M22 · Kosong & offline. Pratinjau lewat `?state=`:
 * `kosong` (tanpa task) dan `offline` (banner offline + kosong, seperti Figma M22).
 */
export function TaskListScreen() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  const { top } = useSafeAreaInsets();
  const { tasks, projects, clients, people } = useTasks();
  const [filter, setFilter] = useState<Filter>(null);
  // MOCK: status jaringan belum dibaca dari perangkat (perlu @react-native-community/netinfo).
  const offline = state === 'offline';
  const empty = state === 'kosong' || offline;

  const mine = empty ? [] : tasks.filter((task) => task.assigneeId === sampleTaskUserId);
  const active = mine.filter((task) => task.status !== 'done');
  const visible = filter ? mine.filter((task) => task.status === filter) : active;
  const groups = groupTasks(visible);
  const initials = people.find((person) => person.id === sampleTaskUserId)?.initials ?? '?';

  function label(value: Filter) {
    if (!value) return `Semua · ${active.length}`;
    return taskStatusLabels[value];
  }

  return (
    <View style={styles.screen}>
      {offline && (
        <View accessibilityRole="alert" style={[styles.banner, { paddingTop: top + space[12] }]}>
          <Icon name="wifi-off" size={20} />
          <Text style={styles.bannerText}>Kamu sedang offline. Absensi akan disinkronkan saat tersambung.</Text>
        </View>
      )}
      <View style={[styles.bar, !offline && { paddingTop: top }]}>
        <View style={styles.barRow}>
          <Text accessibilityRole="header" style={styles.barTitle}>
            Task Saya
          </Text>
          {/* MOCK: urutan dan filter lanjutan belum didesain. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter task"
            onPress={() => Alert.alert('Filter task', 'Pilihan urutan dan filter lanjutan belum tersedia.')}
            style={styles.barAction}
          >
            <Icon name="filter" size={20} />
          </Pressable>
        </View>
      </View>

      {empty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Icon name="task-muted" size={28} />
          </View>
          <Text style={styles.emptyTitle}>Belum ada task hari ini</Text>
          <Text style={styles.emptyText}>
            Task yang ditugaskan Team Lead akan muncul di sini. Tarik ke bawah untuk memuat ulang saat online.
          </Text>
          <Button variant="secondary" label="Muat ulang" icon="refresh" onPress={() => router.replace('/task')} />
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chips}
          >
            {filters.map((value) => {
              const selected = value === filter;
              return (
                <Pressable
                  key={value ?? 'semua'}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  aria-pressed={selected}
                  onPress={() => setFilter(value)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  {selected && <Icon name="check-inverse" size={16} />}
                  <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label(value)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ScrollView contentContainerStyle={styles.content}>
            {groups.map((group) => (
              <View key={group.key} style={styles.group}>
                <Text accessibilityRole="header" style={styles.groupLabel}>
                  {group.label}
                </Text>
                {group.tasks.map((task) => {
                  const project = projects.find((item) => item.id === task.projectId);
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      client={clientLabel(clients.find((item) => item.id === project?.clientId))}
                      initials={initials}
                      onPress={() => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
                    />
                  );
                })}
              </View>
            ))}
            {groups.length === 0 && <Text style={styles.none}>Tidak ada task dengan status ini.</Text>}
          </ScrollView>
        </>
      )}
      <BottomNav items={mainTabs} active="Task" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg.canvas,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    paddingHorizontal: space[16],
    paddingBottom: space[12],
    backgroundColor: color.bg.inverse,
  },
  bannerText: {
    ...textStyle('bodyS'),
    flex: 1,
    color: color.text.inverse,
  },
  bar: {
    borderBottomWidth: 1,
    borderBottomColor: color.border.default,
    backgroundColor: color.bg.surface,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    minHeight: 56,
    paddingLeft: space[16],
    paddingRight: space[4],
  },
  barTitle: {
    ...textStyle('headingH2'),
    flex: 1,
    color: color.text.primary,
  },
  barAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chips: {
    gap: space[8],
    paddingHorizontal: space[20],
    paddingVertical: space[8],
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
  content: {
    gap: space[20],
    paddingHorizontal: space[20],
    paddingTop: space[8],
    paddingBottom: space[24],
  },
  group: {
    gap: space[12],
  },
  groupLabel: {
    ...textStyle('labelS'),
    textTransform: 'none',
    color: color.text.secondary,
  },
  none: {
    ...textStyle('bodyS'),
    paddingVertical: space[24],
    color: color.text.secondary,
    textAlign: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[12],
    paddingHorizontal: space[32],
  },
  emptyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderWidth: 1,
    borderColor: color.border.default,
    borderRadius: radius.full,
    backgroundColor: color.bg.subtle,
  },
  emptyTitle: {
    ...textStyle('headingH3'),
    color: color.text.primary,
  },
  emptyText: {
    ...textStyle('bodyS'),
    color: color.text.secondary,
    textAlign: 'center',
  },
});
