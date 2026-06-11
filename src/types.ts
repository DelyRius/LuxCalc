export interface RoomDimensions {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  workPlaneHeightMm: number;
}

export interface Reflectances {
  ceilingPercent: number;
  wallPercent: number;
  floorPercent: number;
}

export interface LuminaireData {
  id: string;
  name: string;
  luminousFluxLm: number;
  powerW: number;
  ufTable: Record<string, number>; // Maps Room Index (K) to UF (Utilization Factor)
  ugr?: number; // Unified Glare Rating
  ra?: number; // Color Rendering Index
}

export interface CalculationInput {
  room: RoomDimensions;
  reflectances: Reflectances;
  luminaire: LuminaireData;
  targetIlluminanceLx: number;
  maintenanceFactor: number;
  energyParams: {
    operatingHoursPerYear: number;
    electricityPriceEur: number;
  };
}

export interface Arrangement {
  columns: number; // Nx
  rows: number; // Ny
  totalLuminaires: number;
  spacingXMm: number;
  spacingYMm: number;
}

export interface EnergyOutput {
  yearlyConsumptionKwh: number;
  yearlyCostEur: number;
  leniKwhPerM2: number; // Lighting Energy Numeric Indicator (EN 15193)
  energyClass: string;
}

export interface CalculationOutput {
  roomIndex: number;
  utilizationFactor: number;
  totalRequiredFluxLm: number;
  requiredLuminaires: number;
  arrangement: Arrangement;
  actualIlluminanceLx: number;
  specificPowerWPerM2: number;
  estimatedUo: number; // Uniformity (Emin / Em)
  spacingToHeightRatio: number; // S/H ratio
  energy: EnergyOutput;
  heatmap: {
    grid: number[][];
    minLx: number;
    maxLx: number;
    avgLx: number;
    resolutionMm: number;
  };
}
