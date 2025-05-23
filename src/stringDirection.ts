import { CALLE, CALLE_ALTURA, CALLE_Y_CALLE, INVALIDO } from './constant';
import core from '@usig-gcba/usig-core';

/**
 * @class StringDireccion
 * Parsea un string que presuntamente representa una direccion; lo tipifica y lo separa en tokens.
 * Luego de instanciada la propiedad publica "tipo" puede asumir los siguientes valores:
 * <pre><code>
 * usig.StringDireccion.CALLE
 * usig.StringDireccion.CALLE_ALTURA
 * usig.StringDireccion.CALLE_Y_CALLE
 * usig.StringDireccion.INVALIDO
 * </code></pre>
 * @namespace usig
 * @constructor
 * @param {String} strInput String a parsear
 */

export default class StringDireccion {
  tipo: number;
  strCalles: string[];
  strAltura: string;
  strInput: string;
  aceptarCallesSinAlturas: boolean;
  maxWordLen: any;
  constructor(strInput: string, aceptarCallesSinAlturas: boolean) {
    /**
     * @property
     * @type Integer Constante que indica la tipificacion asignada al string de entrada
     */
    this.tipo = INVALIDO;
    /**
     * @property
     * @type String [Array] String que representa el presunto nombre de la calle o array de strings que representan las
     * presuntas calles que se intersectan
     */
    this.strCalles = [];
    /**
     * @property
     * @type Integer Presunta altura de la calle
     */
    this.strAltura = '';
    //	this.strInput = strInput.replace(/"/g, "").replace(/\./g, " ").replace(/,/g, " ").replace(/\)/g, " ").replace(/\(/g, " ").toUpperCase().trim();
    this.strInput = strInput
      .replace(/"/g, '')
      .replace(/[\.,\(\)']/g, ' ')
      .toUpperCase()
      .trim();
    this.esAlturaSN = (alt: any) => /[sS][/\\][nN]/.test(alt);
    this.aceptarCallesSinAlturas = aceptarCallesSinAlturas;

    if (this.strInput.length > 0) {
      let palabras = this.strInput.split(' Y ');
      if (palabras.length >= 2) {
        let str = this.fixCallesConY(this.strInput);
        palabras = str.split(' Y ');
        if (palabras.length >= 2) {
          this.tipo = CALLE_Y_CALLE;
          this.strCalles = [palabras[0].replace(' & ', ' Y '), palabras[1].replace(' & ', ' Y ')];
        }
      }
      palabras = this.strInput.split(' E ');
      if (palabras.length >= 2) {
        // Si la ultima palabra no es un entero...
        if (
          isNaN(parseInt(palabras[palabras.length - 1])) ||
          parseInt(palabras[palabras.length - 1]).toString() !== palabras[palabras.length - 1]
        ) {
          this.tipo = CALLE_Y_CALLE;
          this.strCalles = palabras;
        }
      }
      if (this.tipo === INVALIDO) {
        this.setearCalleAltura();
      }
    } else {
      this.tipo = INVALIDO;
    }
  }

  esTipoAltura(str: string, aceptarCallesSinAlturas: boolean) {
    return core.isDigit(str) || (aceptarCallesSinAlturas && this.esAlturaSN(str));
  }

  setearCalleAltura() {
    function inject(
      array: string[],
      acc: number,
      it: (acc: number, w: string, i: number) => number
    ) {
      for (let i = 0; i < array.length; i++) acc = it(acc, array[i], i);
      return acc;
    }
    let palabras = this.strInput.split(' ');
    this.maxWordLen = inject(palabras, 0, function (acc, w) {
      return Math.max(w.trim().length, acc);
    });
    let cantPalabras = palabras.length;
    if (
      cantPalabras > 1 &&
      this.esTipoAltura(palabras[cantPalabras - 1], this.aceptarCallesSinAlturas)
    ) {
      this.tipo = CALLE_ALTURA;
      this.strCalles = [palabras.slice(0, -1).join(' ')];
      this.strAltura = palabras[cantPalabras - 1];
    } else {
      this.tipo = CALLE;
      this.strCalles = [this.strInput];
    }
  }

  fixCallesConY(str: string) {
    return core.translate(
      str,
      [
        'GELLY Y OBES',
        'MENENDEZ Y PELAYO',
        'OLAGUER Y FELIU',
        'ORTEGA Y GASSET',
        'PAULA Y RODRIGUEZ',
        'PAZ Y FIGUEROA',
        'PI Y MARGALL',
        'RAMON Y CAJAL',
        'TORRES Y TENORIO',
        'TREINTA Y TRES',
      ],
      [
        'GELLY & OBES',
        'MENENDEZ & PELAYO',
        'OLAGUER & FELIU',
        'ORTEGA & GASSET',
        'PAULA & RODRIGUEZ',
        'PAZ & FIGUEROA',
        'PI & MARGALL',
        'RAMON & CAJAL',
        'TORRES & TENORIO',
        'TREINTA & TRES',
      ]
    );
  }

  quitarAvsCalle() {
    let avs = ['AV', 'AVDA', 'AVENIDA'];
    if (this.tipo === CALLE_ALTURA) {
      this.strCalles = core.removeWords(this.strCalles, avs);
    } else if (this.tipo === CALLE_Y_CALLE) {
      this.strCalles[0] = core.removeWords(this.strCalles[0], avs);
    }
  }

  quitarAvsCalleCruce() {
    let avs = ['AV', 'AVDA', 'AVENIDA'];
    if (this.tipo === CALLE_Y_CALLE) {
      this.strCalles[1] = core.removeWords(this.strCalles[1], avs);
    }
  }

  quitarPasajes() {
    let avs = ['PJE', 'PSJE', 'PASAJE'];
    if (this.tipo === CALLE_ALTURA) {
      this.strCalles = core.removeWords(this.strCalles, avs);
    } else if (this.tipo === CALLE_Y_CALLE) {
      this.strCalles[0] = core.removeWords(this.strCalles[0], avs);
      this.strCalles[1] = core.removeWords(this.strCalles[1], avs);
    }
  }
  esAlturaSN(alt: string) {
    const regexSN = /^s\/n$|^sn$/i;
    return regexSN.test(alt);
  }
}
