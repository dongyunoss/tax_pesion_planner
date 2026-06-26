'use client';

import { PensionStrategy, UserInput } from '@/lib/taxCalculator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  strategy: PensionStrategy;
  input: UserInput;
}

function fmt(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString();
}

function fmtFull(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억원`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

export default function PensionPlan({ strategy, input }: Props) {
  const yearsToRetirement = Math.max(0, 65 - input.age);

  const projectionData = Array.from({ length: Math.min(yearsToRetirement + 1, 41) }, (_, i) => {
    const year = input.age + i;
    const accumulated = strategy.totalPensionContribution * i * Math.pow(1.04, i / 2);
    return {
      age: `${year}세`,
      국민연금: Math.round(input.existingPension * 12 * i * 0.8),
      퇴직연금: Math.round(strategy.irpContribution * i * Math.pow(1.035, i / 2)),
      연금저축: Math.round(strategy.pensionSavingsContribution * i * Math.pow(1.04, i / 2)),
    };
  }).filter((_, i) => i % 5 === 0 || i === yearsToRetirement);

  const nationalPensionMonthly = Math.round(input.existingPension * 0.5 + 800000);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm">🏗️</span>
        연금 설계
      </h2>

      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white">
        <p className="text-sm opacity-80">65세 예상 월 연금 수령액</p>
        <p className="text-4xl font-bold mt-1">
          {fmtFull(nationalPensionMonthly + strategy.expectedMonthlyPension)}
        </p>
        <p className="text-xs opacity-70 mt-2">
          국민연금 ~{fmtFull(nationalPensionMonthly)} + 사적연금 ~{fmtFull(strategy.expectedMonthlyPension)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <p className="text-xs text-blue-600 font-medium">IRP 추천 연납</p>
          <p className="text-lg font-bold text-blue-800 mt-1">{fmtFull(strategy.irpContribution)}</p>
          <p className="text-xs text-blue-500">월 {fmtFull(strategy.irpContribution / 12)}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
          <p className="text-xs text-indigo-600 font-medium">연금저축 추천 연납</p>
          <p className="text-lg font-bold text-indigo-800 mt-1">{fmtFull(strategy.pensionSavingsContribution)}</p>
          <p className="text-xs text-indigo-500">월 {fmtFull(strategy.pensionSavingsContribution / 12)}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
          <p className="text-xs text-green-600 font-medium">연금 관련 절세액</p>
          <p className="text-lg font-bold text-green-800 mt-1">{fmtFull(strategy.taxSaving)}</p>
          <p className="text-xs text-green-500">연간 절세 효과</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
          <p className="text-xs text-purple-600 font-medium">은퇴까지 기간</p>
          <p className="text-lg font-bold text-purple-800 mt-1">{yearsToRetirement}년</p>
          <p className="text-xs text-purple-500">{input.age}세 → 65세</p>
        </div>
      </div>

      {projectionData.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">연금 자산 성장 추이 (만원)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="age" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={(v) => [`${fmt(Number(v))}원`, '']} />
                <Bar dataKey="퇴직연금" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="연금저축" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="국민연금" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 justify-center mt-2">
            {[
              { label: '퇴직연금(IRP)', color: 'bg-blue-500' },
              { label: '연금저축', color: 'bg-purple-500' },
              { label: '국민연금', color: 'bg-green-500' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                <span className="text-xs text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-700">3층 연금 구조</h3>
        {[
          {
            layer: '1층', name: '국민연금', color: 'bg-green-500', width: '60%',
            desc: '기초 안전망 • 의무 가입', monthly: `~${fmtFull(nationalPensionMonthly)}`,
          },
          {
            layer: '2층', name: 'IRP/퇴직연금', color: 'bg-blue-500', width: '40%',
            desc: '세액공제 혜택 • 근로소득자 필수', monthly: `~${fmtFull(strategy.expectedMonthlyPension * 0.6)}`,
          },
          {
            layer: '3층', name: '연금저축/ISA', color: 'bg-purple-500', width: '30%',
            desc: '자유로운 추가 납입 • 유연성', monthly: `~${fmtFull(strategy.expectedMonthlyPension * 0.4)}`,
          },
        ].map(item => (
          <div key={item.layer} className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 w-6">{item.layer}</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">{item.name}</span>
                <span className="text-xs text-slate-500">{item.monthly}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: item.width }} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
