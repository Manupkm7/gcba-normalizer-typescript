export const TIPOS_DIRECCION = {
  CALLE_ALTURA: 'DIRECCION_CALLE_ALTURA',
  CALLE_Y_CALLE: 'DIRECCION_CALLE_Y_CALLE',
  INVALIDO: 'INVALIDO',
} as const;

export const TIPOS_OBJETO = {
  CALLE: 'CALLE',
  DIRECCION: 'DIRECCION',
} as const;

export const TIPOS_EXCEPCION = {
  CALLE_INVALIDA: 'EXCEPCION_CALLE_INVALIDA',
  CARGA_CALLEJERO: 'EXCEPCION_CARGA_CALLEJERO',
  ALTURA_INVALIDA: 'EXCEPCION_ALTURA_INVALIDA',
  CALLE_SIN_ALTURAS: 'EXCEPCION_CALLE_SIN_ALTURAS',
  CRUCE_INEXISTENTE: 'EXCEPCION_CRUCE_INEXISTENTE',
} as const;

export const MENSAJES_ERROR = {
  CALLE_INEXISTENTE:
    'No pudo hallarse ninguna calle existente que coincidiera con su búsqueda. Por favor, revise el nombre ingresado y vuelva a intentarlo.',
  CALLES_SIN_CARGAR:
    'El callejero no se encuentra cargado aún o se produjo un error al intentar cargarlo',
  ALTURA_INVALIDA: 'La altura indicada no es válida para la calle ingresada.',
  CALLE_SIN_ALTURAS:
    'La calle {calle} no posee alturas oficiales. Utilice intersecciones para hallar direcciones válidas sobre esta calle o escriba S/N en lugar de la altura.',
  CRUCE_INEXISTENTE: 'El cruce de calles indicado no existe',
} as const;

export const REGEX_PUNTO_WKT = /^POINT *\((-?[0-9]+\.[0-9]+) (-?[0-9]+\.[0-9]+)\)$/;
