import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { REDIRECT_METADATA } from '@nestjs/common/constants';
import { map, Observable } from 'rxjs';

import { SuccessResponse } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  T | SuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | SuccessResponse<T>> {
    const redirectMetadata = Reflect.getMetadata(
      REDIRECT_METADATA,
      context.getHandler(),
    );

    if (redirectMetadata) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
