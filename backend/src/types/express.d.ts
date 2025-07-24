// Express 타입 확장
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}