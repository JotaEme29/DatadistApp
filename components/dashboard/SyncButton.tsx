'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function SyncButton({ onSyncComplete }: { onSyncComplete: () => void }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // 1. Sync Clients
      const resClients = await fetch('/api/sync/clients', { method: 'POST' });
      if (!resClients.ok) {
        const payload = await resClients.json().catch(() => ({}));
        throw new Error(payload.error || 'Error syncing clients');
      }
      
      // 2. Sync Consumption
      const resConsumption = await fetch('/api/sync/consumption', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ staleDays: 0 }),
      });
      if (!resConsumption.ok) {
        const payload = await resConsumption.json().catch(() => ({}));
        throw new Error(payload.error || 'Error syncing consumption');
      }

      alert('Sincronización completada correctamente');
      onSyncComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido durante la sincronización.';
      console.error(err);
      alert('Error durante la sincronización: ' + message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button 
      onClick={handleSync} 
      disabled={syncing}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium disabled:opacity-50"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Sincronizando...' : 'Sincronizar Datos'}
    </button>
  );
}
