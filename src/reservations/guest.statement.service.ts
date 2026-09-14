import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { EdoCuentaSchema } from 'src/accounting/models/accounting.model';
import { GuestSchema, huespeds } from 'src/guests/models/guest.model';
import { ParametrosSchema } from 'src/parametros/models/parametros.model';

interface ParametrosLean {
  ish?: number;
  iva?: number;
}

@Injectable()
export class GuestStatementService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  /**
   * Two call shapes:
   *  - Admin app (AccountingController, behind TenantMiddleware):
   *      getStatement(folio) — connection comes from req.dbConnection.
   *  - Guest app (ReservationAuthService, open route, no middleware):
   *      getStatement(folio, hotelConn) — connection resolved manually
   *      via the reservation-code prefix lookup, passed in directly.
   */
  async getStatement(folio: string, hotelConn?: Connection) {
    const conn =
      hotelConn ??
      ((this.request as any)?.dbConnection as Connection | undefined);
    if (!conn) {
      throw new Error(
        'dbConnection missing — pass hotelConn explicitly, or ensure TenantMiddleware ran for this route',
      );
    }

    const huespedModel = (conn.models['Reservaciones'] ||
      conn.model('Reservaciones', GuestSchema)) as Model<huespeds>;
    const edoCuentaModel = (conn.models['Edo_Cuenta'] ||
      conn.model('Edo_Cuenta', EdoCuentaSchema)) as Model<any>;
    const parametrosModel = (conn.models['Parametros'] ||
      conn.model('Parametros', ParametrosSchema)) as Model<any>;

    const [huesped, edoCuenta] = await Promise.all([
      huespedModel.findOne({ folio }).lean().exec(),
      edoCuentaModel.find({ Folio: folio }).lean().exec(),
    ]);

    if (!huesped) throw new NotFoundException('Reservación no encontrada.');

    const parametros = (await parametrosModel
      .findOne()
      .lean()
      .exec()) as ParametrosLean | null;

    const ishRate = (parametros?.ish ?? 0) / 100;
    const ivaRate = (parametros?.iva ?? 0) / 100;
    const activos = edoCuenta.filter((i) => i.Estatus === 'Activo');
    const noCancelados = edoCuenta.filter((i) => i.Estatus !== 'Cancelado');

    // --- Alojamiento: desgloseEdoCuenta + any "Cargo por Colgado" lines ---
    const tarifaDelDia = Array.isArray(huesped.desgloseEdoCuenta)
      ? [...huesped.desgloseEdoCuenta]
      : [];
    for (const item of activos) {
      if (item.Descripcion === 'Cargo por Colgado') {
        const exists = tarifaDelDia.some(
          (x) => x.tarifa === item.Descripcion && x.tarifaTotal === item.Cargo,
        );
        if (!exists)
          tarifaDelDia.push({
            tarifa: item.Descripcion,
            fecha: item.Fecha,
            tarifaTotal: item.Cargo,
          });
      }
    }
    const baseHospedaje = tarifaDelDia.reduce(
      (s, x) => s + (x.tarifaTotal ?? 0),
      0,
    );
    const impuestoSobreHospedaje = baseHospedaje * ishRate;
    const iva = baseHospedaje * ivaRate;

    // --- Servicios extra ---
    const serviciosExtra = activos.filter(
      (i) =>
        i.Descripcion !== 'HOSPEDAJE' &&
        i.Descripcion !== 'Cargo por Colgado' &&
        (i.Cargo ?? 0) !== 0,
    );
    const subTotalServiciosExtra = serviciosExtra.reduce(
      (s, i) => s + (i.Cargo ?? 0),
      0,
    );

    // --- Descuentos / Pagos ---
    const descuentosLista = activos.filter(
      (i) => i.Forma_de_Pago === 'Descuento' && (i.Abono ?? 0) !== 0,
    );
    const totalDescuentos = descuentosLista.reduce(
      (s, i) => s + (i.Abono ?? 0),
      0,
    );
    const pagosLista = activos.filter(
      (i) => (i.Abono ?? 0) !== 0 && i.Forma_de_Pago !== 'Descuento',
    );

    // --- Totales ---
    const totalCuenta = noCancelados.reduce((s, i) => s + (i.Cargo ?? 0), 0);
    const saldoPendiente = noCancelados.reduce(
      (s, i) => s + (i.Cargo ?? 0) - (i.Abono ?? 0),
      0,
    );

    return {
      folio,
      plan: huesped.tarifa?.Tarifa ?? null,
      adultos: huesped.adultos,
      ninos: huesped.ninos,
      noches: huesped.noches,
      alojamiento: {
        lineas: tarifaDelDia.map((x) => ({
          concepto: x.tarifa,
          fecha: x.fecha,
          monto: x.tarifaTotal,
        })),
        subtotal: baseHospedaje,
      },
      serviciosExtra: {
        lineas: serviciosExtra.map((i) => ({
          descripcion: i.Descripcion,
          cantidad: i.Cantidad,
          fecha: i.Fecha,
          monto: i.Cargo,
        })),
        subtotal: subTotalServiciosExtra,
      },
      impuestos: {
        ish: {
          porcentaje: parametros?.ish ?? 0,
          monto: impuestoSobreHospedaje,
        },
        iva: { porcentaje: parametros?.iva ?? 0, monto: iva },
        total: impuestoSobreHospedaje + iva,
      },
      descuentos: {
        lineas: this.buildDiscountBreakdown(
          serviciosExtra,
          descuentosLista,
          baseHospedaje,
        ),
        total: totalDescuentos,
      },
      pagos: {
        lineas: pagosLista.map((i) => ({
          descripcion: i.Descripcion,
          fecha: i.Fecha,
          monto: i.Abono,
        })),
        total: pagosLista.reduce((s, i) => s + (i.Abono ?? 0), 0),
      },
      totales: {
        totalCuenta,
        saldoPendiente,
        pagado: totalCuenta - saldoPendiente,
      },
    };
  }

  private buildDiscountBreakdown(
    serviciosExtra: any[],
    descuentosLista: any[],
    baseHospedaje: number,
  ) {
    const normalizeId = (id: any) =>
      id ? String((id as any).$oid ?? id) : undefined;
    const parsePercentage = (text?: string) => {
      const m = text?.match(/(\d+(?:\.\d+)?)\s*%/);
      return m ? Number(m[1]) / 100 : null;
    };
    const cargos = [
      ...serviciosExtra,
      { _id: 'HOSPEDAJE', Descripcion: 'Hospedaje', Cargo: baseHospedaje },
    ];

    return cargos
      .map((cargo) => {
        const cargoId = normalizeId(cargo._id);
        const original = Number(cargo.Cargo ?? 0);
        let descuento = 0;
        for (const d of descuentosLista) {
          const applies = (d.RelatedCuentas ?? []).some(
            (rc: any) => normalizeId(rc._id ?? rc.id) === cargoId,
          );
          if (!applies) continue;
          const pct = parsePercentage(d.Descripcion);
          descuento += pct !== null ? original * pct : d.Abono ?? 0;
        }
        descuento = Math.min(descuento, original);
        return descuento > 0
          ? {
              descripcion: cargo.Descripcion,
              cargoOriginal: original,
              cargoConDescuento: original - descuento,
              descuento,
            }
          : null;
      })
      .filter(Boolean);
  }
}
