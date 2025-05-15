import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import BulkUploadDeals from '../components/admin/BulkUploadDeals';

export default function AdminPage() {
  const { hasRole } = useAuth();

  if (!hasRole('admin')) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <BulkUploadDeals />
    </div>
  );
} 