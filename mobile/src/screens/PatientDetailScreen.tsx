import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Chip, SegmentedButtons, Text } from 'react-native-paper';
import { api } from '../api/client';
import type { Device, DeviceType, Patient } from '../api/types';
import { appColors } from '../theme/theme';
import { getReadingIcon } from '../ui/icons';
import { ScreenContainer } from '../ui/ScreenContainer';
import { SectionHeader } from '../ui/SectionHeader';

export function PatientDetailScreen(props: any) {
  const patientId = props.route.params.patientId as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [type, setType] = useState<DeviceType>('BLOOD_PRESSURE');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get(`/patients/${patientId}`);
    setPatient(data.patient as Patient);
    setDevices((data.patient?.devices ?? []) as Device[]);
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createMockReading() {
    setLoading(true);
    try {
      const device = devices.find((d) => d.type === type);
      await api.post(`/patients/${patientId}/readings/mock`, {
        type,
        deviceId: device?.id,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileHeader}>
          <View style={styles.profileTopRow}>
            <Avatar.Icon size={52} icon="account-heart" style={styles.avatar} color="#0D4D92" />
            <View style={styles.profileInfo}>
              <Text variant="titleLarge" style={styles.profileTitle}>
                {`${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim()}
              </Text>
              <Text variant="bodyMedium" style={styles.profileSubtitle}>
                {patient?.mrn ?? ''}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Chip icon="account">{patient?.gender ?? 'Not set'}</Chip>
            <Chip icon="phone">{patient?.phone ?? 'No phone'}</Chip>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text variant="titleMedium" style={styles.summaryValue}>
                {devices.length}
              </Text>
              <Text variant="labelMedium" style={styles.summaryLabel}>
                Devices
              </Text>
            </View>
            <View style={styles.summaryBox}>
              <Text variant="titleMedium" style={styles.summaryValue}>
                {type === 'BLOOD_PRESSURE' ? 'BP' : type}
              </Text>
              <Text variant="labelMedium" style={styles.summaryLabel}>
                Active
              </Text>
            </View>
          </View>
          <Text variant="bodyMedium" style={styles.profileMeta}>
            Email: {patient?.email ?? '-'}
          </Text>
        </Card.Content>
      </Card>

      <SectionHeader title="Connected Devices" subtitle="Assigned monitoring devices for this patient" />

      <Card style={styles.sectionCard}>
        <Card.Content>
          {devices.map((d) => (
            <View key={d.id} style={styles.deviceRow}>
              <View>
                <Text variant="titleSmall">{d.type}</Text>
                <Text variant="bodySmall" style={styles.mutedText}>
                  {d.serial}
                </Text>
              </View>
              <Chip compact>{d.status}</Chip>
            </View>
          ))}
          {devices.length === 0 ? <Text>No devices assigned.</Text> : null}
        </Card.Content>
      </Card>

      <SectionHeader title="Mock Reading" subtitle="Create a sample reading for demo and testing" />

      <Card style={styles.sectionCard}>
        <Card.Content>
          <SegmentedButtons
            value={type}
            onValueChange={(v) => setType(v as DeviceType)}
            buttons={[
              { value: 'ECG', label: 'ECG', icon: getReadingIcon('ECG') },
              { value: 'BLOOD_PRESSURE', label: 'BP', icon: getReadingIcon('BLOOD_PRESSURE') },
              { value: 'GLUCOSE', label: 'Glucose', icon: getReadingIcon('GLUCOSE') },
            ]}
          />
          <Text variant="bodySmall" style={styles.helpText}>
            This does not require a real medical device. The app generates sample data.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={createMockReading} loading={loading} disabled={loading} contentStyle={styles.buttonContent}>
            Create reading
          </Button>
        </Card.Actions>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: appColors.heroDark,
    marginBottom: 16,
    borderRadius: 28,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
  },
  avatar: {
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
    gap: 12,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  profileSubtitle: {
    color: '#D6E4F3',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#D3E2F2',
  },
  profileMeta: {
    color: '#FFFFFF',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  mutedText: {
    color: appColors.textMuted,
  },
  helpText: {
    color: appColors.textMuted,
    marginTop: 12,
  },
  buttonContent: {
    height: 44,
  },
});
