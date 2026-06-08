/**
 * 업로드된 파일의 최소 형태.
 * multer memory storage가 제공하는 필드만 사용하므로 @types/multer 의존 없이 정의한다.
 */
export interface UploadedMemoryFile {
  fieldname?: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface StoredObject {
  objectKey: string;
  url: string;
}

export interface QuestionImagePathContext {
  questionId: string;
  examSlug: string;
  paperSlug: string;
  questionNumber: number;
}

/**
 * 파일 스토리지 추상화.
 *
 * MVP 로컬 개발에서는 LocalStorageService(로컬 파일 시스템)를 사용하고,
 * 배포 환경에서는 동일한 인터페이스로 Cloudflare R2(S3 호환) 어댑터를 주입한다.
 */
export abstract class StorageService {
  abstract uploadQuestionImage(
    file: UploadedMemoryFile,
    context: QuestionImagePathContext,
  ): Promise<StoredObject>;

  abstract getPublicUrl(objectKey: string): string;

  abstract deleteObject(objectKey: string): Promise<void>;
}
