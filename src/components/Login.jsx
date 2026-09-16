import React, { useState } from 'react';
import { api } from '../services/api';

export default function Login({ onLoginSuccess }) {
// usuario = variable del estado "value", setUsuario = funcion para poder modificar esa variable "onChange", useState('') = inicializa vacio 
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // 1. Petición a /api/auth/login usando la capa centralizada
      const data = await api.login({ usuario, password });

      // 2. Guardamos el usuario
      sessionStorage.setItem('usuario', JSON.stringify(data.usuario));

      // 3. Notificamos al componente padre
      onLoginSuccess(data.usuario);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-xl">
            🔐
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h2>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa tu usuario y contraseña para acceder al sistema
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Usuario
            </label>
            <input
              type="text"
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)} // e.tarjet.value = Extrae la cadena de texto exacta que está dentro del <input> en ese milisegundo.
              placeholder="Ej: admin"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {cargando ? 'Ingresando...' : 'Acceder al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}