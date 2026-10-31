import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Mensaje } from '../models/train.model';

@Injectable({ providedIn: 'root' })
export class RadioService {
  retrasoMinimo = 100; // milisegundos
  retrasoMaximo = 500; // milisegundos
  probabilidadPerdida = 0.1; // 0.1 = 10 %

  private canal = new Subject<Mensaje>();

  escuchar(): Observable<Mensaje> {
    return this.canal.asObservable();
  }

  enviar(mensaje: Mensaje): void {
    if (Math.random() < this.probabilidadPerdida) {
      return; // el mensaje se pierde
    }
    const espera =
      this.retrasoMinimo +
      Math.random() * (this.retrasoMaximo - this.retrasoMinimo);
    setTimeout(() => this.canal.next(mensaje), espera);
  }
}