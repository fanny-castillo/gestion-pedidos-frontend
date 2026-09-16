// src/services/api.js
const API_BASE_URL = 'http://localhost:5224/api';

/**
 * Función helper para realizar peticiones HTTP seguras enviando Cookies HttpOnly.
 */
const fetchConAuth = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Envía automáticamente las cookies HttpOnly al backend
  });

  if (res.status === 401) {
    // Si la cookie expiró o es inválida, limpiamos los datos locales de interfaz
    sessionStorage.removeItem('usuario');
    // Forzamos la redirección al login
    window.location.href = '/login';
    throw new Error('No autorizado. Sesión expirada o inválida.');
  }

  return res;
};

export const api = {
  // --- AUTENTICACIÓN ---
  login: async (credenciales) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Permite recibir la cookie 'Set-Cookie' del servidor
      body: JSON.stringify(credenciales),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.mensaje || 'Error al iniciar sesión');
    }
    return await res.json();
  },

  logout: async () => {
    try {
      await fetchConAuth('/auth/logout', { method: 'POST' });
    } catch {
      // Ignoramos errores de red durante el logout
    } finally {
      sessionStorage.removeItem('usuario');
    }
  },

  // --- GESTIÓN DE USUARIOS (ADMIN) ---
  getUsuarios: async () => {
    const res = await fetchConAuth('/auth/usuarios');
    if (!res.ok) throw new Error('Error al obtener la lista de usuarios');
    return await res.json();
  },

  // CREAR NUEVA CUENTA USUARIO
  register: async (datosUsuario) => {
    const res = await fetchConAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(datosUsuario),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.mensaje || 'Error al registrar usuario');
    }
    return await res.json();
  },

  // ACTUALIZAR CUENTA USUARIO
  actualizarUsuario: async (id, datosUsuario) => {
    const res = await fetchConAuth(`/auth/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datosUsuario),
    });
    if (!res.ok) throw new Error('Error al actualizar el usuario');
    return await res.json();
  },

  // ELIMINAR CUENTA USUARIO
  eliminarUsuario: async (id) => {
    const res = await fetchConAuth(`/auth/usuarios/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar el usuario');
    return true;
  },

  // --- LISTA DE CLIENTES ---
  getClientes: async () => {
    const res = await fetchConAuth('/clientes');
    if (!res.ok) throw new Error('Error al obtener clientes');
    return await res.json();
  },

  // CREAR CUENTA CLIENTE
  crearCliente: async (cliente) => {
    const res = await fetchConAuth('/clientes', {
      method: 'POST',
      body: JSON.stringify(cliente),
    });
    if (!res.ok) throw new Error('Error al crear cliente');
    return await res.json();
  },

  // ACTUALIZAR CUENTA CLIENTE
  actualizarCliente: async (id, cliente) => {
    const res = await fetchConAuth(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cliente),
    });
    if (!res.ok) throw new Error('Error al actualizar cliente');
    return res.status === 204 ? true : await res.json();
  },

  // ELIMINAR CUENTA CLIENTE
  eliminarCliente: async (id) => {
    const res = await fetchConAuth(`/clientes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar cliente');
    return true;
  },

  // --- LISTA DE PRODUCTOS ---
  getProductos: async () => {
    const res = await fetchConAuth('/productos');
    if (!res.ok) throw new Error('Error al obtener productos');
    return await res.json();
  },

  // INSERTAR PRODUCTO
  crearProducto: async (producto) => {
    const res = await fetchConAuth('/productos', {
      method: 'POST',
      body: JSON.stringify(producto),
    });
    if (!res.ok) throw new Error('Error al crear producto');
    return await res.json();
  },

  // ACTUALIZAR PRODUCTO
  actualizarProducto: async (id, producto) => {
    const res = await fetchConAuth(`/productos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(producto),
    });
    if (!res.ok) throw new Error('Error al actualizar producto');
    return res.status === 204 ? true : await res.json();
  },

  // ELIMINAR PRODUCTO
  eliminarProducto: async (id) => {
    const res = await fetchConAuth(`/productos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar producto');
    return true;
  },

  // --- LISTA DE PEDIDOS ---
  getPedidos: async (usuarioId, rol) => {
    const params = new URLSearchParams();
    if (usuarioId) params.append('usuarioId', usuarioId);
    if (rol) params.append('rol', rol);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchConAuth(`/pedidos/Listar${queryString}`);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.mensaje || 'Error al obtener la lista de pedidos');
    }
    return await res.json();
  },

  // --- LISTA DE VENTAS ---
  getMisVentas: async (usuarioId, rol) => {
    const queryRol = rol ? `?rol=${encodeURIComponent(rol)}` : '';
    const res = await fetchConAuth(`/pedidos/mis-ventas/${usuarioId}${queryRol}`);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.mensaje || 'Error al obtener el listado de ventas');
    }
    return await res.json();
  },

  // CREAR PEDIDO
  crearPedido: async (pedido) => {
    const res = await fetchConAuth('/pedidos', {
      method: 'POST',
      body: JSON.stringify(pedido),
    });
    if (!res.ok) throw new Error('Error al crear pedido');
    return await res.json();
  },

  // ACTUALIZAR PEDIDO
  actualizarPedido: async (id, pedido) => {
    const res = await fetchConAuth(`/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pedido),
    });
    if (!res.ok) throw new Error('Error al actualizar pedido');
    return res.status === 204 ? true : await res.json();
  },

  // ELIMINAR PEDIDO
  eliminarPedido: async (id) => {
    const res = await fetchConAuth(`/pedidos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar pedido');
    return true;
  },
};

//Exportamos logout de forma independiente para permitir import { logout } from './services/api'
export const logout = api.logout;