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
  const pieData = [
    { name: '실수령 연봉', value: result.netMonthlyIncome * 12, color: '#22c55e' },
    { name: '소득세+지방세', value: result.totalTax, color: '#ef4444' },
    { name: '4대보험', value: (result.nationalPension + result.healthInsurance + result.employmentInsurance) * 12, color: '#f59e0b' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm">💰</span>
        현재 세금 분석
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="연 소득" value={fmt(result.annualIncome)} color="from-blue-500 to-blue-600" />
        <StatCard label="실효세율" value={`${(result.effectiveTaxRate * 100).toFixed(1)}%`} sub="소득세 기준" color="from-red-500 to-red-600" />
        <StatCard label="월 납부 세금" value={fmt(result.totalTax / 12)} sub="소득세+지방세" color="from-orange-500 to-orange-600" />
        <StatCard label="월 실수령액" value={fmt(result.netMonthlyIncome)} sub="4대보험 포함" color="from-green-500 to-green-600" />
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

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">공제 내역 (연간)</h3>
        {[
          { label: '근로소득공제', value: result.incomeDeduction },
          { label: '기본공제', value: result.basicDeduction + result.spouseDeduction + result.dependentDeduction },
          { label: '과세표준', value: result.taxableIncome },
          { label: '소득세', value: result.incomeTax },
          { label: '지방소득세', value: result.localTax },
        ].map(item => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-slate-500">{item.label}</span>
            <span className="font-medium text-slate-800">{fmt(item.value)}</span>
          </div>
        ))}
      </div>

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
