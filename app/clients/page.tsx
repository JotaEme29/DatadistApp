'use client';

import ClientList from '@/components/clients/ClientList';
import AuthorizationForm from '@/components/clients/AuthorizationForm';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';

export default function ClientsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ClientList key={refreshKey} />
        </div>
        
        <div className="lg:col-span-1">
          <AuthorizationForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
