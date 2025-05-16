// Type definitions to enhance Express
import 'express';

declare module 'express' {
  export interface Router {
    get(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
    post(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
    put(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
    delete(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
    patch(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
  }

  export interface Express {
    get(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
    post(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
    put(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
    delete(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
    patch(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): this;
  }
} 