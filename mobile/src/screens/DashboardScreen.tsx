import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Text } from 'react-native-paper';
import { api } from '../api/client';
import type { Reading } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { appColors } from '../theme/theme';
import { EmptyStateCard } from '../ui/EmptyStateCard';
import { getReadingIcon, getRoleIcon } from '../ui/icons';
import { ScreenContainer } from '../ui/ScreenContainer';
import { SectionHeader } from '../ui/SectionHeader';
import { StatCard } from '../ui/StatCard';

type Summary = {
  counts: { patients: number; devices: number; readings: number };
  latest: any[];
};

export function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [latestReadings, setLatestReadings] = useState<Reading[]>([]);
  const role = user?.role;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (role === 'PATIENT') {
        const { data } = await api.get('/readings', { params: { limit: 10 } });
        setLatestReadings((data.readings ?? []) as Reading[]);
        setSummary(null);
      } else {
        const { data } = await api.get('/dashboard/summary');
        setSummary(data as Summary);
      }
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenContainer scroll refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <View>
        <Card style={styles.heroCard}>
          <Card.Content style={styles.heroContent}>
            <View style={styles.heroTop}>
              <Avatar.Icon size={50} icon={getRoleIcon(user?.role)} style={styles.heroAvatar} color="#0D4D92" />
              <Button mode="text" textColor="#FFFFFF" onPress={signOut}>
                Sign out
              </Button>
            </View>
            <Text variant="headlineSmall" style={styles.heroTitle}>
              {role === 'PATIENT' ? 'My Health Dashboard' : 'Overview'}
            </Text>
            <Text variant="bodyLarge" style={styles.heroEmail}>
              {user?.email ?? 'User'}
            </Text>
            <Text variant="bodyMedium" style={styles.heroSubtitle}>
              {user?.role === 'PATIENT'
                ? 'Track your latest readings and connected devices.'
                : 'Monitor operational metrics, patients, and live incoming readings.'}
            </Text>

            {summary ? (
              <View style={styles.heroMetrics}>
                <View style={styles.heroMetricBox}>
                  <Text variant="headlineSmall" style={styles.heroMetricValue}>
                    {summary.counts.patients}
                  </Text>
                  <Text variant="labelMedium" style={styles.heroMetricLabel}>
                    Patients
                  </Text>
                </View>
                <View style={styles.heroMetricBox}>
                  <Text variant="headlineSmall" style={styles.heroMetricValue}>
                    {summary.counts.devices}
                  </Text>
                  <Text variant="labelMedium" style={styles.heroMetricLabel}>
                    Devices
                  </Text>
                </View>
                <View style={styles.heroMetricBox}>
                  <Text variant="headlineSmall" style={styles.heroMetricValue}>
                    {summary.counts.readings}
                  </Text>
                  <Text variant="labelMedium" style={styles.heroMetricLabel}>
                    Readings
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.heroMetrics}>
                <View style={styles.heroMetricBox}>
                  <Text variant="headlineSmall" style={styles.heroMetricValue}>
                    {latestReadings.length}
                  </Text>
                  <Text variant="labelMedium" style={styles.heroMetricLabel}>
                    Recent
                  </Text>
                </View>
                <View style={styles.heroMetricBox}>
                  <Text variant="headlineSmall" style={styles.heroMetricValue}>
                    Live
                  </Text>
                  <Text variant="labelMedium" style={styles.heroMetricLabel}>
                    Updates
                  </Text>
                </View>
                <View style={styles.heroMetricBox}>
                  <Text variant="headlineSmall" style={styles.heroMetricValue}>
                    24/7
                  </Text>
                  <Text variant="labelMedium" style={styles.heroMetricLabel}>
                    Care
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
        {summary ? (
          <>
            <SectionHeader title="Quick Stats" subtitle="Shortcuts to the most important numbers" />
            <View style={styles.statsRow}>
              <StatCard label="Patients" value={summary.counts.patients} icon="account-group-outline" />
              <View style={styles.rowGap} />
              <StatCard label="Devices" value={summary.counts.devices} icon="watch-variant" tint="#CCFBF1" />
            </View>
            <View style={styles.statsRow}>
              <StatCard label="Readings" value={summary.counts.readings} icon="chart-line" tint="#FEF3C7" />
            </View>

            <SectionHeader title="Latest Readings" subtitle="Recent updates across monitored patients" />
            {(summary.latest ?? []).slice(0, 6).map((item: any) => (
              <Card key={item.id} style={styles.listCard}>
                <Card.Title
                  title={item.type}
                  subtitle={new Date(item.recordedAt).toLocaleString()}
                  left={(props) => (
                    <Avatar.Icon {...props} icon={getReadingIcon(item.type)} style={styles.listAvatar} />
                  )}
                />
                <Card.Content>
                  <Text variant="bodyMedium">Patient: {item.patient?.mrn ?? '-'}</Text>
                  <Text variant="bodySmall" style={styles.mutedText}>
                    Recorded health reading update
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </>
        ) : (
          <>
            <SectionHeader title="Your Timeline" subtitle="Latest health updates for your account" />
            {latestReadings.map((item) => (
              <Card key={item.id} style={styles.listCard}>
                <Card.Title
                  title={item.type}
                  subtitle={new Date(item.recordedAt).toLocaleString()}
                  left={(props) => (
                    <Avatar.Icon {...props} icon={getReadingIcon(item.type)} style={styles.listAvatar} />
                  )}
                />
                <Card.Content>
                  <Text variant="bodyMedium">New reading available</Text>
                  <Text variant="bodySmall" style={styles.mutedText}>
                    Open the readings tab to see full details.
                  </Text>
                </Card.Content>
              </Card>
            ))}
            {latestReadings.length === 0 ? (
              <EmptyStateCard
                title="No readings yet"
                subtitle="Health readings will appear here after a device or mock reading is submitted."
                icon="chart-line"
              />
            ) : null}
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: appColors.heroDark,
    marginBottom: 16,
    borderRadius: 28,
  },
  heroContent: {
    gap: 10,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroAvatar: {
    backgroundColor: '#FFFFFF',
  },
  heroTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroEmail: {
    color: '#FFFFFF',
  },
  heroSubtitle: {
    color: '#D7E4F1',
    lineHeight: 20,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  heroMetricBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  heroMetricValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroMetricLabel: {
    color: '#D3E2F2',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rowGap: {
    width: 12,
  },
  listCard: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
  },
  listAvatar: {
    backgroundColor: '#EAF2FF',
  },
  mutedText: {
    color: appColors.textMuted,
  },
});
