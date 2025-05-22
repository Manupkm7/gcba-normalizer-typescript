import type { Calle, DireccionType } from '../types';

export interface NormalizerOptions {
  lazyDataLoad?: boolean;
  loadFullDatabase?: boolean;
  aceptarCallesSinAlturas?: boolean;
  callesEnMinusculas?: boolean;
  maxPalabras?: number;
  callejero?: any;
}

export interface NormalizerResult {
  match: DireccionType | Calle;
  pos: number;
  len: number;
}

export interface NormalizerInstance {
  normalizar: (
    str: string,
    maxOptions?: number,
    autoDesambiguar?: boolean
  ) => Promise<Array<DireccionType | Calle>>;
  buscarDireccion: (texto: string) => Promise<NormalizerResult | false>;
  buscarDirecciones: (
    texto: string,
    resultadosMaximos?: number
  ) => Promise<NormalizerResult[] | false>;
  listo: () => boolean;
  setOptions: (options: Partial<NormalizerOptions>) => void;
  init: (options?: NormalizerOptions) => Promise<NormalizerInstance>;
  inicializado: () => boolean;
}

export interface StringDireccionParsed {
  tipo: string;
  strCalles: string | string[];
  strAltura: string | number;
  strInput: string;
  esAlturaSN: RegExp;
  quitarAvsCalle: () => void;
  quitarAvsCalleCruce: () => void;
  quitarPasajes: () => void;
  setearCalleAltura: () => void;
}
