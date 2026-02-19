'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

export default function AuthorizationForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    authorizedNif: '',
    startDate: '', // optional
    endDate: ''    // optional
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/datadis/authorizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al solicitar autorización');
      }

      setFormData({ authorizedNif: '', startDate: '', endDate: '' });
      alert('Solicitud enviada correctamente');
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Autorización</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NIF del Cliente
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej: 12345678A"
            value={formData.authorizedNif}
            onChange={(e) => setFormData({ ...formData, authorizedNif: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Solicitar Acceso
        </button>
        
        <p className="text-xs text-gray-500 mt-2">
          El cliente recibirá una notificación de Datadis para confirmar el acceso a sus datos.
        </p>
      </form>
    </div>
  );
}
