export class ApiResponse<T = any> {
  public success: boolean;
  public message: string;
  public data?: T;
  public error?: string;
  public timestamp: string;

  constructor(success: boolean, message: string, data?: T, error?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse(true, message, data);
  }

  static error(message: string, error?: string): ApiResponse {
    return new ApiResponse(false, message, undefined, error);
  }
}
