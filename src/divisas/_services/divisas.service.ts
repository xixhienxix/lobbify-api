import { Injectable } from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { divisa, DivisasSchema } from '../_models/divisas.model';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class DivisasService {
  constructor(private readonly tenantService: TenantService) {}

  private getModel(): Model<divisa> {
    const connection: Connection = this.tenantService.getAdminConnection();
    return (
      connection.models['Divisas'] || connection.model('Divisas', DivisasSchema)
    );
  }

  async findAll(): Promise<divisa[]> {
    return this.getModel()
      .find()
      .then((data) => {
        if (!data) return;
        return data;
      })
      .catch((err) => err);
  }
}
