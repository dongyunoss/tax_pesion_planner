export interface UserInput {
  monthlyIncome: number;
  age: number;
  dependents: number;
  hasSpouse: boolean;
  monthlyExpenses: number;
  monthlySavings: number;
  existingPension: number;
  employmentType: 'employee' | 'self-employed';
  // 금융소득
  annualInterestIncome: number;   // 이자소득 (연간)
  annualDividendIncome: number;   // 배당소득 (연간)
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
  // 금융소득 종합과세
  financialIncome: number;
  isFinancialIncomeSubjectToGlobal: boolean;
  financialIncomeTax: number;
  financialIncomeWithheld: number;
  financialIncomeSurcharge: number;
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

// 금융소득 분리과세 세율 (원천징수)
const FINANCIAL_WITHHOLDING_RATE = 0.154; // 14% + 지방세 1.4%

// 금융소득 종합과세 기준 (연 2,000만원 초과)
const FINANCIAL_GLOBAL_THRESHOLD = 20000000;

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
  const financialIncome = (input.annualInterestIncome || 0) + (input.annualDividendIncome || 0);
  const isFinancialIncomeSubjectToGlobal = financialIncome > FINANCIAL_GLOBAL_THRESHOLD;

  // 금융소득 원천징수세 (2,000만원 이하 분리과세분)
  const financialIncomeWithheld = isFinancialIncomeSubjectToGlobal
    ? FINANCIAL_GLOBAL_THRESHOLD * FINANCIAL_WITHHOLDING_RATE
    : financialIncome * FINANCIAL_WITHHOLDING_RATE;

  // 종합과세 대상 금융소득 (2,000만원 초과분)
  const financialIncomeForGlobal = isFinancialIncomeSubjectToGlobal
    ? financialIncome - FINANCIAL_GLOBAL_THRESHOLD
    : 0;

  const incomeDeduction = calculateIncomeDeduction(annualIncome);
  const basicDeduction = 1500000;
  const spouseDeduction = input.hasSpouse ? 1500000 : 0;
  const dependentDeduction = input.dependents * 1500000;
  const nationalPensionDeduction = Math.min(annualIncome * 0.045, 2700000);

  // 근로소득 과세표준
  const laborTaxableIncome = Math.max(
    0,
    annualIncome - incomeDeduction - basicDeduction - spouseDeduction -
    dependentDeduction - nationalPensionDeduction
  );

  // 종합과세 시: 근로소득 + 초과 금융소득 합산
  const totalTaxableIncome = laborTaxableIncome + financialIncomeForGlobal;

  const incomeTax = calculateIncomeTax(totalTaxableIncome);

  // 금융소득 종합과세 추가세 계산 (비교과세: 근로소득세 + 금융소득×14% vs 합산세율 중 큰 값)
  let financialIncomeSurcharge = 0;
  if (isFinancialIncomeSubjectToGlobal) {
    const taxWithGlobal = calculateIncomeTax(totalTaxableIncome);
    const taxWithoutGlobal = calculateIncomeTax(laborTaxableIncome);
    const globalExcess = financialIncomeForGlobal * 0.14;
    // 비교과세: 합산세액과 (근로세액 + 14%세액) 중 큰 값
    const comparisonTax = taxWithoutGlobal + globalExcess;
    financialIncomeSurcharge = Math.max(0, Math.max(taxWithGlobal, comparisonTax) - taxWithoutGlobal) * 1.1;
  }

  const financialIncomeTax = financialIncomeWithheld + financialIncomeSurcharge;

  const localTax = incomeTax * 0.1;
  const totalTax = incomeTax + localTax;
  const effectiveTaxRate = annualIncome > 0 ? (totalTax + financialIncomeTax) / (annualIncome + financialIncome) : 0;

  const nationalPension = Math.min(annualIncome * 0.045 / 12, 225000);
  const healthInsurance = Math.min(annualIncome * 0.03545 / 12, 250000);
  const employmentInsurance = annualIncome * 0.009 / 12;
  const totalMonthlyDeductions = totalTax / 12 + nationalPension + healthInsurance + employmentInsurance;
  const netMonthlyIncome = input.monthlyIncome - totalMonthlyDeductions;

  return {
    annualIncome,
    incomeDeduction,
    basicDeduction,
    spouseDeduction,
    dependentDeduction,
    taxableIncome: totalTaxableIncome,
    incomeTax,
    localTax,
    totalTax,
    effectiveTaxRate,
    nationalPension,
    healthInsurance,
    employmentInsurance,
    totalDeductions: totalMonthlyDeductions,
    netMonthlyIncome,
    financialIncome,
    isFinancialIncomeSubjectToGlobal,
    financialIncomeTax,
    financialIncomeWithheld,
    financialIncomeSurcharge,
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

  const yearsToRetirement = Math.max(0, 65 - input.age);
  const expectedMonthlyPension = ((irpContribution + pensionSavingsContribution + input.existingPension * 12) * yearsToRetirement * 1.03) / (20 * 12);

  return {
    irpContribution,
    pensionSavingsContribution,
    nationalPensionVoluntary: 0,
    totalPensionContribution: irpContribution + pensionSavingsContribution,
    taxSaving,
    expectedMonthlyPension,
  };
}

export function getMarginalTaxRate(taxableIncome: number): number {
  const bracket = INCOME_TAX_BRACKETS.find(
    b => taxableIncome > b.min && taxableIncome <= b.max
  );
  return bracket ? bracket.rate * 1.1 : 0.066;
}

export function generateTaxSavingStrategies(input: UserInput, taxResult: TaxResult): TaxSavingStrategy[] {
  const marginalRate = getMarginalTaxRate(taxResult.taxableIncome);
  const annualIncome = taxResult.annualIncome;
  const financialIncome = taxResult.financialIncome;
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
    description: '비과세 한도 200만원(서민형 400만원), 초과분 9.9% 분리과세. 금융소득 종합과세 분산 효과',
    maxAmount: isaMax,
    recommendedAmount: isaRecommended,
    taxSaving: Math.min(200000 * 0.154, isaRecommended * 0.01),
    category: 'deduction',
    priority: 3,
  });

  // 금융소득 종합과세 대상일 때 추가 전략
  if (taxResult.isFinancialIncomeSubjectToGlobal) {
    strategies.push({
      name: '금융소득 분산 (가족 계좌)',
      description: `현재 금융소득 ${(financialIncome / 10000).toFixed(0)}만원으로 종합과세 대상입니다. 배우자/가족 계좌로 분산하면 인당 2,000만원 기준으로 분리과세 가능`,
      maxAmount: financialIncome,
      recommendedAmount: Math.max(0, financialIncome - FINANCIAL_GLOBAL_THRESHOLD),
      taxSaving: taxResult.financialIncomeSurcharge,
      category: 'deduction',
      priority: 2,
    });

    strategies.push({
      name: '비과세 금융상품 활용',
      description: '장기저축성보험(10년↑), 조합 예탁금(3,000만원 한도), 농특세 비과세 등 금융소득 총액 자체를 줄이는 방법',
      maxAmount: financialIncome,
      recommendedAmount: Math.min(30000000, financialIncome * 0.3),
      taxSaving: Math.min(30000000, financialIncome * 0.3) * 0.154,
      category: 'deduction',
      priority: 3,
    });
  }

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

// 금융소득 종합과세 기준액 (외부 참조용)
export { FINANCIAL_GLOBAL_THRESHOLD };
