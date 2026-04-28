import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class MultipartGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const contentType = request.headers["content-type"];

    if (!contentType || !contentType.startsWith("multipart/form-data")) {
      throw new UnsupportedMediaTypeException(
        `Only multipart/form-data is allowed. Received: ${contentType || "none"}`,
      );
    }
    return true;
  }
}
