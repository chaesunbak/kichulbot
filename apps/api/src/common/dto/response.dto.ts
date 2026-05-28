export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string | string[];
    error?: string;
    path: string;
    timestamp: string;
  };
}
