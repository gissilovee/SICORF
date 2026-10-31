import { Component, computed, inject, signal } from '@angular/core';
import { AlertasService } from '../services/alertas.service';
import { SimulacionService } from '../services/simulacion.service';

interface Fila {
  id: string;
  clase: 'verde' | 'azul' | 'gris';
  etiqueta: string;
  detalle: string;
}

@Component({
  selector: 'app-cabina',
  standalone: true,
  template: `
    <section class="cabina">
      <div class="selector">
        <span>Ver la cabina de:</span>
        @for (id of alertasService.idsTrenes; track id) {
          <button
            [class.activo]="id === alertasService.trenPropio()"
            (click)="alertasService.cambiarTren(id)"
          >
            Tren {{ id }}
          </button>
        }
      </div>

      <h2>Cabina del tren {{ alertasService.trenPropio() }}</h2>

      <div class="mio">
        <span>
          Tu tren: <strong>{{ nombreEstado(miTren()?.estado) }}</strong>· {{ miTren()?.velocidad }} km/h
        </span>
        <button (click)="simulacion.pararTren(alertasService.trenPropio())">
          Avisar: me detengo
        </button>
        <button (click)="simulacion.arrancarTren(alertasService.trenPropio())">
          Reanudar (40 km/h y luego normal)
        </button>
      </div>

      <div class="alertas">
        @for (a of alertasService.alertas(); track a.tipo + a.idTren) {
          <div class="alerta" [class.alta]="a.prioridad === 'alta'">{{ a.texto }}</div>
        } @empty {
          <div class="sin-alertas">Sin alertas</div>
        }
      </div>

      <h3>Otros trenes</h3>
      @for (f of filas(); track f.id) {
        <div [class]="'fila ' + f.clase">
          <strong>Tren {{ f.id }}</strong>
          <span class="etiqueta">{{ f.etiqueta }}</span>
          <span>{{ f.detalle }}</span>
        </div>
      }

      <p class="leyenda">
        <span class="verde">Confirmado</span> ·
        <span class="azul">De otro tren</span> ·
        <span class="gris">Antiguo o sin datos</span>
      </p>
    </section>
  `,
  styles: [
    `
      .cabina { padding: 16px 48px; background: #0f1a30; color: #eaf2ff; font-family: Arial, sans-serif; }
      h2, h3 { margin: 0 0 8px; }
      h3 { margin-top: 16px; }
      button { margin-right: 8px; padding: 8px 12px; cursor: pointer; }
      button.activo { background: #22d3ee; font-weight: bold; }
      .selector { margin-bottom: 12px; }
      .mio { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding: 10px 12px; margin-bottom: 12px; border-radius: 8px; background: #1c2740; }
      .alerta { padding: 10px 12px; margin-bottom: 8px; border-radius: 8px; background: #1c2740; border-left: 6px solid #9fb0cc; }
      .alerta.alta { background: #3a2a05; border-left-color: #ffb020; font-weight: bold; }
      .sin-alertas { color: #9fb0cc; }
      .fila { display: flex; gap: 16px; align-items: center; padding: 10px 12px; margin-bottom: 8px; border-radius: 8px; background: #1c2740; border-left: 6px solid #9fb0cc; }
      .fila.verde { border-left-color: #34d399; }
      .fila.azul { border-left-color: #60a5fa; }
      .fila.gris { border-left-color: #9fb0cc; opacity: 0.7; }
      .etiqueta { font-size: 13px; padding: 2px 8px; border-radius: 999px; background: #070d1a; }
      .leyenda { margin-top: 12px; font-size: 14px; }
      .verde { color: #34d399; } .azul { color: #60a5fa; } .gris { color: #9fb0cc; }
    `,
  ],
})
export class Cabina {
  alertasService = inject(AlertasService);
  simulacion = inject(SimulacionService);

  private ahora = signal(Date.now());
  nombreEstado(estado?: string): string {
    return estado === 'marcha-reducida' ? 'marcha reducida' : (estado ?? '');
  }
  constructor() {
    setInterval(() => this.ahora.set(Date.now()), 500);
  }

  miTren = computed(() =>
    this.simulacion.trenes().find((t) => t.id === this.alertasService.trenPropio()),
  );

  filas = computed<Fila[]>(() => {
    const a = this.alertasService;
    const ahora = this.ahora();
    const propioId = a.trenPropio();
    const trenes = this.simulacion.trenes();
    const propio = trenes.find((t) => t.id === propioId);

    return trenes
      .filter((t) => t.id !== propioId)
      .map((t): Fila => {
        const reg = a.tablaTrenes()[t.id];
        if (!reg) {
          return { id: t.id, clase: 'gris', etiqueta: 'Sin datos', detalle: 'No se sabe dónde está' };
        }
        const edad = Math.max(0, ahora - reg.recibido);
        const seg = Math.round(edad / 1000);

        if (edad > a.msSinDatos) {
          return { id: t.id, clase: 'gris', etiqueta: 'Sin datos', detalle: `Sin datos desde hace ${seg} s` };
        }
        if (edad > a.msDatoAntiguo) {
          return { id: t.id, clase: 'gris', etiqueta: 'Dato antiguo', detalle: `Último dato hace ${seg} s` };
        }

        const centro = a.tablaCentro()[t.id];
        const centroVigente = !!centro && ahora - centro.recibido <= a.msDatoAntiguo;
        const coincide = centroVigente && centro.mensaje.estado === reg.mensaje.estado;

        const dist = propio ? Math.round(reg.mensaje.posicion - propio.posicion) : 0;
        const lugar = dist >= 0 ? `a ${dist} m por delante` : `a ${-dist} m por detrás`;

        return {
          id: t.id,
          clase: coincide ? 'verde' : 'azul',
          etiqueta: coincide ? 'Confirmado' : 'De otro tren',
          detalle: `${this.nombreEstado(reg.mensaje.estado)} · ${Math.round(reg.mensaje.velocidad)} km/h · ${lugar}`,
        };
      });
  });
}