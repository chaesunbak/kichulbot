import { Link } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Screen } from '@/shared/components/screen';
import { AppText } from '@/shared/components/text';

export default function NotFoundScreen() {
  return (
    <Screen>
      <AppText variant="title">화면을 찾을 수 없습니다</AppText>
      <Link href="/" asChild>
        <Button size="lg">
          <Text>홈으로 이동</Text>
        </Button>
      </Link>
    </Screen>
  );
}
