import type { Calle } from '../types';

export type TipoExcepcion =
  | 'EXCEPCION_CALLE_INVALIDA'
  | 'EXCEPCION_CARGA_CALLEJERO'
  | 'EXCEPCION_ALTURA_INVALIDA'
  | 'EXCEPCION_CALLE_SIN_ALTURAS'
  | 'EXCEPCION_CRUCE_INEXISTENTE';

export interface TramoAltura {
  inicio: number;
  fin: number;
}

export interface ErrorResponse {
  type: string;
  message: string;
  matchings?: Array<{
    calle: string;
    inicio: number;
    fin: number;
  }>;
  matchings1?: Calle[];
  matchings2?: Calle[];
  streetName?: string;
}

export interface BaseException {
  id: TipoExcepcion;
  toString(): string;
  getError(): ErrorResponse;
}

export interface CalleInexistenteException extends BaseException {
  getNombreCalle(): string;
}

export interface CalleSinAlturasException extends BaseException {
  getNombreCalle(): string;
}

export interface CalleInexistenteAEsaAlturaException extends BaseException {
  getCalle(): string;
  getMatchings(): Calle[];
  getAltura(): number;
}

export interface CruceInexistenteException extends BaseException {
  getCalle1(): string;
  getCalle2(): string;
  getMatchingsCalle1(): Calle[];
  getMatchingsCalle2(): Calle[];
}
