import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Avatar, Card, Chip, Text } from 'react-native-paper';
import { api } from '../api/client';
import { EmptyStateCard } from '../ui/EmptyStateCard';
import { SectionHeader } from '../ui/SectionHeader';
import { appColors } from '../theme/theme';

export function DevicesScreen() {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/devices');
      setDevices((data.devices ?? []) as any[]);
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
      data={devices}
      keyExtractor={(d) => d.id}
      ItemSeparatorComponent={() => <View style={styles.spacer} />}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.heroCard}>
            <Text variant="titleMedium" style={styles.heroTitle}>
              Devices
            </Text>
            <Text variant="bodyMedium" style={styles.heroSubtitle}>
              Assigned healthcare monitoring devices
            </Text>
            <View style={styles.heroStatBox}>
              <Text variant="headlineSmall" style={styles.heroStatValue}>
                {devices.length}
              </Text>
              <Text variant="labelMedium" style={styles.heroStatLabel}>
                Total Devices
              </Text>
            </View>
          </View>
          <SectionHeader title="Device Records" subtitle="Current connected and assigned devices" />
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Title
            title={`${item.type}`}
            subtitle={`${item.serial}`}
            left={(props) => <Avatar.Icon {...props} icon="watch-variant" style={styles.avatar} />}
          />
          <Card.Content style={styles.cardContent}>
            <View style={styles.row}>
              <Chip compact icon="check-decagram">
                {item.status}
              </Chip>
              {item.patient?.mrn ? <Chip compact icon="account-heart">{item.patient.mrn}</Chip> : null}
            </View>
            <Text variant="bodySmall" style={styles.mutedText}>
              Device assigned for health reading collection and monitoring.
            </Text>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <EmptyStateCard
          title="No devices found"
          subtitle="Assigned devices will appear here when linked to patients."
          icon="watch-variant"
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
    backgroundColor: '#CCFBF1',
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
