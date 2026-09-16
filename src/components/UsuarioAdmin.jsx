import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function UsuarioAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modoModal, setModoModal] = useState(null); // 'crear' | 'editar' | null
  const [usuarioEdit, setUsuarioEdit] = useState(null);

  const [formData, setFormData] = useState({
    usuario: '',
    email: '',
    password: '',
    rol: 'Usuario'
  });

  const cargarUsuarios = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err.message || 'Error al cargar los usuarios');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const abrirModalCrear = () => {
    setUsuarioEdit(null);
    setFormData({ usuario: '', email: '', password: '', rol: 'Usuario' });
    setModoModal('crear');
  };

  const abrirModalEditar = (user) => {
    setUsuarioEdit(user);
    setFormData({
      usuario: user.usuario,
      email: user.email,
      password: '', // Vacío para no cambiar salvo que se escriba algo
      rol: user.rol || 'Usuario'
    });
    setModoModal('editar');
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el usuario "${nombre}"?`)) return;

    try {
      await api.eliminarUsuario(id);
      cargarUsuarios();
    } catch (err) {
      alert(err.message || 'Error al eliminar usuario');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (modoModal === 'crear') {
        await api.register(formData);
      } else if (modoModal === 'editar') {
        await api.actualizarUsuario(usuarioEdit.id, formData);
      }
      setModoModal(null);
      cargarUsuarios();
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción Crear */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Administración de Cuentas</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Gestión de credenciales y roles del sistema</p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          + Crear Nueva Cuenta
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold border border-rose-200">
          {error}
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-slate-500 text-xs font-semibold animate-pulse">
            Cargando usuarios de la base de datos...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">#{u.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{u.usuario}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        u.rol?.toLowerCase() === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {u.rol || 'Usuario'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => abrirModalEditar(u)}
                      className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(u.id, u.usuario)}
                      className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 bg-rose-50/50 rounded-lg transition-colors cursor-pointer"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para Crear/Editar */}
      {modoModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h4 className="text-base font-bold text-slate-900">
              {modoModal === 'crear' ? 'Crear Nueva Cuenta' : `Actualizar Cuenta: ${usuarioEdit?.usuario}`}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  required
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Contraseña {modoModal === 'editar' && '(Dejar en blanco para conservar)'}
                </label>
                <input
                  type="password"
                  required={modoModal === 'crear'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Usuario">Usuario</option>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModoModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}