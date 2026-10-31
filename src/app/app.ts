import { Component } from '@angular/core';
import { Cabina } from './components/cabina';
import { Panel } from './components/panel';
import { Ruta } from './components/ruta';

@Component({
  selector: 'app-root',
  imports: [Ruta, Cabina, Panel],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}