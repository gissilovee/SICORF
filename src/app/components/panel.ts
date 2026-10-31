import { Component, inject, signal } from '@angular/core';
import { AlertasService } from '../services/alertas.service';
import { CentroService } from '../services/centro.service';
import { RadioService } from '../services/radio.service';
import { SimulacionService } from '../services/simulacion.service';

@Component({
  selector: 'app-panel',
  standalone: true,
  template: `
    <section class="panel">
      <h2>Panel de pruebas</h2>

      <div class="grupo">
        <h3>Simulación</h3>
        <button (click)="simulacion.iniciar()">Iniciar</button>
        <button (click)="simulacion.detener()">Detener</button>
        <button (click)="reiniciar()">Reiniciar</button>
      </div>

      <div class="grupo">
        <h3>Trenes</h3>
        @for (id of alertas.idsTrenes; track id) {
          <div class="linea">
            <strong>Tren {{ id }}</strong>
            <button (click)="simulacion.pararTren(id)">Parar</button>
            <button (click)="simulacion.arrancarTren(id)">Arrancar</button>
            <button (click)="simulacion.ponerMarchaReducida(id)">Marcha reducida</button>
          </div>
        }
      </div>

      <div class="grupo">
        <h3>Centro de control</h3>
        <button (click)="centro.apagar()">Apagar</button>
        <button (click)="centro.encender()">Encender</button>
        <button (click)="centro.hacerQueSeEquivoque(!centro.equivocado())">
          {{ centro.equivocado() ? 'Dejar de equivocarse' : 'Hacer que se equivoque' }}
        </button>
        <p>Estado: {{ centro.encendido() ? 'encendido' : 'apagado' }}</p>
      </div>

      <div class="grupo">
        <h3>Radio</h3>
        <button (click)="alternarRadio()">
          {{ radioMala() ? 'Volver a radio normal' : 'Poner radio mala' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .panel { padding: 16px; background: #0f1a30; color: #eaf2ff; border-radius: 12px; font-family: Arial, sans-serif; }
      .grupo { margin-bottom: 12px; }
      .linea { margin-bottom: 6px; }
      .linea strong { display: inline-block; width: 64px; }
      h2, h3 { margin: 0 0 8px; }
      button { margin-right: 8px; padding: 8px 12px; cursor: pointer; }
    `,
  ],
})
export class Panel {
  simulacion = inject(SimulacionService);
  centro = inject(CentroService);
  alertas = inject(AlertasService);
  private radio = inject(RadioService);

  radioMala = signal(false);

  reiniciar(): void {
    this.simulacion.reiniciar();
    this.alertas.reiniciar();
  }

  alternarRadio(): void {
    const mala = !this.radioMala();
    this.radioMala.set(mala);
    this.radio.probabilidadPerdida = mala ? 0.4 : 0.1;
    this.radio.retrasoMinimo = mala ? 1000 : 100;
    this.radio.retrasoMaximo = mala ? 2500 : 500;
  }
}