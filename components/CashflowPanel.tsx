'use client';

import { UserInput, TaxResult } from '@/lib/taxCalculator';

interface Props {
  input: UserInput;
  result: TaxResult;
  pensionContribution: number;
}

function fmt(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

export default function CashflowPanel({ input, result, pensionContribution }: Props) {
  const afterTax = result.netMonthlyIncome;
  const afterExpenses = afterTax - input.monthlyExpenses;
  const afterPension = afterExpenses - pensionContribution / 12;
  const freeFlow = afterPension - input.monthlySavings;

  const items = [
    { label: '월 총 소득', value: input.monthlyIncome, type: 'income' as const },
    { label: '세금 및 4대보험', value: -result.totalDeductions, type: 'expense' as const },
    { label: '실수령액', value: afterTax, type: 'subtotal' as const },
    { label: '생활비', value: -input.monthlyExpenses, type: 'expense' as const },
    { label: '생활비 차감 후', value: afterExpenses, type: 'subtotal' as const },
    { label: '연금 납입 (월)', value: -pensionContribution / 12, type: 'expense' as const },
    { label: '연금 차감 후', value: afterPension, type: 'subtotal' as const },
    { label: '추가 저축', value: -input.monthlySavings, type: 'expense' as const },
    { label: '잉여 현금흐름', value: freeFlow, type: freeFlow >= 0 ? 'income' as const : 'negative' as const },
  ];

  const health = freeFlow > 500000 ? 'good' : freeFlow >= 0 ? 'ok' : 'bad';
  const healthConfig = {
    good: { label: '양호', color: 'text-green-600', bg: 'bg-green-50 border-green-200', emoji: '✅' },
    ok: { label: '보통', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', emoji: '⚠️' },
    bad: { label: '주의', color: 'text-red-600', bg: 'bg-red-50 border-red-200', emoji: '🚨' },
  }[health];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="w-8 h-8 bg-cyan-100 text-cyan-600 rounded-lg flex items-center justify-center text-sm">📈</span>
        월간 현금흐름
      </h2>

      <div className={`${healthConfig.bg} border rounded-xl p-4 flex items-center justify-between`}>
        <div>
          <p className="text-sm font-semibold text-slate-700">재정 건강도</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {health === 'good' && '현금흐름이 여유롭습니다. 추가 투자를 고려해보세요.'}
            {health === 'ok' && '빠듯하지만 관리 가능한 수준입니다.'}
            {health === 'bad' && '지출을 줄이거나 소득을 늘려야 합니다.'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl">{healthConfig.emoji}</p>
          <p className={`text-sm font-bold ${healthConfig.color}`}>{healthConfig.label}</p>
        </div>
      </div>

      <div className="space-y-1">
        {items.map((item, i) => {
          const isSubtotal = item.type === 'subtotal';
          const isNegative = item.type === 'negative';
          return (
            <div
              key={i}
              className={`flex justify-between items-center px-3 py-2.5 rounded-lg ${
                isSubtotal ? 'bg-slate-50 border border-slate-200' : ''
              }`}
            >
              <span className={`text-sm ${isSubtotal ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                {item.label}
              </span>
              <span className={`text-sm font-${isSubtotal ? 'bold' : 'medium'} ${
                item.type === 'income' ? 'text-blue-600' :
                item.type === 'expense' ? 'text-red-500' :
                isNegative ? 'text-red-600' :
                item.value > 0 ? 'text-green-600' : 'text-slate-600'
              }`}>
                {item.value < 0 ? `-${fmt(Math.abs(item.value))}` : fmt(item.value)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">지출 비율 분석</h3>
        {[
          { label: '생활비', value: input.monthlyExpenses, color: 'bg-orange-400', max: input.monthlyIncome },
          { label: '세금/보험', value: result.totalDeductions, color: 'bg-red-400', max: input.monthlyIncome },
          { label: '연금 납입', value: pensionContribution / 12, color: 'bg-blue-400', max: input.monthlyIncome },
          { label: '추가 저축', value: input.monthlySavings, color: 'bg-green-400', max: input.monthlyIncome },
        ].map(item => (
          <div key={item.label}>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{item.label}</span>
              <span>{((item.value / item.max) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div
                className={`h-full ${item.color} rounded-full transition-all`}
                style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
