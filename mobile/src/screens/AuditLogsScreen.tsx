import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Avatar, Card, Chip, Text } from 'react-native-paper';
import { api } from '../api/client';
import type { AuditLog } from '../api/types';
import { EmptyStateCard } from '../ui/EmptyStateCard';
import { SectionHeader } from '../ui/SectionHeader';
import { appColors } from '../theme/theme';

export function AuditLogsScreen() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/audit-logs', { params: { limit: 100 } });
      setLogs((data.logs ?? []) as AuditLog[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <FlatList
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      data={logs}
      keyExtractor={(l) => l.id}
      ItemSeparatorComponent={() => <View style={styles.spacer} />}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.heroCard}>
            <Text variant="titleMedium" style={styles.heroTitle}>
              Audit Logs
            </Text>
            <Text variant="bodyMedium" style={styles.heroSubtitle}>
              Track important actions across the platform
            </Text>
            <View style={styles.heroStatBox}>
              <Text variant="headlineSmall" style={styles.heroStatValue}>
                {logs.length}
              </Text>
              <Text variant="labelMedium" style={styles.heroStatLabel}>
                Recent Logs
              </Text>
            </View>
          </View>
          <SectionHeader title="Activity Feed" subtitle="Traceability for sign in, readings, and updates" />
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Title
            title={item.action}
            subtitle={new Date(item.createdAt).toLocaleString()}
            left={(props) => <Avatar.Icon {...props} icon="clipboard-text-clock-outline" style={styles.avatar} />}
          />
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium">
              {item.entityType}
              {item.entityId ? ` • ${item.entityId}` : ''}
            </Text>
            <View style={styles.row}>
              <Chip compact icon="account">
                {item.actorUser?.email ?? 'System'}
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.mutedText}>
              Logged action for auditing and traceability.
            </Text>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <EmptyStateCard
          title="No audit logs"
          subtitle="Actions like sign in, reading creation, and device updates will appear here."
          icon="clipboard-search-outline"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  headerWrap: {
    marginBottom: 12,
  },
  spacer: {
    height: 12,
  },
  heroCard: {
    backgroundColor: appColors.heroDark,
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#D7E4F1',
    marginTop: 4,
    marginBottom: 14,
  },
  heroStatBox: {
    width: 120,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroStatLabel: {
    color: '#D3E2F2',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
  },
  avatar: {
    backgroundColor: '#FEF3C7',
  },
  cardContent: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  mutedText: {
    color: appColors.textMuted,
  },
});
