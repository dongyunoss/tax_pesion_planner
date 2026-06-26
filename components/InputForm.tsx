'use client';

import { UserInput } from '@/lib/taxCalculator';

interface Props {
  input: UserInput;
  onChange: (input: UserInput) => void;
}

function SliderField({
  label, value, min, max, step, unit, onChange, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-blue-600">
          {value.toLocaleString()}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min.toLocaleString()}{unit}</span>
        <span>{max.toLocaleString()}{unit}</span>
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function InputForm({ input, onChange }: Props) {
  const update = (key: keyof UserInput, value: unknown) =>
    onChange({ ...input, [key]: value });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm">📝</span>
        기본 정보 입력
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => update('employmentType', 'employee')}
          className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
            input.employmentType === 'employee'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          직장인
        </button>
        <button
          onClick={() => update('employmentType', 'self-employed')}
          className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
            input.employmentType === 'self-employed'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          자영업자
        </button>
      </div>

      <SliderField
        label="월 소득"
        value={input.monthlyIncome}
        min={1000000} max={20000000} step={100000}
        unit="원"
        onChange={v => update('monthlyIncome', v)}
        hint={`연 소득: ${(input.monthlyIncome * 12).toLocaleString()}원`}
      />

      <SliderField
        label="나이"
        value={input.age}
        min={20} max={70} step={1}
        unit="세"
        onChange={v => update('age', v)}
        hint={`은퇴까지 약 ${Math.max(0, 65 - input.age)}년 남음`}
      />

      <SliderField
        label="월 생활비"
        value={input.monthlyExpenses}
        min={500000} max={10000000} step={100000}
        unit="원"
        onChange={v => update('monthlyExpenses', v)}
      />

      <SliderField
        label="월 저축 가능액"
        value={input.monthlySavings}
        min={0} max={5000000} step={50000}
        unit="원"
        onChange={v => update('monthlySavings', v)}
      />

      <SliderField
        label="현재 월 연금 납입액"
        value={input.existingPension}
        min={0} max={1000000} step={10000}
        unit="원"
        onChange={v => update('existingPension', v)}
      />

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-700">부양가족</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={input.hasSpouse}
              onChange={e => update('hasSpouse', e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span className="text-sm text-slate-600">배우자</span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">자녀 수</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => update('dependents', Math.max(0, input.dependents - 1))}
              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
            >−</button>
            <span className="w-8 text-center font-bold text-slate-800">{input.dependents}</span>
            <button
              onClick={() => update('dependents', Math.min(5, input.dependents + 1))}
              className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-bold hover:bg-blue-200 transition-colors"
            >+</button>
          </div>
          <span className="text-sm text-slate-500">명</span>
        </div>
      </div>
    </div>
  );
}
