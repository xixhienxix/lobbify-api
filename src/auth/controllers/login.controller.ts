import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as jwt from 'jsonwebtoken';
import { usuario } from '../models/user.model';
import { JWTSECRET } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Request } from 'express';
@Controller()
export class LoginController {
  constructor(@InjectModel(usuario.name) private userModel: Model<usuario>) {}

  @Post('/login')
  async login(
    @Body('username') username: string,
    @Body('password') plainTextPassword: string,
  ): Promise<any> {
    const usuariosResultQuery = await this.userModel
      .findOne({ username: username, password: plainTextPassword })
      .lean()
      .then((db_res) => {
        if (db_res) {
          return db_res;
        }
      })
      .catch((err) => {
        console.log(err);
        return err;
      });

    return new Promise((resolve) => {
      if (!usuariosResultQuery) {
        resolve({ mensaje: 'usuario inexistente' });
        return;
      }
      const authJwtToken = jwt.sign({ usuariosResultQuery }, JWTSECRET, {
        expiresIn: '30m',
      });
      usuariosResultQuery.accessToken = authJwtToken;

      resolve(usuariosResultQuery);

      // password(plainTextPassword).verifyAgainst(
      //   usuariosResultQuery.passwordHash,
      //   (err: any, verified: any) => {
      //     if (!verified) {
      //       reject(new UnauthorizedException());
      //     }

      //     const authJwtToken = jwt.sign(
      //       { usuariosResultQuery },
      //       JWTSECRET.JWTSECRET,
      //       {
      //         expiresIn: '30m',
      //       },
      //     );
      //     resolve({ authJwtToken });
      //   },
      // );
    });
  }

  @Get('/getUserByToken')
  // @UseGuards(AuthenticationGuard)
  async getUserByToken(@Req() request: Request): Promise<any> {
    const token = request.headers.authorization;
    const decoded = jwtDecode(token);

    return decoded;
  }
}
