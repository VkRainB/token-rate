export type Currency = 'CNY' | 'USD';

export type PriceKey = 'pIn' | 'pOut' | 'pCR' | 'pCC';
export type GroupKey = 'grIn' | 'grOut' | 'grCR' | 'grCC';
export type TokenKey = 'tokIn' | 'tokOut' | 'tokCR' | 'tokCC';

export interface Category {
  id: string;
  short: string;
  priceLabel: string;
  groupLabel: string;
  tokenLabel: string;
  displayLabel: string;
  bgClass: string;
  borderClass: string;
  priceKey: PriceKey;
  groupKey: GroupKey;
  tokenKey: TokenKey;
}

export interface CalculatorForm {
  pIn: number;
  pOut: number;
  pCR: number;
  pCC: number;
  exRate: number;
  groupRate: number;
  grIn: number;
  grOut: number;
  grCR: number;
  grCC: number;
  rechargeAmount: number;
  rechargePoints: number;
  tokIn: number;
  tokOut: number;
  tokCR: number;
  tokCC: number;
}

export interface RechargeStats {
  pointsPerUsd: number;
  unit: Currency;
  perPointText: string;
  perCnyText: string;
  perUsdText: string;
}

export interface RateCard extends Category {
  usdText: string;
  cnyText: string;
  pointsText: string;
  multiplierText: string;
}

export interface CostRow extends Category {
  usdCost: number;
  usdText: string;
  cnyText: string;
  pointsText: string;
}

export interface Totals {
  usd: number;
  usdText: string;
  cnyText: string;
  pointsText: string;
}

export interface Savings {
  percentText: string;
  note: string;
}
