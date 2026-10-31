import { Component, inject } from '@angular/core';
import { AlertasService } from '../services/alertas.service';
import { SimulacionService } from '../services/simulacion.service';

@Component({
  selector: 'app-ruta',
  standalone: true,
  template: `
    <section class="ruta">
      <h2>Ruta</h2>
      <div class="via">
        <div class="traviesas"></div>
        <div class="carril"></div>

        @for (t of simulacion.trenes(); track t.id) {
          <div
            class="tren"
            [class.detenido]="t.estado === 'detenido'"
            [class.reducida]="t.estado === 'marcha-reducida'"
            [class.propio]="t.id === alertas.trenPropio()"
            [style.left.%]="(t.posicion / simulacion.longitudRuta) * 100"
          >
            <div class="etiqueta">Tren {{ t.id }} · {{ t.velocidad }} km/h</div>
            <div class="cuerpo"></div>
            <div class="ruedas"><i></i><i></i><i></i><i></i></div>
          </div>
        }
      </div>

      <div class="km">
        @for (k of marcas; track k) {
          <span [style.left.%]="k * 10">{{ k }} km</span>
        }
      </div>

      <p class="leyenda">
        <span class="c-norm">Marcha normal</span> ·
        <span class="c-red">Marcha reducida</span> ·
        <span class="c-det">Detenido</span> · Borde blanco = tren que estás mirando
      </p>
    </section>
  `,
  styles: [
    `
      .ruta { padding: 16px 80px; background: #070d1a; color: #eaf2ff; font-family: Arial, sans-serif; }
      h2 { margin: 0 0 12px; }
      .via { position: relative; height: 100px; }
      .carril { position: absolute; left: 0; right: 0; bottom: 26px; height: 5px; background: #94a3b8; border-radius: 3px; }
      .traviesas {
        position: absolute; left: 0; right: 0; bottom: 20px; height: 10px;
        background: repeating-linear-gradient(90deg, #475569 0 6px, transparent 6px 22px);
      }
      .tren { --c: #22d3ee; position: absolute; top: 4px; width: 140px; transform: translateX(-50%); text-align: center; transition: left 0.2s linear; }
      .tren.detenido { --c: #ffb020; }
      .tren.reducida { --c: #a78bfa; }
      .etiqueta { font-size: 13px; margin-bottom: 4px; white-space: nowrap; }
      .cuerpo { position: relative; height: 34px; background: var(--c); border-radius: 10px 24px 6px 6px; overflow: hidden; }
      .cuerpo::before {
        content: ''; position: absolute; left: 8px; right: 32px; top: 7px; height: 10px; border-radius: 3px;
        background: repeating-linear-gradient(90deg, #070d1a 0 14px, transparent 14px 20px);
      }
      .cuerpo::after { content: ''; position: absolute; left: 0; right: 0; bottom: 6px; height: 4px; background: rgba(7, 13, 26, 0.35); }
      .ruedas { display: flex; justify-content: space-around; padding: 0 14px; margin-top: -4px; }
      .ruedas i { width: 14px; height: 14px; border-radius: 50%; background: #1c2740; border: 2px solid #9fb0cc; }
      .tren.propio .cuerpo { outline: 3px solid #eaf2ff; }
      .km { position: relative; height: 20px; margin-top: 4px; }
      .km span { position: absolute; transform: translateX(-50%); font-size: 12px; color: #9fb0cc; }
      .leyenda { margin: 8px 0 0; font-size: 14px; color: #9fb0cc; }
      .c-norm { color: #22d3ee; } .c-red { color: #a78bfa; } .c-det { color: #ffb020; }
    `,
  ],
})
export class Ruta {
  simulacion = inject(SimulacionService);
  alertas = inject(AlertasService);
  marcas = Array.from({ length: 11 }, (_, i) => i);
}