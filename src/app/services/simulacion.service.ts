import { Injectable, signal } from '@angular/core';
import { Tren } from '../models/train.model';
import { RadioService } from './radio.service';

@Injectable({ providedIn: 'root' })
export class SimulacionService {
  readonly longitudRuta = 10000; // metros
  readonly velocidadCrucero = 120; // km/h
  readonly velocidadReducida = 40; // km/h
  readonly segundosMarchaReducida = 15; // cuánto dura la marcha reducida
  private readonly intervaloMs = 200;
  private readonly ticksPorMensaje = 5; // un mensaje por tren cada 1 s

  private reloj: ReturnType<typeof setInterval> | null = null;
  private ticks = 0;
  private secuencias: Record<string, number> = {};
  private restoReducida: Record<string, number> = {}; // ticks que le quedan a cada tren

  trenes = signal<Tren[]>(this.trenesIniciales());

  constructor(private radio: RadioService) {}

  iniciar(): void {
    if (this.reloj) return;
    this.reloj = setInterval(() => {
      this.avanzar();
      this.controlarMarchaReducida();
      this.ticks++;
      if (this.ticks % this.ticksPorMensaje === 0) {
        for (const t of this.trenes()) this.emitirTren(t);
      }
    }, this.intervaloMs);
  }

  detener(): void {
    if (this.reloj) {
      clearInterval(this.reloj);
      this.reloj = null;
    }
  }

  reiniciar(): void {
    this.secuencias = {};
    this.restoReducida = {};
    this.ticks = 0;
    this.trenes.set(this.trenesIniciales());
  }

  pararTren(id: string): void {
    delete this.restoReducida[id];
    this.cambiar(id, 'detenido', 0);
    this.avisarAhora(id);
  }

  // Reanudar: primero marcha reducida y después marcha normal.
  arrancarTren(id: string): void {
    const t = this.trenes().find((x) => x.id === id);
    if (!t || t.estado !== 'detenido') return;
    this.restoReducida[id] = Math.round(
      (this.segundosMarchaReducida * 1000) / this.intervaloMs,
    );
    this.cambiar(id, 'marcha-reducida', this.velocidadReducida);
    this.avisarAhora(id);
  }

    // Marcha reducida a demanda: sirve para cualquier tren, esté circulando o detenido.
  ponerMarchaReducida(id: string): void {
    const t = this.trenes().find((x) => x.id === id);
    if (!t) return;
    this.restoReducida[id] = Math.round(
      (this.segundosMarchaReducida * 1000) / this.intervaloMs,
    );
    this.cambiar(id, 'marcha-reducida', this.velocidadReducida);
    this.avisarAhora(id);
  }

  private cambiar(id: string, estado: Tren['estado'], velocidad: number): void {
    this.trenes.update((lista) =>
      lista.map((t) => (t.id === id ? { ...t, estado, velocidad } : t)),
    );
  }

  private controlarMarchaReducida(): void {
    for (const id of Object.keys(this.restoReducida)) {
      this.restoReducida[id]--;
      if (this.restoReducida[id] > 0) continue;
      delete this.restoReducida[id];
      const t = this.trenes().find((x) => x.id === id);
      if (t && t.estado === 'marcha-reducida') {
        this.cambiar(id, 'circulando', this.velocidadCrucero);
        this.avisarAhora(id);
      }
    }
  }

  private avisarAhora(id: string): void {
    const t = this.trenes().find((x) => x.id === id);
    if (t) this.emitirTren(t);
  }

  private trenesIniciales(): Tren[] {
    return [
      { id: 'A', posicion: 6000, velocidad: this.velocidadCrucero, estado: 'circulando' },
      { id: 'B', posicion: 3000, velocidad: this.velocidadCrucero, estado: 'circulando' },
      { id: 'C', posicion: 0, velocidad: this.velocidadCrucero, estado: 'circulando' },
    ];
  }

  private avanzar(): void {
    const segundos = this.intervaloMs / 1000;
    this.trenes.update((lista) =>
      lista.map((t) => {
        if (t.estado === 'detenido') return t;
        const nueva = t.posicion + (t.velocidad / 3.6) * segundos;
        if (nueva >= this.longitudRuta) {
          return { ...t, posicion: this.longitudRuta, velocidad: 0, estado: 'detenido' };
        }
        return { ...t, posicion: nueva };
      }),
    );
  }

  private emitirTren(t: Tren): void {
    const secuencia = (this.secuencias[t.id] ?? 0) + 1;
    this.secuencias[t.id] = secuencia;
    this.radio.enviar({
      idEmisor: t.id,
      origen: 'tren',
      posicion: t.posicion,
      velocidad: t.velocidad,
      estado: t.estado,
      hora: Date.now(),
      secuencia,
    });
  }
}