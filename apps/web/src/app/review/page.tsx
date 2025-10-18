/**
 * Content Review Page
 * Story 3.1: 内容审核工作台界面
 * 
 * 内容审核工作台页面，需要编辑或管理员权限
 */

'use client';

import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ReviewDashboard } from '../../components/review';

export default function ReviewPage() {
  return (
    <DashboardLayout>
      <ReviewDashboard />
    </DashboardLayout>
  );
}

