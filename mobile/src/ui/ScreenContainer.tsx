import React from 'react';
import type { ReactElement } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RefreshControlProps } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { appColors } from '../theme/theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
};

export function ScreenContainer({ children, scroll = false, refreshControl }: Props) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} refreshControl={refreshControl}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.page,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
});
