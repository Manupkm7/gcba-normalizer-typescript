import { TIPOS_EXCEPCION, MENSAJES_ERROR } from './constants';
import type { Calle } from './types';
import type {
  CalleInexistenteException,
  CalleInexistenteAEsaAlturaException,
  CalleSinAlturasException,
  CruceInexistenteException,
  ErrorResponse,
  TipoExcepcion,
} from './types/exceptions';

/**
 * Clase base para todas las excepciones del normalizador
 */
abstract class BaseExceptionClass implements Error {
  readonly name: string;
  readonly id: TipoExcepcion;
  readonly message: string;

  constructor(id: TipoExcepcion, message: string) {
    this.name = this.constructor.name;
    this.id = id;
    this.message = message;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  abstract getError(): ErrorResponse;

  toString(): string {
    return this.message;
  }
}

/**
 * Excepción lanzada cuando una calle no existe
 */
export class ErrorCalleInexistente extends BaseExceptionClass implements CalleInexistenteException {
  constructor(private readonly nombreCalle: string) {
    super(TIPOS_EXCEPCION.CALLE_INVALIDA, `Calle inexistente: ${nombreCalle}`);
  }

  getNombreCalle(): string {
    return this.nombreCalle;
  }

  getError(): ErrorResponse {
    return {
      type: 'CALLE_INEXISTENTE',
      message: MENSAJES_ERROR.CALLE_INEXISTENTE,
    };
  }
}

/**
 * Excepción lanzada cuando hay un error al cargar el callejero
 */
export class ErrorEnCargaDelCallejero extends BaseExceptionClass {
  constructor() {
    super(TIPOS_EXCEPCION.CARGA_CALLEJERO, 'Callejero no disponible.');
  }

  getError(): ErrorResponse {
    return {
      type: 'CALLES_SIN_CARGAR',
      message: MENSAJES_ERROR.CALLES_SIN_CARGAR,
    };
  }
}

/**
 * Excepción lanzada cuando una calle no existe a una altura específica
 */
export class ErrorCalleInexistenteAEsaAltura
  extends BaseExceptionClass
  implements CalleInexistenteAEsaAlturaException
{
  constructor(
    private readonly calle: string,
    private readonly matchings: Calle[],
    private readonly altura: number
  ) {
    super(TIPOS_EXCEPCION.ALTURA_INVALIDA, `La calle ${calle} no existe a la altura ${altura}`);
  }

  getCalle(): string {
    return this.calle;
  }

  getMatchings(): Calle[] {
    return this.matchings;
  }

  getAltura(): number {
    return this.altura;
  }

  getError(): ErrorResponse {
    const errorMatchings = this.matchings.flatMap(calle =>
      calle.alturas.map(tramo => ({
        calle: calle.nombre,
        inicio: tramo.inicio,
        fin: tramo.fin,
      }))
    );

    return {
      type: 'ALTURA_INVALIDA',
      message: MENSAJES_ERROR.ALTURA_INVALIDA,
      matchings: errorMatchings,
    };
  }
}

/**
 * Excepción lanzada cuando una calle no tiene alturas
 */
export class ErrorCalleSinAlturas extends BaseExceptionClass implements CalleSinAlturasException {
  constructor(private readonly nombreCalle: string) {
    super(
      TIPOS_EXCEPCION.CALLE_SIN_ALTURAS,
      MENSAJES_ERROR.CALLE_SIN_ALTURAS.replace('{calle}', nombreCalle)
    );
  }

  getNombreCalle(): string {
    return this.nombreCalle;
  }

  getError(): ErrorResponse {
    return {
      type: 'CALLE_SIN_ALTURAS',
      streetName: this.nombreCalle,
      message: this.message,
    };
  }
}

/**
 * Excepción lanzada cuando un cruce de calles no existe
 */
export class ErrorCruceInexistente extends BaseExceptionClass implements CruceInexistenteException {
  constructor(
    private readonly calle1: string,
    private readonly matchingsCalle1: Calle[],
    private readonly calle2: string,
    private readonly matchingsCalle2: Calle[]
  ) {
    super(TIPOS_EXCEPCION.CRUCE_INEXISTENTE, `Cruce inexistente: ${calle1} y ${calle2}`);
  }

  getCalle1(): string {
    return this.calle1;
  }

  getCalle2(): string {
    return this.calle2;
  }

  getMatchingsCalle1(): Calle[] {
    return this.matchingsCalle1;
  }

  getMatchingsCalle2(): Calle[] {
    return this.matchingsCalle2;
  }

  getError(): ErrorResponse {
    return {
      type: 'CRUCE_INEXISTENTE',
      message: MENSAJES_ERROR.CRUCE_INEXISTENTE,
      matchings1: this.matchingsCalle1,
      matchings2: this.matchingsCalle2,
    };
  }
}
