export class TextUtils {
  public static sinAcentos(str: string): string {
    const acentos: Record<string, string> = {
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U',
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u'
    };

    return str.replace(/[ÁÉÍÓÚÜáéíóúü]/g, letra => acentos[letra] || letra);
  }

  public static esPermutacion(str1: string, str2: string): boolean {
    const prepararStr = (str: string): string[] => {
      return TextUtils.sinAcentos(str)
        .replace(/"/g, '')
        .toUpperCase()
        .trim()
        .split(' ');
    };

    const palabras1 = prepararStr(str1);
    const palabras2 = prepararStr(str2);

    if (palabras1.length !== palabras2.length) {
      return false;
    }

    const intersect = palabras1.filter(palabra => palabras2.includes(palabra));
    return palabras1.length === intersect.length;
  }

  public static verificarBusquedaDireccion(posibleDireccion: string, matcheo: string): boolean {
    const pMatcheo = TextUtils.sinAcentos(matcheo.toUpperCase()).split(' ');
    const pCalle = TextUtils.sinAcentos(posibleDireccion.toUpperCase())
      .replace(/[,.]/g, '')
      .split(' ');

    for (let i = 0; i < pMatcheo.length - 1; i++) {
      for (let j = 0; j < pCalle.length - 1; j++) {
        if (pMatcheo[i] === pCalle[j] && pMatcheo[i].length > 3) {
          return true;
        }
      }
    }
    return false;
  }
} 