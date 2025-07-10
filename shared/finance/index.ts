import Decimal from 'decimal.js-light';

/* ---------------------------------------------------------
   Shared finance / KPI helpers
   This file MUST stay dependency-free (Decimal only) so it
   can be imported by both Node (server) and React (client).
--------------------------------------------------------- */

export type MoneyInput = number | string | Decimal;

// Default modelling constants – override per call if you need.
export const DEFAULTS = {
  vacancyRate: new Decimal(0.05),
  badDebtRate: new Decimal(0.02),
  operatingReserveMonths: new Decimal(6),
};

/* --------- small helpers --------- */
const D = (v: MoneyInput) => new Decimal(v);

export interface IncomeStatement {
  // Income
  grossRentalIncome: MoneyInput;
  otherIncome?: MoneyInput;
  vacancyRate?: Decimal;   // 0–1
  badDebtRate?: Decimal;   // 0–1
  // Expenses
  operatingExpenses: MoneyInput;
  capexReservePerUnit?: MoneyInput; // optional, per-unit calc done upstream
  // Debt
  annualDebtService: MoneyInput; // P&I for the year
}

export interface KpiContext {
  purchasePrice: MoneyInput;
  arv: MoneyInput;               // after-repair value / current market value
  investedCapital: MoneyInput;   // equity actually in the deal
}

export interface Kpis {
  noi: Decimal;
  capRate: Decimal;
  cashOnCash: Decimal;
  dscr: Decimal;
}

export function calculateKpis(stmt: IncomeStatement, ctx: KpiContext): Kpis {
  const grossRent = D(stmt.grossRentalIncome);
  const other = D(stmt.otherIncome ?? 0);
  const vac = stmt.vacancyRate ?? DEFAULTS.vacancyRate;
  const bad = stmt.badDebtRate ?? DEFAULTS.badDebtRate;

  const effectiveIncome = grossRent
    .minus(grossRent.mul(vac))
    .minus(grossRent.mul(bad))
    .plus(other);

  const operatingExp = D(stmt.operatingExpenses);
  const noi = effectiveIncome.minus(operatingExp);

  const capRate = noi.div(D(ctx.arv));

  const beforeTaxCashFlow = noi.minus(D(stmt.annualDebtService));
  const cashOnCash = beforeTaxCashFlow.div(D(ctx.investedCapital));

  const dscr = noi.div(D(stmt.annualDebtService));

  return {
    noi,
    capRate,
    cashOnCash,
    dscr,
  };
}

/* --------- utility exporters so React can show nice strings --------- */
export function fmt(d: Decimal, decimals = 2): string {
  return d.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toString();
}

export function asPercent(d: Decimal, decimals = 2): string {
  return fmt(d.mul(100), decimals) + '%';
}

export function asCurrency(d: Decimal, currency = '$', decimals = 2): string {
  return currency + fmt(d, decimals);
}