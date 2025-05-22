// Exportar tipos
export type {
  DireccionType,
  DireccionCalleAltura,
  DireccionCalleYCalle,
  DireccionInput,
  Calle,
  Coordenadas,
  TipoDireccion,
} from './types';

export type {
  NormalizerOptions,
  NormalizerResult,
  NormalizerInstance,
  StringDireccionParsed,
} from './types/normalizer';

// Exportar constantes
export { TIPOS_DIRECCION, TIPOS_OBJETO } from './constants';

// Exportar clases y utilidades
export { default as Direccion } from './Direction';
export { default as StringDireccion } from './stringDirection';
export { default as NormalizadorAMBA } from './normalizerAMBA';
export * as Normalizador from './normalizerDirections';
export { TextUtils } from './utils/textUtils';
export { RegexPatterns } from './utils/regexPatterns';

// Exportar excepciones
export * as exceptions from './Exceptions';
