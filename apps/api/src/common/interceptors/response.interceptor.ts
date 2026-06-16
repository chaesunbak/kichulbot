import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { REDIRECT_METADATA } from '@nestjs/common/constants';
import { map, Observable } from 'rxjs';

import { RAW_RESPONSE_METADATA } from '../decorators/raw-response.decorator';
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
    const hasRedirectMetadata = Reflect.hasMetadata(
      REDIRECT_METADATA,
      context.getHandler(),
    );
    const hasRawResponseMetadata =
      Reflect.getMetadata(RAW_RESPONSE_METADATA, context.getHandler()) ===
        true ||
      Reflect.getMetadata(RAW_RESPONSE_METADATA, context.getClass()) === true;

    if (hasRedirectMetadata || hasRawResponseMetadata) {
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
