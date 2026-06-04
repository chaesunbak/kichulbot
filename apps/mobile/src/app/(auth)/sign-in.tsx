import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, View } from 'react-native';

import { getKakaoLoginUrl } from '@/features/auth/api';
import { useAuthSession } from '@/features/auth/session';
import { Screen } from '@/shared/components/screen';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

export default function SignInScreen() {
  const { signIn } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleEmailSignIn() {
    setIsSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      router.replace('/');
    } catch (error) {
      Alert.alert(
        '로그인 실패',
        error instanceof Error ? error.message : '로그인에 실패했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleKakaoSignIn() {
    try {
      await Linking.openURL(getKakaoLoginUrl());
    } catch {
      Alert.alert('카카오 로그인 실패', '카카오 로그인 화면을 열 수 없습니다.');
    }
  }

  return (
    <Screen>
      <View className="gap-2.5">
        <Text className="text-[28px] font-extrabold leading-9 text-slate-900">
          로그인
        </Text>
        <Text className="text-base leading-6 text-slate-600">
          이메일 계정이나 카카오 계정으로 기출봇 모바일에 로그인합니다.
        </Text>
      </View>

      <View className="gap-3">
        <Input
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="이메일"
          textContentType="emailAddress"
          value={email}
        />
        <Input
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
          textContentType="password"
          value={password}
        />
        <Button disabled={isSubmitting} onPress={handleEmailSignIn} size="lg">
          <Text>{isSubmitting ? '로그인 중...' : '이메일로 로그인'}</Text>
        </Button>
      </View>

      <View className="gap-3">
        <Button
          className="bg-[#FEE500] active:bg-[#FDD835]"
          onPress={handleKakaoSignIn}
          size="lg"
        >
          <Text className="text-slate-950">카카오로 계속하기</Text>
        </Button>
        <Link href="/sign-up" asChild>
          <Button variant="outline" size="lg">
            <Text>이메일로 회원가입</Text>
          </Button>
        </Link>
      </View>
    </Screen>
  );
}
