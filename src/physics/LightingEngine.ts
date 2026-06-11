import { Decimal } from 'decimal.js';
import { CalculationInput, CalculationOutput, Arrangement } from '../types';

/**
 * Logika proračuna unutarnje rasvjete (Fizika i matematika).
 * Aritmetička preciznost osigurana upotrebom Decimal.js knjižnice za izbjegavanje IEEE 754 grešaka.
 */
export class LightingEngine {
  
  /**
   * Glavna metoda za proračun osvjetljenja.
   * Defenzivno programiranje: Baca iznimke za fizički nerealne parametre.
   * @param input Ulazni parametri prostorije i rasvjetnog tijela
   * @returns CalculationOutput
   */
  public static obradiProracun(input: CalculationInput): CalculationOutput {
    this.validirajUlaznePodatke(input);

    return this.izvrsiProracunFizike(input);
  }

  public static izracunajDinamickiUF(k: number, input: CalculationInput): number {
    const bazniUF = this.interpolirajFaktorIskoristivosti(k, input.luminaire.ufTable);
    return this.prilagodiUfRefleksijama(bazniUF, k, input.reflectances, input.luminaire.id);
  }

  private static prilagodiUfRefleksijama(bazniUF: number, k: number, ref: import('../types').Reflectances, luminaireId: string): number {
    const isIndirect = luminaireId.includes('sus-') || luminaireId === 'DIRECT_INDIRECT';
    
    // Referentne vrijednosti iz Standardne Tablice (70/50/20)
    const baseC = 0.7;
    const baseW = 0.5;
    const baseF = 0.2;
    
    const actC = ref.ceilingPercent / 100;
    const actW = ref.wallPercent / 100;
    const actF = ref.floorPercent / 100;

    // Aproksimacijski fizikalni model promjene UF ovisno o refleksijama
    // Strop ima velik utjecaj kod indirektne rasvjete, zidovi kod malog indeksa prostorije
    let cFactor = isIndirect ? 0.8 : 0.15; 
    let wFactor = isIndirect ? 0.3 : (0.4 / Math.sqrt(Math.max(k, 0.6))); 
    let fFactor = 0.1;

    const delta = (actC - baseC) * cFactor + (actW - baseW) * wFactor + (actF - baseF) * fFactor;
    
    let noviUF = bazniUF * (1 + delta);
    return Math.max(0.01, Math.min(noviUF, 1.2)); // Fizička ograničenja UF-a
  }

  private static validirajUlaznePodatke(input: CalculationInput): void {
    if (input.room.lengthMm <= 0) throw new Error("Duljina prostorije mora biti veća od nule.");
    if (input.room.widthMm <= 0) throw new Error("Širina prostorije mora biti veća od nule.");
    if (input.room.heightMm <= 0) throw new Error("Visina prostorije mora biti veća od nule.");
    if (input.room.workPlaneHeightMm < 0) throw new Error("Visina radne plohe ne može biti negativna.");
    if (input.room.workPlaneHeightMm >= input.room.heightMm) throw new Error("Visina radne plohe mora biti manja od visine prostorije.");
    
    if (input.targetIlluminanceLx <= 0) throw new Error("Ciljana rasvijetljenost mora biti pozitivna.");
    if (input.maintenanceFactor <= 0 || input.maintenanceFactor > 1) throw new Error("Faktor održavanja mora biti > 0 i <= 1.");
    if (input.luminaire.luminousFluxLm <= 0) throw new Error("Svjetlosni tok svjetiljke mora biti pozitivan.");
  }

  /**
   * Znanstvena formula proračuna:
   * 1. Indeks prostorije (Room Index): K = (L * W) / (Hu * (L + W))
   * 2. Faktor iskoristivosti (UF): Linearna interpolacija iz tablice svjetiljke.
   * 3. Ukupni tok (Phi): Phi_tot = (E * A) / (UF * MF)
   * 4. Broj svjetiljki (N): N = Phi_tot / Phi_svjetiljke
   */
  private static izvrsiProracunFizike(input: CalculationInput): CalculationOutput {
    const l_m = new Decimal(input.room.lengthMm).dividedBy(1000);
    const w_m = new Decimal(input.room.widthMm).dividedBy(1000);
    const h_m = new Decimal(input.room.heightMm).dividedBy(1000);
    const hw_m = new Decimal(input.room.workPlaneHeightMm).dividedBy(1000);

    const Povrsina = l_m.times(w_m);
    const KorisnaVisina = h_m.minus(hw_m);

    // K = (L * W) / (Hu * (L + W))
    const roomIndex = Povrsina.dividedBy(KorisnaVisina.times(l_m.plus(w_m)));
    
    const k_val = roomIndex.toNumber();
    const uf_val = this.izracunajDinamickiUF(k_val, input);
    const uf_dec = new Decimal(uf_val);
    const mf_dec = new Decimal(input.maintenanceFactor);
    const targetEList = new Decimal(input.targetIlluminanceLx);

    // Phi_tot = (E * A) / (UF * MF)
    const requiredTotalFlux = targetEList.times(Povrsina).dividedBy(uf_dec.times(mf_dec));
    const luminaireFlux = new Decimal(input.luminaire.luminousFluxLm);

    // N = Phi_tot / Phi_svjetiljke
    const requiredNumberOfLuminaires = requiredTotalFlux.dividedBy(luminaireFlux);
    
    const arrangement = this.izracunajRaspored(l_m, w_m, requiredNumberOfLuminaires);

    // Stvarna rasvijetljenost (E_actual = (N_total * Phi_svjetiljke * UF * MF) / A)
    const actualN = new Decimal(arrangement.totalLuminaires);
    const actualIlluminance = actualN.times(luminaireFlux).times(uf_dec).times(mf_dec).dividedBy(Povrsina);

    // Specifična snaga = (N * P_svjetiljke) / A
    const specificPower = actualN.times(input.luminaire.powerW).dividedBy(Povrsina);

    // SH Ratio: Maksimalni razmak podijeljen sa korisnom visinom
    const maxSpacing = Decimal.max(new Decimal(arrangement.spacingXMm).dividedBy(1000), new Decimal(arrangement.spacingYMm).dividedBy(1000));
    const spacingToHeightRatio = maxSpacing.dividedBy(KorisnaVisina);
    
    // Gruba procjena uniformnosti (Uo) bazirano na S/H omjeru prema CIBSE modelu:
    // Idealni The maximum spacing to height ratio generally lies between 1.0 and 1.5.
    let estimatedUo = new Decimal(0.70); // Idealni slučaj
    const sHr = spacingToHeightRatio.toNumber();
    if (sHr > 1.2) estimatedUo = estimatedUo.minus((sHr - 1.2) * 0.4);
    if (sHr < 0.6) estimatedUo = estimatedUo.minus((0.6 - sHr) * 0.2); // Preblizu može uzrokovati nejednolikost ali manje drastično
    
    const finalUo = Math.max(0.2, Math.min(estimatedUo.toNumber(), 0.95));

    // Energy Calculation (EN 15193 approach: Lighting Energy Numeric Indicator)
    const totalPowerW = actualN.times(input.luminaire.powerW);
    const yearlyConsumptionKwh = totalPowerW.times(input.energyParams.operatingHoursPerYear).dividedBy(1000);
    const yearlyCostEur = yearlyConsumptionKwh.times(input.energyParams.electricityPriceEur);
    const leniKwhPerM2 = yearlyConsumptionKwh.dividedBy(Povrsina);
    
    let energyClass = 'F';
    if (leniKwhPerM2.lessThan(10)) energyClass = 'A';
    else if (leniKwhPerM2.lessThan(15)) energyClass = 'B';
    else if (leniKwhPerM2.lessThan(20)) energyClass = 'C';
    else if (leniKwhPerM2.lessThan(25)) energyClass = 'D';
    else if (leniKwhPerM2.lessThan(30)) energyClass = 'E';

    // Approximated Heatmap calculation (Point-by-point)
    const resolutionMm = 250; // 0.25m resolution for better visuals
    const hmCols = Math.max(2, Math.ceil(input.room.lengthMm / resolutionMm));
    const hmRows = Math.max(2, Math.ceil(input.room.widthMm / resolutionMm));
    
    // Luminaires positions
    const lumPositions: {x: number, y: number}[] = [];
    for (let r = 0; r < arrangement.rows; r++) {
       for (let c = 0; c < arrangement.columns; c++) {
           const x = (c + 0.5) * arrangement.spacingXMm;
           const y = (r + 0.5) * arrangement.spacingYMm;
           lumPositions.push({x, y});
       }
    }

    const hRaw = KorisnaVisina.toNumber() * 1000;
    const fluxPerLum = (input.luminaire.luminousFluxLm * uf_val * input.maintenanceFactor);
    const I0 = fluxPerLum / Math.PI;

    let minLx = Infinity;
    let maxLx = 0;
    let sumLx = 0;
    const grid: number[][] = [];

    for (let yGrid = 0; yGrid < hmRows; yGrid++) {
       const rowArr: number[] = [];
       const py = (yGrid + 0.5) * resolutionMm;
       for (let xGrid = 0; xGrid < hmCols; xGrid++) {
          const px = (xGrid + 0.5) * resolutionMm;
          let luxAtPoint = 0;
          for (const lum of lumPositions) {
             const dx = px - lum.x;
             const dy = py - lum.y;
             const d2 = dx*dx + dy*dy;
             const h2 = hRaw*hRaw;
             const E = (I0 * hRaw / Math.pow(d2 + h2, 1.5)) * 1000000;
             luxAtPoint += E;
          }
          rowArr.push(luxAtPoint);
       }
       grid.push(rowArr);
    }

    // Normalize grid to match calculated actualIlluminance
    let gridSum = 0;
    for (let r = 0; r < hmRows; r++) {
      for (let c = 0; c < hmCols; c++) {
         gridSum += grid[r][c];
      }
    }
    const gridAvg = gridSum / (hmRows * hmCols);
    const scalingFactor = gridAvg > 0 ? actualIlluminance.toNumber() / gridAvg : 1;

    let finalMinLx = Infinity;
    let finalMaxLx = 0;

    for (let r = 0; r < hmRows; r++) {
      for (let c = 0; c < hmCols; c++) {
         grid[r][c] *= scalingFactor;
         finalMinLx = Math.min(finalMinLx, grid[r][c]);
         finalMaxLx = Math.max(finalMaxLx, grid[r][c]);
      }
    }
    
    // Exact Uniformity check (Emin / Eavg)
    const exactUo = actualIlluminance.toNumber() > 0 ? (finalMinLx / actualIlluminance.toNumber()) : 0;

    return {
      roomIndex: roomIndex.toDecimalPlaces(2).toNumber(),
      utilizationFactor: uf_dec.toDecimalPlaces(3).toNumber(),
      totalRequiredFluxLm: requiredTotalFlux.toDecimalPlaces(0).toNumber(),
      requiredLuminaires: requiredNumberOfLuminaires.toDecimalPlaces(2).toNumber(),
      arrangement,
      actualIlluminanceLx: actualIlluminance.toDecimalPlaces(1).toNumber(),
      specificPowerWPerM2: specificPower.toDecimalPlaces(2).toNumber(),
      estimatedUo: Number(exactUo.toFixed(2)),
      spacingToHeightRatio: spacingToHeightRatio.toDecimalPlaces(2).toNumber(),
      energy: {
        yearlyConsumptionKwh: yearlyConsumptionKwh.toDecimalPlaces(1).toNumber(),
        yearlyCostEur: yearlyCostEur.toDecimalPlaces(2).toNumber(),
        leniKwhPerM2: leniKwhPerM2.toDecimalPlaces(1).toNumber(),
        energyClass
      },
      heatmap: {
        grid,
        minLx: finalMinLx,
        maxLx: finalMaxLx,
        avgLx: actualIlluminance.toNumber(),
        resolutionMm
      }
    };
  }

  private static izracunajRaspored(length_m: Decimal, width_m: Decimal, requiredN: Decimal): Arrangement {
    const ratio = length_m.dividedBy(width_m);
    
    // N_cols = sqrt(N * ratio)
    const nColsRaw = requiredN.times(ratio).sqrt();
    // N_rows = sqrt(N / ratio)
    const nRowsRaw = requiredN.dividedBy(ratio).sqrt();

    // Zaokružujemo na najbliži cijeli broj, preferirajući više kako bismo ostvarili minimalni E.
    let cols = nColsRaw.round();
    let rows = nRowsRaw.round();

    if (cols.equals(0)) cols = new Decimal(1);
    if (rows.equals(0)) rows = new Decimal(1);

    const actualTotal = cols.times(rows);

    let finalCols = cols.toNumber();
    let finalRows = rows.toNumber();

    // Pokušaj finog ugađanja ako zaokruživanje padne ispod potrebnog (N < requiredN)
    if (actualTotal.lessThan(requiredN)) {
      if (ratio.greaterThan(1)) {
        finalCols += 1;
      } else {
        finalRows += 1;
      }
    }

    const totalLuminaires = finalCols * finalRows;
    const total_m_FinalC = new Decimal(finalCols);
    const total_m_FinalR = new Decimal(finalRows);

    const spacingX = length_m.dividedBy(total_m_FinalC);
    const spacingY = width_m.dividedBy(total_m_FinalR);

    return {
      columns: finalCols,
      rows: finalRows,
      totalLuminaires: totalLuminaires,
      spacingXMm: spacingX.times(1000).toNumber(),
      spacingYMm: spacingY.times(1000).toNumber()
    };
  }

  public static interpolirajFaktorIskoristivosti(k: number, table: Record<string, number>): number {
    const keysStr = Object.keys(table);
    keysStr.sort((a, b) => Number(a) - Number(b));
    
    const minK = Number(keysStr[0]);
    const maxK = Number(keysStr[keysStr.length - 1]);

    if (k <= minK) return table[keysStr[0]];
    if (k >= maxK) return table[keysStr[keysStr.length - 1]];

    for (let i = 0; i < keysStr.length - 1; i++) {
      const k1 = Number(keysStr[i]);
      const k2 = Number(keysStr[i+1]);
      if (k >= k1 && k <= k2) {
        const dK = k2 - k1;
        const v1 = table[keysStr[i]];
        const v2 = table[keysStr[i+1]];
        const factor = (k - k1) / dK;
        return v1 + (v2 - v1) * factor;
      }
    }
    return 0; // Fallback, theoretically unreachable
  }
}
