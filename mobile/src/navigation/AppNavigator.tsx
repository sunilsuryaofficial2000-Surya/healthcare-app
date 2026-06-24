import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator } from 'react-native-paper';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PatientsScreen } from '../screens/PatientsScreen';
import { PatientDetailScreen } from '../screens/PatientDetailScreen';
import { DevicesScreen } from '../screens/DevicesScreen';
import { ReadingsScreen } from '../screens/ReadingsScreen';
import { AuditLogsScreen } from '../screens/AuditLogsScreen';
import { appTheme } from '../theme/theme';

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PatientDetail: { patientId: string; title: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

type MainTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Devices: undefined;
  Readings: undefined;
  Audit: undefined;
};

const Tabs = createBottomTabNavigator<MainTabParamList>();

function getTabIcon(routeName: keyof MainTabParamList) {
  if (routeName === 'Dashboard') return 'view-dashboard-outline';
  if (routeName === 'Patients') return 'account-group-outline';
  if (routeName === 'Devices') return 'watch-variant';
  if (routeName === 'Readings') return 'chart-line';
  return 'clipboard-text-clock-outline';
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator animating />
    </View>
  );
}

function TabsForRole() {
  const { user } = useAuth();
  const role = user?.role;
  const commonScreenOptions = ({ route }: { route: { name: keyof MainTabParamList } }) => ({
    headerStyle: {
      backgroundColor: appTheme.colors.background,
    },
    headerShadowVisible: false,
    headerTitleStyle: {
      fontWeight: '700' as const,
      color: '#173C6B',
    },
    tabBarActiveTintColor: appTheme.colors.primary,
    tabBarInactiveTintColor: '#93A5BA',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopColor: '#E1E8F1',
      borderTopWidth: 1,
      height: 70,
      paddingTop: 8,
      paddingBottom: 10,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '600' as const,
    },
    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
      <MaterialCommunityIcons name={getTabIcon(route.name)} size={size} color={color} />
    ),
  });

  if (role === 'PATIENT') {
    return (
      <Tabs.Navigator screenOptions={commonScreenOptions}>
        <Tabs.Screen name="Dashboard" component={DashboardScreen} />
        <Tabs.Screen name="Readings" component={ReadingsScreen} />
        <Tabs.Screen name="Devices" component={DevicesScreen} />
      </Tabs.Navigator>
    );
  }

  return (
    <Tabs.Navigator screenOptions={commonScreenOptions}>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Patients" component={PatientsScreen} />
      <Tabs.Screen name="Devices" component={DevicesScreen} />
      <Tabs.Screen name="Readings" component={ReadingsScreen} />
      <Tabs.Screen name="Audit" component={AuditLogsScreen} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  const { loading, token } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: appTheme.colors.primary,
          background: appTheme.colors.background,
          card: '#FFFFFF',
          text: '#0F172A',
          border: '#E1E8F1',
          notification: appTheme.colors.error,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: appTheme.colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700', color: '#173C6B' },
        }}
      >
        {!token ? (
          <RootStack.Screen name="Auth" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <RootStack.Screen name="Main" component={TabsForRole} options={{ headerShown: false }} />
            <RootStack.Screen
              name="PatientDetail"
              component={PatientDetailScreen}
              options={({ route }) => ({ title: route.params.title })}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
