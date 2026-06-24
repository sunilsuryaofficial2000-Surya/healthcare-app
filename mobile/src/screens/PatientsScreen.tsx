import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Card, Chip, Searchbar, Text } from 'react-native-paper';
import { api } from '../api/client';
import type { Patient } from '../api/types';
import { useNavigation } from '@react-navigation/native';
import { EmptyStateCard } from '../ui/EmptyStateCard';
import { SectionHeader } from '../ui/SectionHeader';
import { appColors } from '../theme/theme';

export function PatientsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients');
      setPatients((data.patients ?? []) as Patient[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPatients = patients.filter((item) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return true;
    return [item.firstName, item.lastName, item.mrn, item.phone, item.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  return (
    <FlatList
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      data={filteredPatients}
      keyExtractor={(p) => p.id}
      ItemSeparatorComponent={() => <View style={styles.spacer} />}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.heroCard}>
            <Text variant="titleMedium" style={styles.heroTitle}>
              Patient List
            </Text>
            <Text variant="bodyMedium" style={styles.heroSubtitle}>
              Browse records and quickly open a patient profile.
            </Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatBox}>
                <Text variant="headlineSmall" style={styles.heroStatValue}>
                  {patients.length}
                </Text>
                <Text variant="labelMedium" style={styles.heroStatLabel}>
                  Total
                </Text>
              </View>
              <View style={styles.heroStatBox}>
                <Text variant="headlineSmall" style={styles.heroStatValue}>
                  {filteredPatients.length}
                </Text>
                <Text variant="labelMedium" style={styles.heroStatLabel}>
                  Visible
                </Text>
              </View>
            </View>
          </View>
          <Searchbar
            placeholder="Search patient"
            value={query}
            onChangeText={setQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
          />
          <SectionHeader title="Patients" subtitle="Browse and open assigned patient records" />
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('PatientDetail', { patientId: item.id, title: `${item.firstName} ${item.lastName}` })}
        >
          <Card style={styles.card}>
            <Card.Title
              title={`${item.firstName} ${item.lastName}`}
              subtitle={item.mrn}
              left={(props) => <Avatar.Icon {...props} icon="account-heart" style={styles.avatar} />}
            />
            <Card.Content style={styles.cardContent}>
              <View style={styles.chipRow}>
                <Chip compact icon="account">
                  {item.gender || 'Not set'}
                </Chip>
                <Chip compact icon="phone">
                  {item.phone || 'No phone'}
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.mutedText}>
                Tap to view patient profile, devices, and create mock readings.
              </Text>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <EmptyStateCard
          title="No patients found"
          subtitle={query ? 'Try a different name, MRN, phone, or email search.' : 'Patients created in the backend will appear here.'}
          icon="account-search-outline"
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
  searchbar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
  },
  searchInput: {
    minHeight: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
  },
  avatar: {
    backgroundColor: '#EAF2FF',
  },
  cardContent: {
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  mutedText: {
    color: appColors.textMuted,
  },
});
