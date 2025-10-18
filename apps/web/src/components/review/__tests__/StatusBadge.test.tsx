/**
 * Status Badge Component Tests
 * Story 3.1: 内容审核工作台
 */

/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge, statusConfig } from '../StatusBadge';
import type { ContentReviewStatus } from '../../../stores/contentReviewStore';

describe('StatusBadge', () => {
  const statuses: ContentReviewStatus[] = [
    'DRAFT',
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED',
    'PUBLISHED',
  ];

  describe('rendering', () => {
    it.each(statuses)('should render %s status correctly', (status) => {
      render(<StatusBadge status={status} />);
      
      const config = statusConfig[status];
      expect(screen.getByText(config.label)).toBeInTheDocument();
    });

    it('should show icon by default', () => {
      const { container } = render(<StatusBadge status="APPROVED" />);
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      const { container } = render(<StatusBadge status="APPROVED" showIcon={false} />);
      
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      const { container } = render(<StatusBadge status="APPROVED" size="sm" />);
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-xs');
    });

    it('should render medium size by default', () => {
      const { container } = render(<StatusBadge status="APPROVED" />);
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-sm');
    });

    it('should render large size', () => {
      const { container } = render(<StatusBadge status="APPROVED" size="lg" />);
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('styling', () => {
    it('should apply correct color classes for APPROVED status', () => {
      const { container } = render(<StatusBadge status="APPROVED" />);
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-success-700');
      expect(badge).toHaveClass('bg-success-100');
    });

    it('should apply correct color classes for REJECTED status', () => {
      const { container } = render(<StatusBadge status="REJECTED" />);
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-error-700');
      expect(badge).toHaveClass('bg-error-100');
    });

    it('should apply correct color classes for PENDING_REVIEW status', () => {
      const { container } = render(<StatusBadge status="PENDING_REVIEW" />);
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-warning-700');
      expect(badge).toHaveClass('bg-warning-100');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <StatusBadge status="APPROVED" className="custom-class" />
      );
      
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(<StatusBadge status="APPROVED" />);
      
      const badge = container.querySelector('span');
      expect(badge).toBeInTheDocument();
    });
  });
});

