import { useState } from 'react';
import { api } from '../services/api';

export default function ClienteForm({ onClienteGuardado }) {
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: ''
  });
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.rut) {
      setMensaje({ tipo: 'error', texto: 'El Nombre y el RUT son obligatorios.' });
      return;
    }

    try {
      setCargando(true);
      setMensaje(null);
      
      // Llamada a la API de .NET 10
      const nuevoCliente = await api.crearCliente(formData);

      setMensaje({ tipo: 'exito', texto: '¡Cliente guardado correctamente en la base de datos!' });
      
      if (onClienteGuardado) {
        onClienteGuardado(nuevoCliente);
      }
      
      setFormData({ nombre: '', rut: '', email: '' });
    } catch (err) {
      setMensaje({ 
        tipo: 'error', 
        texto: 'Error al conectar con el servidor .NET. Verifica que la API esté corriendo y CORS configurado.' 
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full max-w-md mx-auto my-6">
      <div className="border-b border-slate-100 pb-4 mb-5">
        <h2 className="text-xl font-bold text-slate-800">Nuevo Cliente</h2>
        <p className="text-xs text-slate-500">Ingresa los datos para registrar en la base de datos</p>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-lg text-xs font-semibold mb-4 ${
          mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Nombre Completo *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Laura Morales"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            disabled={cargando}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            RUT *
          </label>
          <input
            type="text"
            name="rut"
            value={formData.rut}
            onChange={handleChange}
            placeholder="Ej: 12.345.678-9"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            disabled={cargando}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Correo Electrónico
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="ejemplo@correo.com"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            disabled={cargando}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md text-sm cursor-pointer mt-2 disabled:bg-slate-400"
        >
          {cargando ? 'Guardando en API...' : 'Guardar Cliente'}
        </button>
      </form>
    </div>
  );
}