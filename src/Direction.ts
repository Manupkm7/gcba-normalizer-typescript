import { TIPOS_DIRECCION, TIPOS_OBJETO, REGEX_PUNTO_WKT } from './constants';
import type {
  Calle,
  Coordenadas,
  DireccionType,
  DireccionCalleAltura,
  DireccionCalleYCalle,
  DireccionInput,
} from './types';

/**
 * Convierte una dirección a su representación en texto
 * @param direccion - La dirección a convertir
 * @returns La dirección formateada como texto
 */
const toString = (direccion: DireccionType): string => {
  const { calle, tipoDireccion } = direccion;
  let resultado = '';

  if (tipoDireccion === TIPOS_DIRECCION.CALLE_ALTURA) {
    const altura = (direccion as DireccionCalleAltura).altura;
    resultado = `${calle.nombre} ${altura > 0 ? altura : 'S/N'}`;
  } else {
    const { calleCruce } = direccion as DireccionCalleYCalle;
    const separador = calleCruce.nombre.match(/^(I|Hi|HI).*/) ? ' e ' : ' y ';
    resultado = `${calle.nombre}${separador}${calleCruce.nombre}`;
  }

  if (calle.partido) {
    resultado += `, ${calle.localidad}`;
  }

  return resultado;
};

/**
 * Convierte una cadena WKT a un objeto de coordenadas
 * @param wkt - Cadena WKT en formato POINT
 * @returns Objeto de coordenadas o undefined si el formato es inválido
 */
const fromWkt = (wkt: string): Coordenadas | undefined => {
  const match = wkt.match(REGEX_PUNTO_WKT);
  if (!match) return undefined;

  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2]),
  };
};

/**
 * Clase para manejar direcciones
 */
export class Direccion {
  /**
   * Construye una dirección a partir de una calle y una altura o calle de cruce
   * @param calle1 - Primera calle
   * @param calle2OAltura - Segunda calle o altura
   * @returns Objeto de dirección
   */
  static construirDireccion(calle1: Calle, calle2OAltura: Calle | number): DireccionType {
    const calle = calle1.tipo === TIPOS_OBJETO.CALLE ? calle1 : null;
    if (!calle) {
      throw new Error('La primera calle debe ser de tipo CALLE');
    }

    let direccion: DireccionType;

    if (typeof calle2OAltura === 'number' || !isNaN(Number(calle2OAltura))) {
      const altura = typeof calle2OAltura === 'number' ? calle2OAltura : Number(calle2OAltura);
      direccion = {
        calle,
        altura,
        tipoDireccion: TIPOS_DIRECCION.CALLE_ALTURA,
        tipo: TIPOS_OBJETO.DIRECCION,
        nombre: '',
      } as DireccionCalleAltura;
    } else if (calle2OAltura.tipo === TIPOS_OBJETO.CALLE) {
      direccion = {
        calle,
        calleCruce: calle2OAltura,
        tipoDireccion: TIPOS_DIRECCION.CALLE_Y_CALLE,
        tipo: TIPOS_OBJETO.DIRECCION,
        nombre: '',
      } as DireccionCalleYCalle;
    } else {
      throw new Error('El segundo parámetro debe ser una altura o una calle');
    }

    direccion.nombre = toString(direccion);
    return direccion;
  }

  /**
   * Compara dos direcciones para determinar si son iguales
   * @param dir1 - Primera dirección
   * @param dir2 - Segunda dirección
   * @returns true si las direcciones son iguales
   */
  static isEqual(dir1: DireccionType, dir2: DireccionType): boolean {
    if (dir1.tipo !== TIPOS_OBJETO.DIRECCION || dir2.tipo !== TIPOS_OBJETO.DIRECCION) {
      return false;
    }

    if (dir1.tipoDireccion !== dir2.tipoDireccion) {
      return false;
    }

    if (dir1.tipoDireccion === TIPOS_DIRECCION.CALLE_ALTURA) {
      const d1 = dir1 as DireccionCalleAltura;
      const d2 = dir2 as DireccionCalleAltura;
      return d1.calle.codigo === d2.calle.codigo && d1.altura === d2.altura;
    }

    const d1 = dir1 as DireccionCalleYCalle;
    const d2 = dir2 as DireccionCalleYCalle;
    return (
      (d1.calle.codigo === d2.calle.codigo && d1.calleCruce.codigo === d2.calleCruce.codigo) ||
      (d1.calle.codigo === d2.calleCruce.codigo && d1.calleCruce.codigo === d2.calle.codigo)
    );
  }

  /**
   * Crea una dirección a partir de un objeto
   * @param obj - Objeto con los datos de la dirección
   * @returns Objeto de dirección
   */
  static fromObj(obj: DireccionInput): DireccionType {
    const nombre = obj.nombre_calle ?? obj.nombre;
    if (!nombre) {
      throw new Error('El nombre de la calle es requerido');
    }
    let direccion: DireccionType;

    if (obj.tipo !== undefined && obj.calle?.codigo) {
      direccion = this.construirDireccion(
        obj.calle,
        obj.tipo === TIPOS_DIRECCION.CALLE_ALTURA ? obj.altura! : obj.calle_cruce!
      );
    } else {
      const calle: Calle = {
        codigo: obj.cod_calle!,
        nombre: nombre,
        partido: obj.nombre_partido,
        localidad: obj.nombre_localidad,
        tipo: TIPOS_OBJETO.CALLE,
        alturas: [],
      };

      if (obj.cod_calle2 || obj.cod_calle_cruce) {
        const calleCruce: Calle = {
          codigo: obj.cod_calle2 || obj.cod_calle_cruce!,
          nombre: obj.calle2 || obj.nombre_calle_cruce!,
          partido: obj.nombre_partido,
          localidad: obj.nombre_localidad,
          tipo: TIPOS_OBJETO.CALLE,
          alturas: [],
        };
        direccion = this.construirDireccion(calle, calleCruce);
      } else {
        direccion = this.construirDireccion(calle, obj.altura!);
      }

      if (obj.nombre_partido) {
        direccion.descripcion = `${obj.nombre_localidad}, ${obj.nombre_partido}`;
      }
    }

    if (obj.smp !== undefined && obj.smp !== null) {
      direccion.smp = obj.smp;
    }

    if (obj.coordenadas !== undefined && obj.coordenadas !== null) {
      direccion.coordenadas =
        typeof obj.coordenadas === 'string' ? fromWkt(obj.coordenadas) : obj.coordenadas;
    }

    return direccion;
  }
}

export default Direccion;
