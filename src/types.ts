export type TipoDireccion = 'DIRECCION_CALLE_ALTURA' | 'DIRECCION_CALLE_Y_CALLE' | 'INVALIDO';

export interface Coordenadas {
  x: number;
  y: number;
}

export interface TramoAltura {
  inicio: number;
  fin: number;
}

export interface Calle {
  codigo: string;
  nombre: string;
  partido?: string;
  localidad?: string;
  descripcion?: string;
  tipo: 'CALLE';
  alturas: TramoAltura[];
}

export interface DireccionBase {
  calle: Calle;
  calleCruce?: Calle;
  altura?: number;
  tipoDireccion: TipoDireccion;
  smp?: string;
  coordenadas?: Coordenadas;
  tipo: 'DIRECCION';
  nombre: string;
  descripcion?: string;
}

export interface DireccionCalleAltura extends DireccionBase {
  tipoDireccion: 'DIRECCION_CALLE_ALTURA';
  altura: number;
}

export interface DireccionCalleYCalle extends DireccionBase {
  tipoDireccion: 'DIRECCION_CALLE_Y_CALLE';
  calleCruce: Calle;
}

export type DireccionType = DireccionCalleAltura | DireccionCalleYCalle;

export interface DireccionInput {
  cod_calle?: string;
  cod_calle2?: string;
  cod_calle_cruce?: string;
  nombre_calle?: string;
  nombre?: string;
  calle2?: string;
  nombre_calle_cruce?: string;
  nombre_partido?: string;
  nombre_localidad?: string;
  altura?: number;
  tipo?: TipoDireccion;
  smp?: string;
  coordenadas?: string | Coordenadas;
  calle?: Calle;
  calle_cruce?: Calle;
} 