export const reservationStatusMap: { [key: number]: string[] } = {
  1: ['Huesped en Casa', 'Walk-In', 'Reserva en Casa'],
  2: [
    'Reserva Sin Pago',
    'Reserva Confirmada',
    'Deposito Realizado',
    'Esperando Deposito',
    'Totalmente Pagada',
  ],
  4: ['Check-Out'],
  5: ['Uso Interno'],
  6: ['Bloqueo'],
  7: ['Reserva Temporal'],
  8: ['No Show', 'Reserva Cancelada'],
};
