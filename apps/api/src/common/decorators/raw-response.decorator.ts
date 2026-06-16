import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_METADATA = 'kichulbot:raw-response';

export function RawResponse() {
  return SetMetadata(RAW_RESPONSE_METADATA, true);
}
