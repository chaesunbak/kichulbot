import '../../global.css';

import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthSessionProvider } from '@/features/auth/session';

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
      </Stack>
      <PortalHost />
      <StatusBar style="auto" />
    </AuthSessionProvider>
  );
}
