export class RegexPatterns {
  private static instance: RegexPatterns;
  private patterns: {
    cruceCalles: RegExp;
    calleAltura: Record<number, RegExp>;
    calle: Record<number, RegExp>;
  };

  private constructor(maxPalabras: number) {
    this.patterns = {
      cruceCalles: /\s+y\s+/gi,
      calleAltura: {},
      calle: {}
    };

    for (let i = 1; i <= maxPalabras; i++) {
      this.patterns.calleAltura[i] = new RegExp(
        `(\\d+(\\s+(\\w|\\d|á|é|í|ó|ú|ü|ñ|'|\`|,|\\.)+){${i}})`,
        'gi'
      );

      this.patterns.calle[i] = new RegExp(
        `(\\w|\\d|á|é|í|ó|ú|ü|ñ|'|\`|,|\\.)+(\\s+(\\w|\\d|á|é|í|ó|ú|ü|ñ|'|\`|,|\\.)+){${i - 1}}`,
        'gi'
      );
    }
  }

  public static getInstance(maxPalabras: number): RegexPatterns {
    if (!RegexPatterns.instance) {
      RegexPatterns.instance = new RegexPatterns(maxPalabras);
    }
    return RegexPatterns.instance;
  }

  public get cruceCalles(): RegExp {
    return this.patterns.cruceCalles;
  }

  public getCalleAlturaPattern(i: number): RegExp {
    return this.patterns.calleAltura[i];
  }

  public getCallePattern(i: number): RegExp {
    return this.patterns.calle[i];
  }
} 