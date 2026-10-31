import { Injectable, signal } from '@angular/core';
import { RadioService } from './radio.service';
import { SimulacionService } from './simulacion.service';

@Injectable({ providedIn: 'root' })
export class CentroService {
  encendido = signal(true);
  equivocado = signal(false);

  private secuencias: Record<string, number> = {};

  constructor(
    private radio: RadioService,
    private simulacion: SimulacionService,
  ) {
    setInterval(() => this.informar(), 1000);
  }

  apagar(): void {
    this.encendido.set(false);
  }

  encender(): void {
    this.encendido.set(true);
  }

  hacerQueSeEquivoque(valor: boolean): void {
    this.equivocado.set(valor);
  }

  private informar(): void {
    if (!this.encendido()) return;
    for (const t of this.simulacion.trenes()) {
      const secuencia = (this.secuencias[t.id] ?? 0) + 1;
      this.secuencias[t.id] = secuencia;
      this.radio.enviar({
        idEmisor: t.id, // el tren del que habla el centro
        origen: 'centro',
        posicion: t.posicion,
        velocidad: this.equivocado() ? 120 : t.velocidad,
        estado: this.equivocado() ? 'circulando' : t.estado,
        hora: Date.now(),
        secuencia,
      });
    }
  }
}