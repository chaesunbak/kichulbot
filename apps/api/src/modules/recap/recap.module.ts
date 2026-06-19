import { Module } from '@nestjs/common';

import { RecapController } from './recap.controller';
import { RecapRepository } from './recap.repository';
import { RecapService } from './recap.service';

@Module({
  controllers: [RecapController],
  providers: [RecapRepository, RecapService],
})
export class RecapModule {}
