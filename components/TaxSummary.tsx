'use client';

import { TaxResult } from '@/lib/taxCalculator';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  result: TaxResult;
}

function fmt(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억원`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-4 text-white`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
    </div>
  );
}

export default function TaxSummary({ result }: Props) {
  const totalIncome = result.annualIncome + result.financialIncome;
  const totalTaxBurden = result.totalTax + result.financialIncomeTax;

  const pieData = [
    { name: '실수령 연봉', value: result.netMonthlyIncome * 12, color: '#22c55e' },
    { name: '소득세+지방세', value: result.totalTax, color: '#ef4444' },
    { name: '4대보험', value: (result.nationalPension + result.healthInsurance + result.employmentInsurance) * 12, color: '#f59e0b' },
    ...(result.financialIncome > 0 ? [{ name: '금융소득세', value: result.financialIncomeTax, color: '#8b5cf6' }] : []),
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm">💰</span>
        현재 세금 분석
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="총 소득"
          value={fmt(totalIncome)}
          sub={result.financialIncome > 0 ? `금융소득 포함 ${fmt(result.financialIncome)}` : undefined}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          label="실효세율"
          value={`${(result.effectiveTaxRate * 100).toFixed(1)}%`}
          sub="전체 소득 기준"
          color="from-red-500 to-red-600"
        />
        <StatCard
          label="월 납부 세금"
          value={fmt(result.totalTax / 12)}
          sub="소득세+지방세"
          color="from-orange-500 to-orange-600"
        />
        <StatCard
          label="월 실수령액"
          value={fmt(result.netMonthlyIncome)}
          sub="4대보험 포함"
          color="from-green-500 to-green-600"
        />
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => fmt(Number(v))} />
            <Legend iconType="circle" iconSize={10} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 근로소득 공제 내역 */}
      <div className="space-y-2 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">근로소득 공제 내역 (연간)</h3>
        {[
          { label: '총 급여', value: result.annualIncome },
          { label: '근로소득공제', value: -result.incomeDeduction, minus: true },
          { label: '기본/배우자/부양공제', value: -(result.basicDeduction + result.spouseDeduction + result.dependentDeduction), minus: true },
          { label: '과세표준', value: result.taxableIncome, bold: true },
          { label: '소득세', value: result.incomeTax },
          { label: '지방소득세', value: result.localTax },
        ].map(item => (
          <div key={item.label} className={`flex justify-between text-sm ${item.bold ? 'bg-slate-50 px-2 py-1 rounded-lg' : ''}`}>
            <span className="text-slate-500">{item.label}</span>
            <span className={`font-medium ${item.bold ? 'text-slate-800 font-bold' : item.minus ? 'text-red-500' : 'text-slate-800'}`}>
              {item.minus ? `-${fmt(Math.abs(item.value))}` : fmt(item.value)}
            </span>
          </div>
        ))}
      </div>

      {/* 금융소득 종합과세 */}
      {result.financialIncome > 0 && (
        <div className={`border-t pt-4 space-y-3 ${result.isFinancialIncomeSubjectToGlobal ? 'border-red-100' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700">금융소득 과세</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              result.isFinancialIncomeSubjectToGlobal
                ? 'bg-red-100 text-red-600'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {result.isFinancialIncomeSubjectToGlobal ? '종합과세' : '분리과세 (14%)'}
            </span>
          </div>

          {result.isFinancialIncomeSubjectToGlobal && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs space-y-1.5">
              <p className="font-semibold text-red-700">⚠ 금융소득 종합과세 대상</p>
              <p className="text-red-600 leading-relaxed">
                금융소득 {fmt(result.financialIncome)}이 연 2,000만원을 초과하여 근로소득과 합산 과세됩니다.
                초과분 {fmt(result.financialIncome - 20000000)}은 최고 {(result.effectiveTaxRate * 100).toFixed(1)}% 세율이 적용될 수 있습니다.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {[
              { label: '금융소득 합계', value: result.financialIncome },
              { label: '원천징수세 (14%)', value: result.financialIncomeWithheld },
              ...(result.isFinancialIncomeSubjectToGlobal ? [
                { label: '종합과세 추가세', value: result.financialIncomeSurcharge, highlight: true },
              ] : []),
              { label: '금융소득 총 세금', value: result.financialIncomeTax, bold: true },
            ].map(item => (
              <div key={item.label} className={`flex justify-between text-sm ${item.bold ? 'bg-slate-50 px-2 py-1 rounded-lg' : ''}`}>
                <span className="text-slate-500">{item.label}</span>
                <span className={`font-medium ${
                  item.bold ? 'text-slate-800 font-bold' :
                  item.highlight ? 'text-red-600' : 'text-slate-800'
                }`}>{fmt(item.value)}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
            <p className="font-semibold text-slate-700">연간 세금 합계</p>
            <div className="flex justify-between">
              <span className="text-slate-500">근로소득 세금</span>
              <span className="font-medium">{fmt(result.totalTax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">금융소득 세금</span>
              <span className="font-medium">{fmt(result.financialIncomeTax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
              <span className="font-semibold text-slate-700">총 납부 세금</span>
              <span className="font-bold text-slate-800">{fmt(totalTaxBurden)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4대보험 */}
      <div className="space-y-2 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">월 4대보험</h3>
        {[
          { label: '국민연금', value: result.nationalPension },
          { label: '건강보험', value: result.healthInsurance },
          { label: '고용보험', value: result.employmentInsurance },
        ].map(item => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-slate-500">{item.label}</span>
            <span className="font-medium text-slate-800">{fmt(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
