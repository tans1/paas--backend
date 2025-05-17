export class CustomApiResponse {
  constructor(
    public success: boolean,
    public message: string,
    public error_code?: number,
    public data: any = null,
  ) {}

  static success(data: any = null, message: string = 'Success') {
    return new CustomApiResponse(true, message, undefined, data);
  }

  static error(message: string, error_code: number, data: any = null) {
    return new CustomApiResponse(false, message, error_code, data);
  }
}
