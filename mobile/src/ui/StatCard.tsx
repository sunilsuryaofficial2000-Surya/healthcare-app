import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appColors } from '../theme/theme';

type Props = {
  label: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint?: string;
};

export function StatCard({ label, value, icon, tint = '#DBEAFE' }: Props) {
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: tint }]}>
          <MaterialCommunityIcons name={icon} size={22} color="#1E3A8A" />
        </View>
        <Text variant="headlineSmall" style={styles.value}>
          {value}
        </Text>
        <Text variant="bodyMedium" style={styles.label}>
          {label}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.cardBorder,
  },
  content: {
    gap: 8,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontWeight: '700',
    color: '#123B68',
  },
  label: {
    color: appColors.textMuted,
  },
});
