import { View } from 'react-native';

import { Screen } from '@/shared/components/screen';
import { AppText } from '@/shared/components/text';

export default function SignInScreen() {
  return (
    <Screen>
      <View className="gap-3">
        <AppText variant="title">로그인</AppText>
        <AppText variant="body">
          인증 UI는 이후 화면 작업에서 API 계약과 SecureStore 저장소를 연결해
          구현합니다.
        </AppText>
      </View>
    </Screen>
  );
}
