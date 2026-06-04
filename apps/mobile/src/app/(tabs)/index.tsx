import { Link, router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { useAuthSession } from '@/features/auth/session';
import { Screen } from '@/shared/components/screen';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';
import { env } from '@/shared/lib/env';

export default function HomeScreen() {
  const { isAuthenticated, isReady, signOut, user } = useAuthSession();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/sign-in');
    }
  }, [isAuthenticated, isReady]);

  if (!isReady) {
    return (
      <Screen>
        <Text className="text-base leading-6 text-slate-600">
          로그인 상태를 확인하고 있습니다...
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="gap-2.5">
        <Text className="text-xs font-bold text-blue-600">
          KICHULBOT MOBILE
        </Text>
        <Text className="text-[28px] font-extrabold leading-9 text-slate-900">
          기출봇 모바일 앱
        </Text>
        <Text className="text-base leading-6 text-slate-600">
          {user?.nickname ?? user?.email ?? '기출러'}님, 모바일 API 인증이
          연결되었습니다.
        </Text>
      </View>

      <View className="gap-2 rounded-lg border bg-slate-50 p-4">
        <Text className="text-[13px] font-bold text-slate-700">내 계정</Text>
        <Text className="font-mono text-[13px] leading-5 text-slate-900">
          {user?.email ?? '카카오 계정'}
        </Text>
        <View className="my-1.5 h-px bg-slate-200" />
        <Text className="text-[13px] font-bold text-slate-700">
          API Base URL
        </Text>
        <Text className="font-mono text-[13px] leading-5 text-slate-900">
          {env.apiBaseUrl}
        </Text>
        <View className="my-1.5 h-px bg-slate-200" />
        <Text className="text-[13px] font-bold text-slate-700">App Scheme</Text>
        <Text className="font-mono text-[13px] leading-5 text-slate-900">
          {env.appScheme}
        </Text>
        <View className="my-1.5 h-px bg-slate-200" />
        <Text className="text-[13px] font-bold text-slate-700">
          Web Base URL
        </Text>
        <Text className="font-mono text-[13px] leading-5 text-slate-900">
          {env.webBaseUrl}
        </Text>
      </View>

      {isAuthenticated ? (
        <Button onPress={signOut} size="lg" variant="outline">
          <Text>로그아웃</Text>
        </Button>
      ) : (
        <Link href="/sign-in" asChild>
          <Button size="lg">
            <Text>로그인 화면 보기</Text>
          </Button>
        </Link>
      )}
    </Screen>
  );
}
