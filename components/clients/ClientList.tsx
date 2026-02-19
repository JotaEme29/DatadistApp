'use client';

import { useEffect, useState } from 'react';
import { Trash2, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Authorization {
  nif: string;
  name: string;
  status: string; // ACTIVE, REVOKED
  created_at: string;
}

export default function ClientList() {
  const [clients, setClients] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const res = await fetch(`/api/clients?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar clientes');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        fetchClients();
    }, 500); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleCancel = async (nif: string) => {
    // ... existing handleCancel logic or update to DB deletion if needed
    // For now, let's assume we still call Datadis to cancel, then sync?
    // Or just mark as REVOKED in DB?
    // Let's keep calling the Datadis API for cancellation for now to be safe, 
    // but ideally we should update DB too.
    if (!confirm(`¿Estás seguro de cancelar la autorización para el NIF ${nif}?`)) return;

    try {
      const res = await fetch('/api/datadis/authorizations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizedNif: nif }),
      });
      
      if (!res.ok) throw new Error('Error al cancelar');
      
      // Refresh list
      fetchClients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
          <input 
            type="text" 
            placeholder="Buscar por NIF o Nombre..." 
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Nombre / NIF</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Creado</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin inline" /></td></tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No hay autorizaciones activas.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.nif} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{client.name || 'Sin nombre'}</div>
                      <div className="text-xs text-gray-500">{client.nif}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    `}>
                      {client.status === 'ACTIVE' ? 'Activo' : 'Revocado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(client.created_at || '').toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleCancel(client.nif)}
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancelar autorización"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
