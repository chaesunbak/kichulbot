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
  imageObjectId?: string;
  examSlug: string;
  paperSlug: string;
  questionNumber: number;
}
