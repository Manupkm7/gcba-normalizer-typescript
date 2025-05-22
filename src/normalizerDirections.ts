import Callejero from '@usig-gcba/callejero';
import { DireccionType } from './types';
import NormalizadorAMBA from './normalizerAMBA';
import { RegexPatterns } from './utils/regexPatterns';
import { TextUtils } from './utils/textUtils';
import type {
  NormalizerOptions,
  NormalizerResult,
  NormalizerInstance,
  StringDireccionParsed,
} from './types/normalizer';
import type { Calle } from './types';
import * as exceptions from './Exceptions';
import StringDireccion from './stringDirection';
import {
  CALLE,
  CALLE_ALTURA,
  CALLE_Y_CALLE,
  EXCEPCION_CALLE_SIN_ALTURAS,
  INVALIDO,
} from './constant';
import Direccion from './Direction';

const DEFAULT_OPTIONS: NormalizerOptions = {
  lazyDataLoad: false,
  loadFullDatabase: true,
  aceptarCallesSinAlturas: false,
  callesEnMinusculas: false,
  maxPalabras: 7,
};

export class NormalizadorDirecciones implements NormalizerInstance {
  private static instance: NormalizadorDirecciones;
  private options: NormalizerOptions;
  private callejero: any;
  private initialized: boolean = false;
  private callejeroPromise: Promise<NormalizadorDirecciones> | null = null;
  private regexPatterns: RegexPatterns;

  private constructor(options: NormalizerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.regexPatterns = RegexPatterns.getInstance(this.options.maxPalabras!);
  }

  public static getInstance(options?: NormalizerOptions): NormalizadorDirecciones {
    if (!NormalizadorDirecciones.instance) {
      NormalizadorDirecciones.instance = new NormalizadorDirecciones(options);
    }
    return NormalizadorDirecciones.instance;
  }

  public async init(_options?: NormalizerOptions): Promise<NormalizadorDirecciones> {
    if (this.initialized) {
      return this;
    }

    if (!this.callejeroPromise) {
      this.callejeroPromise = Callejero.init({
        lazyDataLoad: this.options.lazyDataLoad,
        loadFullDatabase: this.options.loadFullDatabase,
        callesEnMinusculas: this.options.callesEnMinusculas,
        callejero: this.options.callejero,
      }).then((callejero: any) => {
        this.callejero = callejero;
        this.initialized = true;
        return this;
      });
    }

    return this.callejeroPromise as Promise<NormalizadorDirecciones>;
  }

  public setOptions(options: Partial<NormalizerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public listo(): boolean {
    return this.callejero?.listo() ?? false;
  }

  public inicializado(): boolean {
    return this.initialized;
  }

  private async normalizarCalleAltura(
    strDir: StringDireccionParsed,
    maxOptions: number,
    autoDesambiguarCalleAltura: boolean
  ): Promise<DireccionType[]> {
    let calles = this.callejero.matcheaCalle(strDir.strCalles);
    let options: DireccionType[] = [];

    try {
      options = await this.validarAlturas(strDir, calles, maxOptions);
    } catch (error) {
      if (options.length === 0 && calles.length > 0) {
        strDir.quitarAvsCalle();
        calles = this.callejero.matcheaCalle(strDir.strCalles);
        try {
          options = await this.validarAlturas(strDir, calles, maxOptions);
        } catch (error) {
          options = this.filtrarCallesQueNoSonAv(options);
          if (options.length === 0) {
            throw new exceptions.ErrorCalleInexistenteAEsaAltura(
              strDir.strCalles as string,
              calles,
              strDir.strAltura as number
            );
          }
        }
      } else if (options.length === 0 && calles.length === 0) {
        strDir.quitarPasajes();
        calles = this.callejero.matcheaCalle(strDir.strCalles);
        try {
          options = await this.validarAlturas(strDir, calles, maxOptions);
        } catch (error) {
          throw error;
        }
      }
    }

    if (autoDesambiguarCalleAltura && options.length > 1) {
      options = options.filter(opt =>
        TextUtils.esPermutacion(strDir.strCalles as string, opt.calle.nombre)
      );
    }

    return options;
  }

  private async validarAlturas(
    strDir: StringDireccionParsed,
    calles: Calle[],
    maxOptions: number
  ): Promise<DireccionType[]> {
    const retval: DireccionType[] = [];
    let hayCalleSN = 0;

    for (const calle of calles) {
      try {
        if (this.callejero.alturaValida(calle, strDir.strAltura)) {
          retval.push(Direccion.construirDireccion(calle, strDir.strAltura as number));
        }
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          (error as any).id === EXCEPCION_CALLE_SIN_ALTURAS &&
          this.options.aceptarCallesSinAlturas &&
          strDir.esAlturaSN.test(strDir.strAltura as string)
        ) {
          retval.push(Direccion.construirDireccion(calle, 0));
        }
        hayCalleSN++;
      }

      if (maxOptions && retval.length >= maxOptions) {
        break;
      }
    }

    if (calles.length === hayCalleSN && retval.length === 0) {
      throw new exceptions.ErrorCalleSinAlturas(calles[0].nombre);
    }

    return retval;
  }

  private filtrarCallesQueNoSonAv(dirs: DireccionType[]): DireccionType[] {
    return dirs.filter(dir => this.callejero.tieneTramosComoAv(dir.calle.codigo));
  }

  private async normalizarCalleYCalle(
    strDir: StringDireccionParsed,
    maxOptions: number
  ): Promise<DireccionType[]> {
    const calles1 = this.callejero.matcheaCalle(strDir.strCalles[0]);
    const calles2 = this.callejero.matcheaCalle(strDir.strCalles[1]);
    const matches = new Set<string>();
    const options: DireccionType[] = [];

    const matchCode = (calle1: Calle, calle2: Calle): string =>
      `${Math.min(Number(calle1.codigo), Number(calle2.codigo))}${Math.max(Number(calle1.codigo), Number(calle2.codigo))}`;

    for (const calle1 of calles1) {
      for (const calle2 of calles2) {
        if (
          calle1.codigo !== calle2.codigo &&
          !matches.has(matchCode(calle1, calle2)) &&
          this.callejero.seCruzaCon(calle1, calle2) &&
          this.callejero.seCruzaCon(calle2, calle1)
        ) {
          options.push(Direccion.construirDireccion(calle1, calle2));
          matches.add(matchCode(calle1, calle2));

          if (maxOptions && options.length >= maxOptions) {
            return options;
          }
        }
      }
    }

    if (options.length === 0 && calles1.length > 0 && calles2.length > 0) {
      const palabrasCalle1 = (strDir.strCalles[0] as string).split(' ');
      const palabrasCalle2 = (strDir.strCalles[1] as string).split(' ');
      const avPatterns = ['AV', 'AVDA', 'AVENIDA'];

      if (avPatterns.some(av => palabrasCalle1.includes(av))) {
        const strDir1 = { ...strDir };
        strDir1.quitarAvsCalle();
        try {
          const opts1 = await this.normalizarCalleYCalle(strDir1, maxOptions);
          return this.filtrarCallesQueNoSonAv(opts1);
        } catch (error) {
          throw new exceptions.ErrorCruceInexistente(
            strDir.strCalles[0] as string,
            calles1,
            strDir.strCalles[1] as string,
            calles2
          );
        }
      }

      if (avPatterns.some(av => palabrasCalle2.includes(av))) {
        const strDir2 = { ...strDir };
        strDir2.quitarAvsCalleCruce();
        try {
          const opts2 = await this.normalizarCalleYCalle(strDir2, maxOptions);
          return this.filtrarCallesQueNoSonAv(opts2);
        } catch (error) {
          throw new exceptions.ErrorCruceInexistente(
            strDir.strCalles[0] as string,
            calles1,
            strDir.strCalles[1] as string,
            calles2
          );
        }
      }
    }

    if (options.length === 0 && calles1.length > 0 && calles2.length > 0) {
      throw new exceptions.ErrorCruceInexistente(
        strDir.strCalles[0] as string,
        calles1,
        strDir.strCalles[1] as string,
        calles2
      );
    }

    return options;
  }

  public async normalizar(
    str: string,
    maxOptions?: number,
    autoDesambiguar: boolean = false
  ): Promise<Array<DireccionType | Calle>> {
    const strDir = new StringDireccion(str, this.options.aceptarCallesSinAlturas ?? false);
    let res: Array<DireccionType | Calle> = [];

    switch (strDir.tipo) {
      case CALLE:
        res = this.callejero.matcheaCalle(strDir.strCalles, maxOptions);
        break;
      case CALLE_ALTURA:
        res = await this.normalizarCalleAltura(
          strDir as unknown as StringDireccionParsed,
          maxOptions ?? 0,
          autoDesambiguar
        );
        break;
      case CALLE_Y_CALLE:
        res = await this.normalizarCalleYCalle(
          strDir as unknown as StringDireccionParsed,
          maxOptions ?? 0
        );
        if (res.length === 0) {
          strDir.setearCalleAltura();
          res = await this.normalizarCalleAltura(
            strDir as unknown as StringDireccionParsed,
            maxOptions ?? 0,
            autoDesambiguar
          );
        }
        break;
      case INVALIDO:
        res = [];
        break;
    }

    if (Array.isArray(res)) {
      if (res.length > 0) {
        return res;
      } else {
        throw new exceptions.ErrorCalleInexistente(str);
      }
    }

    return res;
  }

  public async buscarDireccion(texto: string): Promise<NormalizerResult | false> {
    const res = await this.buscarDirecciones(texto, 1);
    return res ? res[0] : false;
  }

  public async buscarDirecciones(
    texto: string,
    resultadosMaximos?: number
  ): Promise<NormalizerResult[] | false> {
    const resultados: NormalizerResult[] = [];
    const rePosiblesDirecciones = /((\s+y\s+)|(\s+\d+))/gi;
    let matcheo: RegExpExecArray | null;

    while ((matcheo = rePosiblesDirecciones.exec(texto))) {
      let res: NormalizerResult | false;

      if (matcheo[0].match(this.regexPatterns.cruceCalles)) {
        res = await this.buscarCruceCalles(texto, matcheo.index, matcheo[0].length);
      } else {
        res = await this.buscarCalleAltura(texto.substring(0, matcheo.index + matcheo[0].length));
      }

      if (res) {
        if (resultados.length > 0) {
          const ultimo = resultados[resultados.length - 1];
          if (res.pos === ultimo.pos && res.match.toString() === ultimo.match.toString()) {
            if (res.len > ultimo.len) {
              resultados.pop();
              resultados.push(res);
            }
          } else {
            resultados.push(res);
          }
        } else {
          resultados.push(res);
        }
      }

      if (resultadosMaximos && resultados.length >= resultadosMaximos) {
        return resultados;
      }
    }

    return resultados.length > 0 ? resultados : false;
  }

  private async buscarCruceCalles(
    texto: string,
    posConector: number,
    lenConector: number
  ): Promise<NormalizerResult | false> {
    const textoCalle = texto.substring(0, posConector).split('').reverse().join('');
    const textoCruce = texto.substr(posConector + lenConector);
    const conector = texto.substr(posConector, lenConector);
    let calle = '';
    let cruce = '';
    let rCalle: Calle[] = [];
    let rCruce: Calle[] = [];

    try {
      for (let i = 1; i < this.options.maxPalabras!; ++i) {
        const match = textoCruce.match(this.regexPatterns.getCallePattern(i));
        if (!match || textoCruce.search(this.regexPatterns.getCallePattern(i)) !== 0) {
          throw new Error('Direccion no valida');
        }
        cruce = match[0];
        rCruce = (await this.normalizar(cruce, 2, false)) as Calle[];
      }
    } catch (err) {
      const match = textoCruce.match(
        this.regexPatterns.getCallePattern(this.options.maxPalabras! - 1)
      );
      if (match) {
        cruce = match[0];
      }
    }

    try {
      for (let i = 1; i < this.options.maxPalabras!; ++i) {
        const match = textoCalle.match(this.regexPatterns.getCallePattern(i));
        if (!match || textoCalle.search(this.regexPatterns.getCallePattern(i)) !== 0) {
          throw new Error('Direccion no valida');
        }
        calle = match[0].split('').reverse().join('');
        rCalle = (await this.normalizar(calle, 2, false)) as Calle[];
      }
    } catch (err) {
      const match = textoCalle.match(
        this.regexPatterns.getCallePattern(this.options.maxPalabras! - 1)
      );
      if (match) {
        calle = match[0].split('').reverse().join('');
      }
    }

    try {
      const resultados = (await this.normalizar(
        calle + conector + cruce,
        2,
        false
      )) as DireccionType[];

      if (
        resultados.length === 1 &&
        TextUtils.verificarBusquedaDireccion(resultados[0].toString(), calle + conector + cruce)
      ) {
        return {
          match: resultados[0],
          pos: texto.search(calle),
          len: calle.length + conector.length + cruce.length,
        };
      }
    } catch (e) {
      return false;
    }

    return false;
  }

  private async buscarCalleAltura(texto: string): Promise<NormalizerResult | false> {
    const textoDireccion = texto.split('').reverse().join('');
    let direccion = '';
    let rDireccion: DireccionType[] = [];

    try {
      for (let i = 1; i < this.options.maxPalabras!; ++i) {
        const match = textoDireccion.match(this.regexPatterns.getCalleAlturaPattern(i));
        if (!match || textoDireccion.search(this.regexPatterns.getCalleAlturaPattern(i)) !== 0) {
          throw new Error('Direccion no valida');
        }
        direccion = match[0].split('').reverse().join('');
        rDireccion = (await this.normalizar(direccion, 2, false)) as DireccionType[];
      }
    } catch (err) {
      const match = textoDireccion.match(
        this.regexPatterns.getCalleAlturaPattern(this.options.maxPalabras! - 1)
      );
      if (match) {
        direccion = match[0].split('').reverse().join('');
        rDireccion = (await this.normalizar(direccion, 2, false)) as DireccionType[];
      }
    }

    if (
      rDireccion.length > 0 &&
      TextUtils.verificarBusquedaDireccion(rDireccion[0].toString(), direccion)
    ) {
      return {
        match: rDireccion[0],
        pos: texto.search(direccion),
        len: direccion.length,
      };
    }

    return false;
  }
}

export const Normalizador = NormalizadorDirecciones.getInstance();
export { Direccion, NormalizadorAMBA };
