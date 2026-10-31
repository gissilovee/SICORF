export type EstadoTren = 'circulando' | 'detenido' | 'marcha-reducida';
export type OrigenMensaje = 'tren' | 'centro';
export type TipoAlerta = 'tren-detenido' | 'contradiccion' | 'dato-antiguo' | 'sin-datos' | 'marcha-reducida';
export type PrioridadAlerta = 'normal' | 'alta';

export interface Tren {
  id: string;
  posicion: number; // metros desde el inicio de la ruta
  velocidad: number; // km/h
  estado: EstadoTren;
}

export interface Mensaje {
  idEmisor: string;
  origen: OrigenMensaje;
  posicion: number;
  velocidad: number;
  estado: EstadoTren;
  hora: number; // momento en que se creó, en milisegundos
  secuencia: number; // sube 1 en cada mensaje
}

export interface Alerta {
  tipo: TipoAlerta;
  idTren: string;
  texto: string;
  prioridad: PrioridadAlerta;
}