import URI from 'urijs';
import type { DireccionType, Calle } from './types';
import DireccionClass from './Direction';
import { TIPOS_OBJETO } from './constants';

export interface NormalizadorAMBAOptions {
  debug?: boolean;
  exclude?: string;
  server?: string;
  maxSuggestions?: number;
  serverTimeout?: number;
  maxRetries?: number;
  afterAbort?: (error: Error) => void;
  afterRetry?: (attempt: number) => void;
  afterServerRequest?: (url: string) => void;
  afterServerResponse?: (response: any) => void;
}

const DEFAULT_OPTIONS: Required<NormalizadorAMBAOptions> = {
  debug: false,
  exclude: 'caba',
  server: 'https://servicios.usig.buenosaires.gob.ar/normalizar',
  maxSuggestions: 10,
  serverTimeout: 5000,
  maxRetries: 3,
  afterAbort: () => {},
  afterRetry: () => {},
  afterServerRequest: () => {},
  afterServerResponse: () => {},
};

export class NormalizadorAMBA {
  private static instance: NormalizadorAMBA;
  private options: Required<NormalizadorAMBAOptions>;
  private lastRequest: Promise<any> | null = null;
  private retryCount: number = 0;

  private constructor(options: NormalizadorAMBAOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Obtiene la instancia única del normalizador AMBA
   * @param options - Opciones de configuración
   * @returns Instancia del normalizador
   */
  public static getInstance(options?: NormalizadorAMBAOptions): NormalizadorAMBA {
    if (!NormalizadorAMBA.instance) {
      NormalizadorAMBA.instance = new NormalizadorAMBA(options);
    }
    return NormalizadorAMBA.instance;
  }

  /**
   * Inicializa el normalizador con las opciones especificadas
   * @param options - Opciones de configuración
   * @returns Instancia del normalizador
   */
  public init(options?: NormalizadorAMBAOptions): NormalizadorAMBA {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Busca y normaliza una dirección de forma asíncrona
   * @param text - Texto a buscar
   * @param success - Callback de éxito
   * @param error - Callback de error
   * @param maxSug - Máximo número de sugerencias
   */
  public async buscar(
    text: string,
    success?: (results: Array<DireccionType | Calle>) => void,
    error?: (error: Error) => void,
    maxSug?: number
  ): Promise<void> {
    const maxSuggestions = maxSug ?? this.options.maxSuggestions;
    const requestOptions = {
      ...this.options,
      maxOptions: maxSuggestions,
      direccion: text,
    };

    try {
      this.lastRequest = this.makeRequest(requestOptions);
      const results = await this.lastRequest;

      const newResults = this.processResults(results, maxSuggestions);

      if (typeof success === 'function') {
        success(newResults);
      }
    } catch (err) {
      if (this.retryCount < this.options.maxRetries) {
        this.retryCount++;
        this.options.afterRetry(this.retryCount);
        await this.buscar(text, success, error, maxSug);
      } else {
        this.retryCount = 0;
        if (typeof error === 'function') {
          error(err as Error);
        }
      }
    }
  }

  /**
   * Realiza una petición al servidor
   * @param data - Datos de la petición
   * @returns Promise con la respuesta
   */
  private async makeRequest(data: Record<string, any>): Promise<any> {
    const url = URI(this.options.server).search(data).toString();
    this.options.afterServerRequest(url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      this.options.afterAbort(new Error('Timeout'));
    }, this.options.serverTimeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.options.afterServerResponse(result);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Procesa los resultados de la búsqueda
   * @param results - Resultados de la búsqueda
   * @param maxSuggestions - Máximo número de sugerencias
   * @returns Array de direcciones o calles normalizadas
   */
  private processResults(results: any, maxSuggestions: number): Array<DireccionType | Calle> {
    const newResults: Array<DireccionType | Calle> = [];

    if (!results.direccionesNormalizadas) {
      return newResults;
    }

    const maxSug = Math.min(results.direccionesNormalizadas.length, maxSuggestions);

    for (let i = 0; i < maxSug; i++) {
      const res = results.direccionesNormalizadas[i];
      let sug: DireccionType | Calle;

      if (res.tipo === 'calle') {
        sug = {
          codigo: res.cod_calle,
          nombre: res.nombre_calle,
          tipo: TIPOS_OBJETO.CALLE,
          partido: res.nombre_partido,
          descripcion: `${res.nombre_localidad}, ${res.nombre_partido}`,
          alturas: [],
        };
      } else {
        sug = DireccionClass.fromObj(res);
      }

      newResults.push(sug);
    }

    return newResults;
  }
}

export default NormalizadorAMBA.getInstance();
