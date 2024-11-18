import { Injectable, NestMiddleware } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JWTSECRET } from 'src/environments/environment';
import { Request, Response } from 'express';

@Injectable()
export class RequestMiddleWare implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    const authJwtToken = req.headers.authorization;

    if (!authJwtToken) {
      next();
      return;
    }
    try {
      const user = jwt.verify(authJwtToken, JWTSECRET);
      if (user) {
        console.log('found user details in: ', user);
        req['user'] = user;
      }
    } catch (err) {
      console.log(err);
    }
    next();
  }
}
