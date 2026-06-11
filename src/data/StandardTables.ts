import { LuminaireData } from '../types';

/**
 * Standard data tables according to EN 12464-1
 */
export class StandardTables {
  public static readonly NormativeRequirements: Record<string, { Em: number, UGRL: number, Uo: number, Ra: number }> = {
    'Ured - pisanje, tipkanje, čitanje (EN 12464-1)': { Em: 500, UGRL: 19, Uo: 0.60, Ra: 80 },
    'Ured - tehničko crtanje': { Em: 750, UGRL: 16, Uo: 0.70, Ra: 80 },
    'Hodnici i komunikacije': { Em: 100, UGRL: 28, Uo: 0.40, Ra: 40 },
    'Skladišta': { Em: 150, UGRL: 22, Uo: 0.40, Ra: 60 },
    'Industrija - fina montaža': { Em: 750, UGRL: 19, Uo: 0.70, Ra: 80 },
    'Industrija - gruba montaža': { Em: 300, UGRL: 25, Uo: 0.40, Ra: 80 },
    'Učionice': { Em: 300, UGRL: 19, Uo: 0.60, Ra: 80 },
  };

  // Zadržavamo zbog kompatibilnosti
  public static readonly CommonIlluminanceTargetsLx: Record<string, number> = {
    'Ured - pisanje, tipkanje, čitanje (EN 12464-1)': 500,
    'Ured - tehničko crtanje': 750,
    'Hodnici i komunikacije': 100,
    'Skladišta': 150,
    'Industrija - fina montaža': 750,
    'Industrija - gruba montaža': 300,
    'Učionice': 300,
  };

  public static readonly MaintenanceFactors: Record<string, number> = {
    'Vrlo čisto (0.80)': 0.80,
    'Čisto (0.70)': 0.70,
    'Umjereno prljavo (0.60)': 0.60,
    'Prljavo (0.50)': 0.50,
  };

  public static readonly TypicalReflectances = {
    Ceiling: [70, 50, 30],
    Wall: [50, 30, 10],
    Floor: [20, 10],
  };

  // Osnovne tablice faktora iskoristivosti (UF) za tipične raspodjele svjetla (Za ρc=70%, ρw=50%, ρf=20%)
  public static readonly UF_DIRECT_WIDE = {
    '0.60': 0.45, '0.80': 0.54, '1.00': 0.61, '1.25': 0.68, '1.50': 0.73,
    '2.00': 0.80, '2.50': 0.84, '3.00': 0.88, '4.00': 0.92, '5.00': 0.95
  };

  public static readonly UF_DIRECT_NARROW = {
    '0.60': 0.68, '0.80': 0.77, '1.00': 0.84, '1.25': 0.89, '1.50': 0.92,
    '2.00': 0.96, '2.50': 0.98, '3.00': 1.00, '4.00': 1.02, '5.00': 1.03
  };

  public static readonly UF_DOWNLIGHT = {
    '0.60': 0.52, '0.80': 0.61, '1.00': 0.68, '1.25': 0.74, '1.50': 0.78,
    '2.00': 0.85, '2.50': 0.89, '3.00': 0.92, '4.00': 0.95, '5.00': 0.97
  };

  public static readonly UF_WATERPROOF = {
    '0.60': 0.39, '0.80': 0.48, '1.00': 0.55, '1.25': 0.62, '1.50': 0.67,
    '2.00': 0.75, '2.50': 0.80, '3.00': 0.84, '4.00': 0.89, '5.00': 0.91
  };

  public static readonly UF_DIRECT_INDIRECT = {
    '0.60': 0.35, '0.80': 0.45, '1.00': 0.53, '1.25': 0.60, '1.50': 0.65,
    '2.00': 0.72, '2.50': 0.77, '3.00': 0.81, '4.00': 0.86, '5.00': 0.89
  };

  public static readonly ReferenceLuminaires: LuminaireData[] = [
    // --- LED PANELI (Uredi, škole, hodnici) ---
    { id: 'panel-rc132v-36s', name: 'Philips CoreLine Panel RC132V 3600lm (600x600)', luminousFluxLm: 3600, powerW: 29.0, ufTable: this.UF_DIRECT_WIDE, ugr: 19, ra: 80 },
    { id: 'panel-rc132v-43s', name: 'Philips CoreLine Panel RC132V 4300lm (600x600)', luminousFluxLm: 4300, powerW: 34.5, ufTable: this.UF_DIRECT_WIDE, ugr: 19, ra: 80 },
    { id: 'panel-rc133v-36s', name: 'Philips CoreLine Panel RC133V 3600lm (300x1200)', luminousFluxLm: 3600, powerW: 29.0, ufTable: this.UF_DIRECT_WIDE, ugr: 19, ra: 80 },
    { id: 'surface-sm136v-36s', name: 'Philips CoreLine Surface SM136V 3600lm (Nadgradni)', luminousFluxLm: 3600, powerW: 28.0, ufTable: this.UF_DIRECT_WIDE, ugr: 19, ra: 80 },

    // --- DOWNLIGHTI (Hodnici, recepcije, sanitarije) ---
    { id: 'dl-dn140b-10s', name: 'Philips CoreLine Downlight DN140B 1100lm', luminousFluxLm: 1100, powerW: 9.5, ufTable: this.UF_DOWNLIGHT, ugr: 22, ra: 80 },
    { id: 'dl-dn140b-20s', name: 'Philips CoreLine Downlight DN140B 2200lm', luminousFluxLm: 2200, powerW: 19.0, ufTable: this.UF_DOWNLIGHT, ugr: 22, ra: 80 },
    { id: 'dl-rs140b-m20', name: 'Philips CoreLine Recessed Spot RS140B 1200lm', luminousFluxLm: 1200, powerW: 15.0, ufTable: this.UF_DOWNLIGHT, ugr: 19, ra: 80 },

    // --- INDUSTRIJA / VODOTIJESNE (Garaže, skladišta, pogoni) ---
    { id: 'wp-wt120c-22s', name: 'Philips CoreLine Waterproof WT120C 2200lm (1200mm)', luminousFluxLm: 2200, powerW: 15.3, ufTable: this.UF_WATERPROOF, ugr: 25, ra: 80 },
    { id: 'wp-wt120c-40s', name: 'Philips CoreLine Waterproof WT120C 4000lm (1200mm)', luminousFluxLm: 4000, powerW: 28.0, ufTable: this.UF_WATERPROOF, ugr: 25, ra: 80 },
    { id: 'wp-wt120c-80s', name: 'Philips CoreLine Waterproof WT120C 8000lm (1500mm)', luminousFluxLm: 8000, powerW: 55.0, ufTable: this.UF_WATERPROOF, ugr: 25, ra: 80 },

    // --- BATTEN SVJETILJKE (Komore, hodnici pogona) ---
    { id: 'bat-bn126c-41s', name: 'Philips CoreLine Batten BN126C 4100lm', luminousFluxLm: 4100, powerW: 31.0, ufTable: this.UF_WATERPROOF, ugr: 25, ra: 80 },
    { id: 'bat-bn126c-64s', name: 'Philips CoreLine Batten BN126C 6400lm', luminousFluxLm: 6400, powerW: 48.0, ufTable: this.UF_WATERPROOF, ugr: 25, ra: 80 },

    // --- HIGHBAY (Visoka skladišta, hale) ---
    { id: 'hb-by121p-100s', name: 'Philips CoreLine Highbay BY121P 10000lm', luminousFluxLm: 10000, powerW: 70.0, ufTable: this.UF_DIRECT_NARROW, ugr: 22, ra: 80 },
    { id: 'hb-by121p-200s', name: 'Philips CoreLine Highbay BY121P 20000lm', luminousFluxLm: 20000, powerW: 140.0, ufTable: this.UF_DIRECT_NARROW, ugr: 22, ra: 80 },
    { id: 'hb-by470p-130s', name: 'Philips GentleSpace Gen3 13000lm', luminousFluxLm: 13000, powerW: 84.0, ufTable: this.UF_DIRECT_NARROW, ugr: 19, ra: 80 },
    { id: 'hb-by471p-250s', name: 'Philips GentleSpace Gen3 25000lm', luminousFluxLm: 25000, powerW: 160.0, ufTable: this.UF_DIRECT_NARROW, ugr: 19, ra: 80 },

    // --- TRUNKING SUSPENDED (Linijska rasvjeta u trgovinama/industriji) ---
    { id: 'trk-ll212x-50s', name: 'Philips CoreLine Trunking LL212X 5000lm', luminousFluxLm: 5000, powerW: 32.0, ufTable: this.UF_DIRECT_WIDE, ugr: 22, ra: 80 },
    { id: 'trk-ll212x-80s', name: 'Philips CoreLine Trunking LL212X 8000lm', luminousFluxLm: 8000, powerW: 51.0, ufTable: this.UF_DIRECT_WIDE, ugr: 22, ra: 80 },

    // --- SUSPENDED ARHITEKTONSKE (Direkt/Indirekt za moderne urede) ---
    { id: 'sus-sp530p-50s', name: 'Philips TrueLine Suspended SP530P 5000lm', luminousFluxLm: 5000, powerW: 36.0, ufTable: this.UF_DIRECT_INDIRECT, ugr: 16, ra: 80 },
    { id: 'sus-sp530p-66s', name: 'Philips TrueLine Suspended SP530P 6600lm', luminousFluxLm: 6600, powerW: 48.0, ufTable: this.UF_DIRECT_INDIRECT, ugr: 16, ra: 80 },
  ];
}
