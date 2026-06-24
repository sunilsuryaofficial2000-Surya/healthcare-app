import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../auth/AuthContext';
import { ScreenContainer } from '../ui/ScreenContainer';
import { appColors } from '../theme/theme';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('Admin@123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    try {
      setSubmitting(true);
      setError(null);
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="heart-pulse" size={26} color="#0D4D92" />
            </View>
            <View style={styles.heroMiniBadge}>
              <Text variant="labelSmall" style={styles.heroMiniBadgeText}>
                Connected Care
              </Text>
            </View>
          </View>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Healthcare Platform
          </Text>
          <Text variant="bodyMedium" style={styles.heroSubtitle}>
            Manage patients, appointments-style workflows, devices, and real-time readings with a cleaner clinical dashboard.
          </Text>
          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text variant="headlineSmall" style={styles.metricValue}>
                24
              </Text>
              <Text variant="labelMedium" style={styles.metricLabel}>
                Active Cases
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text variant="headlineSmall" style={styles.metricValue}>
                Live
              </Text>
              <Text variant="labelMedium" style={styles.metricLabel}>
                Monitoring
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text variant="headlineSmall" style={styles.metricValue}>
                3
              </Text>
              <Text variant="labelMedium" style={styles.metricLabel}>
                Roles
              </Text>
            </View>
          </View>
          <View style={styles.chipsRow}>
            <Chip compact textStyle={styles.heroChipText} style={styles.heroChip}>
              Secure Access
            </Chip>
            <Chip compact textStyle={styles.heroChipText} style={styles.heroChip}>
              Live Monitoring
            </Chip>
          </View>
        </View>

        <Card style={styles.formCard}>
          <Card.Content style={styles.formContent}>
            <Text variant="titleLarge" style={styles.formTitle}>
              Sign in
            </Text>
            <Text variant="bodyMedium" style={styles.formSubtitle}>
              Use one of the demo accounts below to explore the app.
            </Text>

            <TextInput
              mode="outlined"
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              mode="outlined"
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <HelperText type="error" visible={!!error}>
              {error ?? ''}
            </HelperText>

            <View style={styles.demoRow}>
              <Chip selected={email === 'admin@demo.com'} onPress={() => { setEmail('admin@demo.com'); setPassword('Admin@123'); }}>
                Admin
              </Chip>
              <Chip selected={email === 'doctor@demo.com'} onPress={() => { setEmail('doctor@demo.com'); setPassword('Doctor@123'); }}>
                Doctor
              </Chip>
              <Chip selected={email === 'patient@demo.com'} onPress={() => { setEmail('patient@demo.com'); setPassword('Patient@123'); }}>
                Patient
              </Chip>
            </View>

            <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting} contentStyle={styles.buttonContent}>
              Sign in
            </Button>

            <Text variant="labelMedium" style={styles.demoHint}>
              Admin: `admin@demo.com` / `Admin@123`
            </Text>
            <Text variant="labelMedium" style={styles.demoHint}>
              Doctor: `doctor@demo.com` / `Doctor@123`
            </Text>
            <Text variant="labelMedium" style={styles.demoHint}>
              Patient: `patient@demo.com` / `Patient@123`
            </Text>
          </Card.Content>
        </Card>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  heroCard: {
    backgroundColor: appColors.heroDark,
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMiniBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroMiniBadgeText: {
    color: '#FFFFFF',
  },
  heroTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    color: '#D9E6F4',
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  metricValue: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricLabel: {
    marginTop: 2,
    color: '#C7D9EC',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroChip: {
    backgroundColor: '#FFFFFF',
  },
  heroChipText: {
    color: '#124F92',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  formContent: {
    gap: 12,
  },
  formTitle: {
    fontWeight: '700',
  },
  formSubtitle: {
    color: appColors.textMuted,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  buttonContent: {
    height: 46,
  },
  demoHint: {
    color: appColors.textMuted,
  },
});
