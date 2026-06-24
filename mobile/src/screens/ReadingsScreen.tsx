import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Chip, SegmentedButtons, Text, TextInput } from 'react-native-paper';
import { api } from '../api/client';
import type { DeviceType, Reading } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { getSocket } from '../realtime/socketClient';
import { appColors } from '../theme/theme';
import { EmptyStateCard } from '../ui/EmptyStateCard';
import { getReadingIcon } from '../ui/icons';
import { SectionHeader } from '../ui/SectionHeader';

export function ReadingsScreen() {
  const { token, user } = useAuth();
  const role = user?.role;
  const [loading, setLoading] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [type, setType] = useState<DeviceType | 'ALL'>('ALL');
  const [patientId, setPatientId] = useState<string>('');

  const effectivePatientId = useMemo(() => {
    if (role === 'PATIENT') return user?.patientId ?? '';
    return patientId.trim();
  }, [patientId, role, user?.patientId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (type !== 'ALL') params.type = type;
      if (effectivePatientId) params.patientId = effectivePatientId;
      const { data } = await api.get('/readings', { params });
      setReadings((data.readings ?? []) as Reading[]);
    } finally {
      setLoading(false);
    }
  }, [effectivePatientId, type]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    const handler = (reading: Reading) => {
      if (type !== 'ALL' && reading.type !== type) return;
      if (effectivePatientId && reading.patientId !== effectivePatientId) return;
      setReadings((prev) => [reading, ...prev].slice(0, 100));
    };

    socket.on('reading:new', handler);

    if (role === 'PATIENT' && user?.patientId) {
      socket.emit('patient:subscribe', user.patientId);
    }

    return () => {
      socket.off('reading:new', handler);
    };
  }, [effectivePatientId, role, token, type, user?.patientId]);

  async function createReadingForPatient() {
    if (!user?.patientId) return;
    const nextType: DeviceType = type === 'ALL' ? 'BLOOD_PRESSURE' : (type as DeviceType);
    await api.post(`/patients/${user.patientId}/readings`, { type: nextType });
  }

  return (
    <FlatList
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      data={readings}
      keyExtractor={(r) => r.id}
      ItemSeparatorComponent={() => <View style={styles.spacer} />}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.heroCard}>
            <Text variant="titleMedium" style={styles.heroTitle}>
              {role === 'PATIENT' ? 'My Readings' : 'Health Readings'}
            </Text>
            <Text variant="bodyMedium" style={styles.heroSubtitle}>
              Live ECG, blood pressure, and glucose updates
            </Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatBox}>
                <Text variant="headlineSmall" style={styles.heroStatValue}>
                  {readings.length}
                </Text>
                <Text variant="labelMedium" style={styles.heroStatLabel}>
                  Loaded
                </Text>
              </View>
              <View style={styles.heroStatBox}>
                <Text variant="headlineSmall" style={styles.heroStatValue}>
                  {type === 'ALL' ? 'All' : type === 'BLOOD_PRESSURE' ? 'BP' : type}
                </Text>
                <Text variant="labelMedium" style={styles.heroStatLabel}>
                  Filter
                </Text>
              </View>
              <View style={styles.heroStatBox}>
                <Text variant="headlineSmall" style={styles.heroStatValue}>
                  Live
                </Text>
                <Text variant="labelMedium" style={styles.heroStatLabel}>
                  Sync
                </Text>
              </View>
            </View>
          </View>
          <SectionHeader title="Readings Feed" subtitle="Latest clinical measurements and activity" />
          {role !== 'PATIENT' ? (
            <Card style={styles.card}>
              <Card.Title title="Filter Readings" subtitle="Search by patient and reading type" />
              <Card.Content>
                <TextInput
                  mode="outlined"
                  label="Patient ID (optional)"
                  value={patientId}
                  onChangeText={setPatientId}
                  autoCapitalize="none"
                />
              </Card.Content>
              <Card.Actions>
                <Button onPress={load}>Apply</Button>
              </Card.Actions>
            </Card>
          ) : (
            <Card style={styles.heroCard}>
              <Card.Title
                title="Real-time readings"
                subtitle="New readings appear instantly on this screen"
                left={(props) => <Avatar.Icon {...props} icon="chart-line" style={styles.heroAvatar} />}
              />
              <Card.Actions>
                <Button mode="contained" onPress={createReadingForPatient} contentStyle={styles.buttonContent}>
                  Add reading
                </Button>
              </Card.Actions>
            </Card>
          )}

          <SegmentedButtons
            value={type}
            onValueChange={(v) => setType(v as any)}
            buttons={[
              { value: 'ALL', label: 'All' },
              { value: 'ECG', label: 'ECG' },
              { value: 'BLOOD_PRESSURE', label: 'BP' },
              { value: 'GLUCOSE', label: 'Glucose' },
            ]}
          />
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <Card.Title
            title={item.type}
            subtitle={new Date(item.recordedAt).toLocaleString()}
            left={(props) => <Avatar.Icon {...props} icon={getReadingIcon(item.type)} style={styles.readingAvatar} />}
          />
          <Card.Content style={styles.cardContent}>
            <View style={styles.row}>
              {role !== 'PATIENT' ? <Chip compact icon="account-heart">{item.patientId}</Chip> : null}
              <Chip compact icon={getReadingIcon(item.type)}>
                {item.type}
              </Chip>
            </View>
            <Text variant="bodySmall" style={styles.payloadText}>
              {JSON.stringify(item.payload)}
            </Text>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <EmptyStateCard
          title="No readings found"
          subtitle="Try a different filter or create a sample reading."
          icon="chart-box-outline"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  spacer: {
    height: 12,
  },
  headerWrap: {
    gap: 12,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: appColors.heroDark,
    borderRadius: 28,
    padding: 18,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#D7E4F1',
    marginTop: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  heroStatBox: {
    flex: 1,
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
  heroAvatar: {
    backgroundColor: '#EAF2FF',
  },
  readingAvatar: {
    backgroundColor: '#EAF2FF',
  },
  cardContent: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  payloadText: {
    color: appColors.textMuted,
    lineHeight: 20,
  },
  buttonContent: {
    height: 44,
  },
});
