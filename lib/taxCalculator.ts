export interface UserInput {
  monthlyIncome: number;
  age: number;
  dependents: number;
  hasSpouse: boolean;
  monthlyExpenses: number;
  monthlySavings: number;
  existingPension: number;
  employmentType: 'employee' | 'self-employed';
}

export interface TaxResult {
  annualIncome: number;
  incomeDeduction: number;
  basicDeduction: number;
  spouseDeduction: number;
  dependentDeduction: number;
  taxableIncome: number;
  incomeTax: number;
  localTax: number;
  totalTax: number;
  effectiveTaxRate: number;
  nationalPension: number;
  healthInsurance: number;
  employmentInsurance: number;
  totalDeductions: number;
  netMonthlyIncome: number;
}

export interface PensionStrategy {
  irpContribution: number;
  pensionSavingsContribution: number;
  nationalPensionVoluntary: number;
  totalPensionContribution: number;
  taxSaving: number;
  expectedMonthlyPension: number;
}

export interface TaxSavingStrategy {
  name: string;
  description: string;
  maxAmount: number;
  recommendedAmount: number;
  taxSaving: number;
  category: 'pension' | 'deduction' | 'credit';
  priority: number;
}

const INCOME_TAX_BRACKETS = [
  { min: 0, max: 14000000, rate: 0.06, deduction: 0 },
  { min: 14000000, max: 50000000, rate: 0.15, deduction: 1260000 },
  { min: 50000000, max: 88000000, rate: 0.24, deduction: 5760000 },
  { min: 88000000, max: 150000000, rate: 0.35, deduction: 15440000 },
  { min: 150000000, max: 300000000, rate: 0.38, deduction: 19940000 },
  { min: 300000000, max: 500000000, rate: 0.40, deduction: 25940000 },
  { min: 500000000, max: 1000000000, rate: 0.42, deduction: 35940000 },
  { min: 1000000000, max: Infinity, rate: 0.45, deduction: 65940000 },
];

export function calculateIncomeDeduction(annualIncome: number): number {
  if (annualIncome <= 5000000) return annualIncome;
  if (annualIncome <= 15000000) return 5000000 + (annualIncome - 5000000) * 0.4;
  if (annualIncome <= 45000000) return 9000000 + (annualIncome - 15000000) * 0.15;
  if (annualIncome <= 100000000) return 13500000 + (annualIncome - 45000000) * 0.05;
  return 16250000 + (annualIncome - 100000000) * 0.02;
}

export function calculateIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  const bracket = INCOME_TAX_BRACKETS.find(
    b => taxableIncome > b.min && taxableIncome <= b.max
  ) || INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.length - 1];
  return taxableIncome * bracket.rate - bracket.deduction;
}

export function calculateTax(input: UserInput): TaxResult {
  const annualIncome = input.monthlyIncome * 12;

  const incomeDeduction = calculateIncomeDeduction(annualIncome);
  const basicDeduction = 1500000;
  const spouseDeduction = input.hasSpouse ? 1500000 : 0;
  const dependentDeduction = input.dependents * 1500000;
  const nationalPensionDeduction = Math.min(annualIncome * 0.045, 2700000);

  const taxableIncome = Math.max(
    0,
    annualIncome - incomeDeduction - basicDeduction - spouseDeduction -
    dependentDeduction - nationalPensionDeduction
  );

  const incomeTax = calculateIncomeTax(taxableIncome);
  const localTax = incomeTax * 0.1;
  const totalTax = incomeTax + localTax;
  const effectiveTaxRate = annualIncome > 0 ? totalTax / annualIncome : 0;

  const nationalPension = Math.min(annualIncome * 0.045 / 12, 225000);
  const healthInsurance = Math.min(annualIncome * 0.03545 / 12, 3000000 / 12);
  const employmentInsurance = annualIncome * 0.009 / 12;
  const totalMonthlyDeductions = totalTax / 12 + nationalPension + healthInsurance + employmentInsurance;
  const netMonthlyIncome = input.monthlyIncome - totalMonthlyDeductions;

  return {
    annualIncome,
    incomeDeduction,
    basicDeduction,
    spouseDeduction,
    dependentDeduction,
    taxableIncome,
    incomeTax,
    localTax,
    totalTax,
    effectiveTaxRate,
    nationalPension,
    healthInsurance,
    employmentInsurance,
    totalDeductions: totalMonthlyDeductions,
    netMonthlyIncome,
  };
}

export function calculatePensionStrategy(input: UserInput, taxResult: TaxResult): PensionStrategy {
  const annualIncome = taxResult.annualIncome;
  const marginalRate = getMarginalTaxRate(taxResult.taxableIncome);

  const irpMax = 9000000;
  const pensionSavingsMax = 6000000;
  const availableSavings = input.monthlySavings * 12;

  const irpContribution = Math.min(irpMax, availableSavings * 0.4);
  const pensionSavingsContribution = Math.min(pensionSavingsMax, availableSavings * 0.3);

  const irpTaxSaving = irpContribution * marginalRate * 1.1;
  const pensionSavingsTaxSaving = pensionSavingsContribution * 0.165;

  const taxSaving = Math.min(irpTaxSaving + pensionSavingsTaxSaving, irpContribution * 0.165 + pensionSavingsContribution * 0.165);

  const totalContribution = irpContribution + pensionSavingsContribution + input.existingPension * 12;
  const yearsToRetirement = Math.max(0, 65 - input.age);
  const expectedMonthlyPension = (totalContribution * yearsToRetirement * 1.03) / (20 * 12);

  return {
    irpContribution,
    pensionSavingsContribution,
    nationalPensionVoluntary: 0,
    totalPensionContribution: irpContribution + pensionSavingsContribution,
    taxSaving,
    expectedMonthlyPension,
  };
}

function getMarginalTaxRate(taxableIncome: number): number {
  const bracket = INCOME_TAX_BRACKETS.find(
    b => taxableIncome > b.min && taxableIncome <= b.max
  );
  return bracket ? bracket.rate * 1.1 : 0.066;
}

export function generateTaxSavingStrategies(input: UserInput, taxResult: TaxResult): TaxSavingStrategy[] {
  const marginalRate = getMarginalTaxRate(taxResult.taxableIncome);
  const annualIncome = taxResult.annualIncome;
  const strategies: TaxSavingStrategy[] = [];

  const irpMax = 9000000;
  const irpRecommended = Math.min(irpMax, input.monthlySavings * 12 * 0.4);
  strategies.push({
    name: 'IRP(개인형 퇴직연금)',
    description: '연간 최대 900만원 납입 시 세액공제 혜택. 소득에 따라 13.2% 또는 16.5% 공제',
    maxAmount: irpMax,
    recommendedAmount: irpRecommended,
    taxSaving: irpRecommended * (annualIncome <= 55000000 ? 0.165 : 0.132),
    category: 'pension',
    priority: 1,
  });

  const pensionMax = 6000000;
  const pensionRecommended = Math.min(pensionMax, input.monthlySavings * 12 * 0.3);
  strategies.push({
    name: '연금저축',
    description: '연간 최대 600만원 납입 시 세액공제. IRP와 합산 900만원 한도',
    maxAmount: pensionMax,
    recommendedAmount: pensionRecommended,
    taxSaving: pensionRecommended * (annualIncome <= 55000000 ? 0.165 : 0.132),
    category: 'pension',
    priority: 2,
  });

  const isaMax = 20000000;
  const isaRecommended = Math.min(isaMax, input.monthlySavings * 12 * 0.5);
  strategies.push({
    name: 'ISA(개인종합자산관리계좌)',
    description: '비과세 한도 200만원(서민형 400만원), 초과분 9.9% 분리과세',
    maxAmount: isaMax,
    recommendedAmount: isaRecommended,
    taxSaving: Math.min(200000 * 0.154, isaRecommended * 0.01),
    category: 'deduction',
    priority: 3,
  });

  if (annualIncome <= 120000000) {
    strategies.push({
      name: '신용카드 소득공제',
      description: '총급여의 25% 초과 사용액의 15~80% 공제 (최대 300만원)',
      maxAmount: 3000000,
      recommendedAmount: Math.min(3000000, annualIncome * 0.03),
      taxSaving: Math.min(3000000, annualIncome * 0.03) * marginalRate,
      category: 'deduction',
      priority: 4,
    });
  }

  strategies.push({
    name: '의료비 세액공제',
    description: '총급여의 3% 초과 의료비의 15~20% 공제',
    maxAmount: 7000000,
    recommendedAmount: Math.max(0, annualIncome * 0.03 * 0.15),
    taxSaving: Math.max(0, annualIncome * 0.03 * 0.15),
    category: 'credit',
    priority: 5,
  });

  strategies.push({
    name: '교육비 세액공제',
    description: '본인 교육비 전액, 부양가족 교육비 15% 공제',
    maxAmount: 9000000,
    recommendedAmount: 0,
    taxSaving: 0,
    category: 'credit',
    priority: 6,
  });

  return strategies.sort((a, b) => a.priority - b.priority);
}
