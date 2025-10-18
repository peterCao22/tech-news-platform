/**
 * Weight Adjuster Component
 * Story 3.2: Intelligent Filter Rules
 */

import React from 'react';

interface WeightAdjusterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  description?: string;
}

export const WeightAdjuster: React.FC<WeightAdjusterProps> = ({
  value,
  onChange,
  min = 0.1,
  max = 5.0,
  step = 0.1,
  label = '权重',
  description,
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const getWeightLabel = (weight: number): string => {
    if (weight < 0.5) return '极低';
    if (weight < 0.8) return '低';
    if (weight < 1.2) return '正常';
    if (weight < 2.0) return '高';
    return '极高';
  };

  const getSliderColor = (weight: number): string => {
    if (weight < 0.8) return 'accent-red-500';
    if (weight < 1.2) return 'accent-gray-500';
    return 'accent-green-500';
  };

  return (
    <div className="space-y-3">
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-900">
            {getWeightLabel(value)}
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${getSliderColor(value)}`}
        />
        {/* Reference markers */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{min}</span>
          <span>1.0</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-600">{description}</p>
      )}

      {/* Weight Impact */}
      <div className="rounded-md bg-gray-50 p-3 text-sm">
        <div className="font-medium text-gray-700 mb-1">权重影响：</div>
        <ul className="space-y-1 text-gray-600">
          {value < 1.0 ? (
            <li>• 内容评分将被降低 {((1 - value) * 100).toFixed(0)}%</li>
          ) : value > 1.0 ? (
            <li>• 内容评分将被提升 {((value - 1) * 100).toFixed(0)}%</li>
          ) : (
            <li>• 不影响内容评分</li>
          )}
          {value === 0 && <li>• ⚠️ 权重为0将完全屏蔽该类内容</li>}
        </ul>
      </div>
    </div>
  );
};

