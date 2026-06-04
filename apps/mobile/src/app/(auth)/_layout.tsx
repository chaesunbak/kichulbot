import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: '로그인' }} />
      <Stack.Screen name="sign-up" options={{ title: '회원가입' }} />
    </Stack>
  );
}
