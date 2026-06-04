import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import {
  confirmEmailVerification,
  requestEmailVerification,
} from '@/features/auth/api';
import { useAuthSession } from '@/features/auth/session';
import { Screen } from '@/shared/components/screen';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

export default function SignUpScreen() {
  const { signUp } = useAuthSession();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailVerificationToken, setEmailVerificationToken] = useState<
    string | null
  >(null);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestCode() {
    setIsSubmitting(true);
    try {
      await requestEmailVerification({ email: email.trim() });
      Alert.alert('인증번호 발송', '이메일로 인증번호를 보냈습니다.');
    } catch (error) {
      Alert.alert(
        '인증번호 발송 실패',
        error instanceof Error ? error.message : '인증번호를 보낼 수 없습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmCode() {
    setIsSubmitting(true);
    try {
      const response = await confirmEmailVerification({
        email: email.trim(),
        code: code.trim(),
      });
      setEmailVerificationToken(response.emailVerificationToken);
      Alert.alert('인증 완료', '이메일 인증이 완료되었습니다.');
    } catch (error) {
      Alert.alert(
        '인증 실패',
        error instanceof Error
          ? error.message
          : '인증번호가 올바르지 않습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp() {
    if (!emailVerificationToken) {
      Alert.alert('이메일 인증 필요', '먼저 이메일 인증을 완료해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        nickname: nickname.trim() || undefined,
        emailVerificationToken,
      });
      router.replace('/');
    } catch (error) {
      Alert.alert(
        '회원가입 실패',
        error instanceof Error ? error.message : '회원가입에 실패했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View className="gap-2.5">
        <Text className="text-[28px] font-extrabold leading-9 text-slate-900">
          회원가입
        </Text>
        <Text className="text-base leading-6 text-slate-600">
          이메일 인증을 완료한 뒤 비밀번호와 닉네임을 입력합니다.
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
        <Button
          disabled={isSubmitting}
          onPress={handleRequestCode}
          variant="outline"
        >
          <Text>인증번호 받기</Text>
        </Button>
      </View>

      <View className="gap-3">
        <Input
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={setCode}
          placeholder="인증번호 6자리"
          value={code}
        />
        <Button
          disabled={isSubmitting}
          onPress={handleConfirmCode}
          variant={emailVerificationToken ? 'secondary' : 'outline'}
        >
          <Text>{emailVerificationToken ? '인증 완료' : '인증번호 확인'}</Text>
        </Button>
      </View>

      <View className="gap-3">
        <Input
          onChangeText={setNickname}
          placeholder="닉네임"
          textContentType="nickname"
          value={nickname}
        />
        <Input
          autoCapitalize="none"
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />
        <Button disabled={isSubmitting} onPress={handleSignUp} size="lg">
          <Text>{isSubmitting ? '가입 중...' : '가입 완료'}</Text>
        </Button>
      </View>
    </Screen>
  );
}
