import { Injectable, computed, signal } from '@angular/core';
import { Alerta, Mensaje } from '../models/train.model';
import { RadioService } from './radio.service';
import { SimulacionService } from './simulacion.service';

interface Registro {
  mensaje: Mensaje;
  recibido: number;
}

interface Memoria {
  trenes: Record<string, Registro>;
  centro: Record<string, Registro>;
}

@Injectable({ providedIn: 'root' })
export class AlertasService {
  readonly idsTrenes = ['A', 'B', 'C'];
  readonly msDatoAntiguo = 3000;
  readonly msSinDatos = 6000;

  trenPropio = signal('B'); // la cabina que estamos mirando
  private memorias = signal<Record<string, Memoria>>(this.memoriasVacias());
  private ahora = signal(Date.now());

  tablaTrenes = computed(() => this.memorias()[this.trenPropio()].trenes);
  tablaCentro = computed(() => this.memorias()[this.trenPropio()].centro);
  alertas = computed<Alerta[]>(() => this.calcular());

  constructor(
    private radio: RadioService,
    private simulacion: SimulacionService,
  ) {
    this.radio.escuchar().subscribe((m) => this.recibir(m));
    setInterval(() => this.ahora.set(Date.now()), 500);
  }

  cambiarTren(id: string): void {
    this.trenPropio.set(id);
  }

  reiniciar(): void {
    this.memorias.set(this.memoriasVacias());
  }

  private memoriasVacias(): Record<string, Memoria> {
    return {
      A: { trenes: {}, centro: {} },
      B: { trenes: {}, centro: {} },
      C: { trenes: {}, centro: {} },
    };
  }

  // Cada tren apunta lo que oye en SU libreta. En mensajes del centro,
  // idEmisor es el tren del que habla el centro.
  private recibir(m: Mensaje): void {
    const recibido = Date.now();
    this.memorias.update((todas) => {
      const nuevas = { ...todas };
      for (const id of this.idsTrenes) {
        if (m.origen === 'tren' && m.idEmisor === id) continue; // no oye su propia voz
        const mem = nuevas[id];
        const tabla = m.origen === 'tren' ? mem.trenes : mem.centro;
        const previo = tabla[m.idEmisor];
        if (previo && m.secuencia <= previo.mensaje.secuencia) continue; // duplicado o viejo
        const tablaNueva = { ...tabla, [m.idEmisor]: { mensaje: m, recibido } };
        nuevas[id] =
          m.origen === 'tren'
            ? { ...mem, trenes: tablaNueva }
            : { ...mem, centro: tablaNueva };
      }
      return nuevas;
    });
  }

  private calcular(): Alerta[] {
    const ahora = this.ahora();
    const viewer = this.trenPropio();
    const mem = this.memorias()[viewer];
    const trenes = this.simulacion.trenes();
    const propio = trenes.find((t) => t.id === viewer);
    const lista: Alerta[] = [];

    for (const tren of trenes) {
      if (tren.id === viewer) continue;

      const reg = mem.trenes[tren.id];
      if (!reg) {
        lista.push({
          tipo: 'sin-datos',
          idTren: tren.id,
          texto: `Tren ${tren.id}: todavía no hay datos. No se sabe dónde está.`,
          prioridad: 'alta',
        });
        continue;
      }

      const edad = Math.max(0, ahora - reg.recibido);
      const seg = Math.round(edad / 1000);

      if (edad > this.msSinDatos) {
        lista.push({
          tipo: 'sin-datos',
          idTren: tren.id,
          texto: `Tren ${tren.id}: sin datos desde hace ${seg} s. No se sabe dónde está.`,
          prioridad: 'alta',
        });
        continue;
      }

      if (edad > this.msDatoAntiguo) {
        lista.push({
          tipo: 'dato-antiguo',
          idTren: tren.id,
          texto: `Tren ${tren.id}: el último dato es de hace ${seg} s.`,
          prioridad: 'normal',
        });
        continue;
      }

      const delante = !!propio && reg.mensaje.posicion > propio.posicion;
      const metros = propio ? Math.round(Math.abs(reg.mensaje.posicion - propio.posicion)) : 0;

      if (reg.mensaje.estado === 'detenido' && delante) {
        const centro = mem.centro[tren.id];
        const centroVigente = centro && ahora - centro.recibido <= this.msDatoAntiguo;

        if (centroVigente && centro.mensaje.estado === 'circulando') {
          lista.push({
            tipo: 'contradiccion',
            idTren: tren.id,
            texto: `El centro dice que el tren ${tren.id} circula, pero él informa que está detenido a ${metros} m.`,
            prioridad: 'alta',
          });
        } else {
          lista.push({
            tipo: 'tren-detenido',
            idTren: tren.id,
            texto: `Tren ${tren.id} detenido a ${metros} m por delante.`,
            prioridad: 'alta',
          });
        }
      } else if (reg.mensaje.estado === 'marcha-reducida') {
        const velocidad = Math.round(reg.mensaje.velocidad);
        const lugar = delante ? 'por delante' : 'por detrás';
        const nosAcercamos = delante && !!propio && propio.velocidad > reg.mensaje.velocidad;
        lista.push({
          tipo: 'marcha-reducida',
          idTren: tren.id,
          texto: `Tren ${tren.id} en marcha reducida (${velocidad} km/h) a ${metros} m ${lugar}.${
            nosAcercamos ? ' Te acercas a él.' : ''
          }`,
          prioridad: nosAcercamos ? 'alta' : 'normal',
        });
      }
    }
    return lista;
  }
}