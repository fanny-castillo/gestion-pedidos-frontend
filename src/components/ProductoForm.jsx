import { useState } from 'react';
import { api } from '../services/api';

export default function ProductoForm({ onProductoGuardado }) {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    stock: '',
    activo: true
  });
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.precio || !formData.stock) {
      setMensaje({ tipo: 'error', texto: 'Todos los campos marcados son obligatorios.' });
      return;
    }

    try {
      setCargando(true);
      setMensaje(null);

      const nuevoProducto = await api.crearProducto({
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock, 10),
        activo: formData.activo
      });

      setMensaje({ tipo: 'exito', texto: '¡Producto registrado con éxito en el catálogo!' });

      if (onProductoGuardado) {
        onProductoGuardado(nuevoProducto);
      }

      setFormData({ nombre: '', precio: '', stock: '', activo: true });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al registrar el producto en la API.' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 w-full max-w-md mx-auto my-6">
      <div className="border-b border-slate-100 pb-4 mb-5">
        <h2 className="text-xl font-bold text-slate-800">Nuevo Producto</h2>
        <p className="text-xs text-slate-500">Ingresa la información del catálogo</p>
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
            Nombre del Producto *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Teclado Mecánico RGB"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            disabled={cargando}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Precio ($) *
            </label>
            <input
              type="number"
              name="precio"
              step="0.01"
              min="0"
              value={formData.precio}
              onChange={handleChange}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              disabled={cargando}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Stock Inicial *
            </label>
            <input
              type="number"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              disabled={cargando}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="activo"
            name="activo"
            checked={formData.activo}
            onChange={handleChange}
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            disabled={cargando}
          />
          <label htmlFor="activo" className="text-xs font-semibold text-slate-700 cursor-pointer">
            Producto activo para la venta
          </label>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md text-sm cursor-pointer mt-2 disabled:bg-slate-400"
        >
          {cargando ? 'Guardando en API...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
}