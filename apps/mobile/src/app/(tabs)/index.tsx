import { Link } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Screen } from '@/shared/components/screen';
import { AppText } from '@/shared/components/text';
import { env } from '@/shared/lib/env';

export default function HomeScreen() {
  return (
    <Screen>
      <View className="gap-2.5">
        <AppText variant="eyebrow">KICHULBOT MOBILE</AppText>
        <AppText variant="title">기출봇 모바일 앱</AppText>
        <AppText variant="body">
          Expo Router 기반 초기 워크스페이스입니다. 모바일 화면은 React Query와
          Zustand 없이 필요한 기능부터 작게 붙여갑니다.
        </AppText>
      </View>

      <View className="gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <AppText variant="label">API Base URL</AppText>
        <AppText variant="mono">{env.apiBaseUrl}</AppText>
        <View className="my-1.5 h-px bg-slate-200" />
        <AppText variant="label">Web Base URL</AppText>
        <AppText variant="mono">{env.webBaseUrl}</AppText>
      </View>

      <Link href="/sign-in" asChild>
        <Button size="lg">
          <Text>로그인 화면 보기</Text>
        </Button>
      </Link>
    </Screen>
  );
}
