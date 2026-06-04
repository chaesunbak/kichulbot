import { Link } from 'expo-router';

import { Screen } from '@/shared/components/screen';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Text className="text-[28px] font-extrabold leading-9 text-slate-900">
        화면을 찾을 수 없습니다
      </Text>
      <Link href="/" asChild>
        <Button size="lg">
          <Text>홈으로 이동</Text>
        </Button>
      </Link>
    </Screen>
  );
}
