import React, { useState } from 'react';
import { api } from '../services/api';

export default function UsuarioForm({ onUsuarioCreado, onCancelar }) {
  const [formData, setFormData] = useState({
    usuario: '',
    email: '',
    password: '',
    rol: 'Usuario',
  });

  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await api.register(formData);
      if (onUsuarioCreado) onUsuarioCreado();
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta de usuario');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Crear Nueva Cuenta</h2>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Usuario</label>
          <input
            type="text"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="ej. jperez"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Correo Electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="ej. usuario@empresa.cl"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Contraseña</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Rol del Sistema</label>
          <select
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="Admin">Administrador</option>
            <option value="Usuario">Usuario General</option>
            <option value="Vendedor">Vendedor</option>
          </select>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={cargando}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition disabled:opacity-50"
          >
            {cargando ? 'Guardando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}