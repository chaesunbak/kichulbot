# @kichulbot/api-contract

API 서버와 프런트엔드가 함께 사용하는 요청/응답 계약 패키지입니다. Zod 스키마를 단일 출처로 두고, 각 앱은 여기서 런타임 검증 스키마와 TypeScript 타입을 가져다 씁니다.

경로별 요청, 응답만 얕게 정의하는 것으로 하고, 이를 단일한 출처로 필요한 타입이 있다면 응답/요청 타입에서 추출하여 사용합니다.

## 파일 컨벤션

```text
src/
  common.ts // 여러 도메인 요청/응답이 공유하는 스키마(공통 응답, 에러, 페이지네이션), 유틸리티(enum)(외부로 노출되지 않습니다)
  index.ts
  <domain>/
    dto.ts // 요청/응답에 사용되는 재사용 가능 조각(외부로 노출되지 않습니다)
    request.ts // 요청 스키마, 타입
    response.ts // 응답 스키마, 타입
    index.ts
```

## NodeNext ESM

이 패키지는 `type: "module"`과 `module: "NodeNext"`로 빌드합니다. API, 웹, 어드민처럼 서로 다른 실행 환경에서 같은 계약을 가져다 쓰기 때문에, 패키지 출력물을 Node ESM 규칙에 맞는 명시적인 JavaScript 모듈로 유지하기 위해서입니다. `package.json`의 `exports`도 `dist/*.js`를 가리키므로, 소비하는 앱은 빌드된 ESM 파일과 타입 선언을 같은 경로 체계로 해석할 수 있습니다.

그 때문에 TypeScript 소스의 상대 import/export에도 `.js` 확장자를 씁니다.

```ts
import { IsoDateStringSchema } from '../common.js';
export * from './response.js';
```

소스에는 `common.js` 파일이 없지만, TypeScript의 `NodeNext` 해석은 이 경로를 개발 중에는 `common.ts`로 연결하고 빌드 결과에서는 그대로 `dist/common.js`를 남깁니다. 확장자를 생략하면 Node ESM 런타임에서 상대 경로를 찾지 못할 수 있고, `.ts` 확장자를 쓰면 일반적인 JavaScript 출력물에서 런타임 경로가 깨질 수 있습니다.

관련 근거:

- [Node.js ESM: Mandatory file extensions](https://nodejs.org/api/esm.html#mandatory-file-extensions)
- [TypeScript 4.7: ECMAScript Module Support in Node.js](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#type-in-packagejson-and-new-extensions)
- [TypeScript TSConfig: moduleResolution](https://www.typescriptlang.org/tsconfig/moduleResolution.html)
