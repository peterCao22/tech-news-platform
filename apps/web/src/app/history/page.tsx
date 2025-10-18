'use client';

/**
 * Story 4.3: 历史内容分析与趋势 - 统一入口页面
 * 集成4个功能：个人分析、每日记录、趋势分析、公司追踪
 */

import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { BarChart3, Calendar, TrendingUp, Building2 } from 'lucide-react';

// 导入4个子页面组件（我们会将它们改造成组件）
import dynamic from 'next/dynamic';

// 动态导入，避免服务端渲染问题
const PersonalAnalysisTab = dynamic(() => import('@/components/history/PersonalAnalysisTab'), { ssr: false });
const DailyReadingTab = dynamic(() => import('@/components/history/DailyReadingTab'), { ssr: false });
const TrendsTab = dynamic(() => import('@/components/history/TrendsTab'), { ssr: false });
const CompanyTrackingTab = dynamic(() => import('@/components/history/CompanyTrackingTab'), { ssr: false });

type TabType = 'personal' | 'daily' | 'trends' | 'company';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('personal');

  const tabs = [
    {
      id: 'personal' as TabType,
      name: '个人分析',
      icon: BarChart3,
      description: '我的阅读习惯 vs 平台热门',
    },
    {
      id: 'daily' as TabType,
      name: '每日记录',
      icon: Calendar,
      description: '按日期查看阅读历史',
    },
    {
      id: 'trends' as TabType,
      name: '趋势分析',
      icon: TrendingUp,
      description: '关键词与分类趋势',
    },
    {
      id: 'company' as TabType,
      name: '公司追踪',
      icon: Building2,
      description: '追踪特定公司动态',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">历史内容分析与趋势</h1>
          <p className="text-gray-600 mt-1">深度分析您的阅读习惯和平台内容趋势</p>
        </div>

        {/* Tab导航 */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-4 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                      : 'bg-white border-2 border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon
                      className={`w-6 h-6 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                    <div className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
                      {tab.name}
                    </div>
                    <div className="text-xs text-gray-500 text-center hidden md:block">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab内容 */}
        <div className="min-h-screen">
          {activeTab === 'personal' && <PersonalAnalysisTab />}
          {activeTab === 'daily' && <DailyReadingTab />}
          {activeTab === 'trends' && <TrendsTab />}
          {activeTab === 'company' && <CompanyTrackingTab />}
        </div>
      </div>
    </DashboardLayout>
  );
}

