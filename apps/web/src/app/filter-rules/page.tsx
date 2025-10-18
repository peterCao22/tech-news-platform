/**
 * Filter Rules Page
 * Story 3.2: Intelligent Filter Rules
 */

'use client';

import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { RulesManagement } from '../../components/filter-rules';

export default function FilterRulesPage() {
  return (
    <DashboardLayout>
      <RulesManagement />
    </DashboardLayout>
  );
}

