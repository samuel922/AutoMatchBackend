import { Response } from 'express';

interface IApiResponse {
  success?: boolean;
  message?: string;
  data?: any;
}

const apiResponse = {
  sendSuccess: (res: Response, options: IApiResponse) => {
    const { message = 'Success', data = null } = options;
    res.status(200).json({
      success: true,
      message,
      data
    });
  },

  sendError: (res: Response, statusCode: number, message: string) => {
    res.status(statusCode).json({
      success: false,
      message
    });
  }
};

export default apiResponse;