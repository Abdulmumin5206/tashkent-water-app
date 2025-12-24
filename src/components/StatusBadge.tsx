import React from 'react';
import { OrderStatus } from '../types';

export interface StatusBadgeConfig {
  label: string;
  color: string;
  bgColor: string;
}

/**
 * Maps order status to visual representation (color and label)
 * 
 * Requirements: 2.5 - THE System SHALL indicate order status with visual badges
 */
export const getStatusBadgeConfig = (status: OrderStatus): StatusBadgeConfig => {
  const statusMap: Record<OrderStatus, StatusBadgeConfig> = {
    received: {
      label: 'Received',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
    },
    on_the_way: {
      label: 'On the Way',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
    },
    delivered: {
      label: 'Delivered',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
    },
  };

  return statusMap[status];
};

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * StatusBadge displays order status with appropriate color and label
 * 
 * Requirements: 2.5 - THE System SHALL indicate order status with visual badges
 * (Received, On the Way, Delivered, Cancelled)
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = getStatusBadgeConfig(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
