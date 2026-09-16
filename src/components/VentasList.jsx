import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const VentasList = () => {
  const [ventas, setVentas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de Filtros
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');

  // Estados de Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 10;

  // Carga de Sesión desde sessionStorage
  const usuarioSesion = useMemo(() => {
    try {
      const sesionGuardada = 
        sessionStorage.getItem('usuario') || 
        sessionStorage.getItem('user') || 
        sessionStorage.getItem('session');

      return sesionGuardada ? JSON.parse(sesionGuardada) : {};
    } catch (err) {
      console.error('Error al leer la sesión de sessionStorage:', err);
      return {};
    }
  }, []);

  const esAdmin = useMemo(() => {
    const rol = (usuarioSesion?.rol || usuarioSesion?.role || '').toLowerCase();
    return rol === 'admin' || rol === 'administrador';
  }, [usuarioSesion]);

  // Cargar lista de usuarios si es Admin (para el selector de filtros)
  useEffect(() => {
    const cargarUsuarios = async () => {
      if (esAdmin) {
        try {
          const listaUsuarios = await api.getUsuarios();
          setUsuarios(listaUsuarios || []);
        } catch (errUser) {
          console.warn('No se pudo obtener la lista de usuarios para los filtros:', errUser);
        }
      }
    };
    cargarUsuarios();
  }, [esAdmin]);

  // Función principal para obtener ventas usando api.getMisVentas
  const cargarVentas = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      // Extraer identificadores del usuario activo
      const userId = usuarioSesion?.id || usuarioSesion?.userId || usuarioSesion?.idUsuario;
      const userRol = usuarioSesion?.rol || usuarioSesion?.role || '';

      if (!userId) {
        setError('No se encontró una sesión activa válida en el navegador.');
        return;
      }

      // Reutilizamos el método de la API pasando userId y userRol extraídos de sessionStorage
      const data = await api.getMisVentas(userId, userRol);

      // Si el rol NO es admin, aseguramos en frontend filtrar exclusivamente sus datos
      const ventasValidadas = esAdmin
        ? (data || [])
        : (data || []).filter((v) => {
            const idVendedorVenta = String(v.vendedorId || v.idUsuario || v.userId || '');
            const nombreVendedorVenta = (v.vendedorNombre || '').toLowerCase();
            const nombreUsuarioSesion = (
              usuarioSesion?.usuario || 
              usuarioSesion?.nombreUsuario || 
              usuarioSesion?.nombre || 
              ''
            ).toLowerCase();

            return (
              idVendedorVenta === String(userId) ||
              (nombreUsuarioSesion && nombreVendedorVenta === nombreUsuarioSesion)
            );
          });

      setVentas(ventasValidadas);
      setPaginaActual(1);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError(err.message || 'Ocurrió un problema al obtener los registros de ventas.');
    } finally {
      setCargando(false);
    }
  }, [usuarioSesion, esAdmin]);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  // Helper para verificar validez financiera
  const esVentaValida = (estado) => {
    const est = (estado || '').toLowerCase();
    return est === 'completado' || est === 'procesado';
  };

  // Opciones dinámicas para selector de meses
  const opcionesMeses = useMemo(() => {
    const conjuntoMeses = new Set();
    ventas.forEach((v) => {
      if (v.fechaPedido) {
        const fecha = new Date(v.fechaPedido);
        const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        conjuntoMeses.add(clave);
      }
    });

    return Array.from(conjuntoMeses)
      .sort((a, b) => b.localeCompare(a))
      .map((clave) => {
        const [year, month] = clave.split('-');
        const fechaDummy = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const label = fechaDummy.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
        return {
          valor: clave,
          etiqueta: label.charAt(0).toUpperCase() + label.slice(1)
        };
      });
  }, [ventas]);

  // Aplicación de filtros
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      const coincideVendedor =
        !vendedorSeleccionado ||
        v.vendedorNombre?.toLowerCase() === vendedorSeleccionado.toLowerCase();

      let coincideMes = true;
      if (mesSeleccionado && v.fechaPedido) {
        const fecha = new Date(v.fechaPedido);
        const claveFecha = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        coincideMes = claveFecha === mesSeleccionado;
      }

      return coincideVendedor && coincideMes;
    });
  }, [ventas, vendedorSeleccionado, mesSeleccionado]);

  // Datos ordenados para el gráfico
  const datosGraficoMensual = useMemo(() => {
    const mapaMeses = {};

    ventasFiltradas.forEach((v) => {
      if (!v.fechaPedido || !esVentaValida(v.estado)) return;

      const fecha = new Date(v.fechaPedido);
      const claveMes = fecha.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
      const claveOrden = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

      if (!mapaMeses[claveOrden]) {
        mapaMeses[claveOrden] = { mesLabel: claveMes, total: 0, cantidadPedidos: 0, claveOrden };
      }

      mapaMeses[claveOrden].total += v.total || 0;
      mapaMeses[claveOrden].cantidadPedidos += 1;
    });

    return Object.values(mapaMeses)
      .sort((a, b) => a.claveOrden.localeCompare(b.claveOrden))
      .map((item) => ({
        mes: item.mesLabel,
        Total: item.total,
        Pedidos: item.cantidadPedidos
      }));
  }, [ventasFiltradas]);

  // Cálculo total
  const totalMontoFiltrado = useMemo(() => {
    return ventasFiltradas
      .filter((v) => esVentaValida(v.estado))
      .reduce((acc, v) => acc + (v.total || 0), 0);
  }, [ventasFiltradas]);

  // Paginación
  const totalPaginas = Math.ceil(ventasFiltradas.length / elementosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * elementosPorPagina;
  const ventasPaginadas = ventasFiltradas.slice(indiceInicio, indiceInicio + elementosPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  // Exportación a Excel
  const exportarExcel = () => {
    try {
      const datosFormateados = ventasFiltradas.map((v) => ({
        'N° Pedido': `#${v.id}`,
        Fecha: new Date(v.fechaPedido).toLocaleDateString('es-CL'),
        Cliente: v.clienteNombre || 'Sin nombre',
        Vendedor: v.vendedorNombre || 'N/A',
        'Ítems': v.cantidadProductos || 0,
        Total: v.total || 0,
        Estado: v.estado || 'N/A'
      }));

      datosFormateados.push({
        'N° Pedido': '---',
        Fecha: '---',
        Cliente: 'TOTAL INGRESOS VÁLIDOS',
        Vendedor: '---',
        'Ítems': '---',
        Total: totalMontoFiltrado,
        Estado: '---'
      });

      const hojaTrabajo = XLSX.utils.json_to_sheet(datosFormateados);
      hojaTrabajo['!cols'] = [
        { wch: 12 },
        { wch: 14 },
        { wch: 30 },
        { wch: 20 },
        { wch: 10 },
        { wch: 16 },
        { wch: 15 }
      ];

      const libroTrabajo = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libroTrabajo, hojaTrabajo, 'Reporte Ventas');

      const fechaNombre = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(libroTrabajo, `Reporte_Ventas_${fechaNombre}.xlsx`);
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      alert('Error al generar la planilla Excel.');
    }
  };

  // Exportación a PDF
  const exportarPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 18, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE SISTEMA DE VENTAS', 14, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Emitido: ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        196,
        12,
        { align: 'right' }
      );

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen de la Consulta', 14, 26);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Filtro Vendedor: ${vendedorSeleccionado || 'Todos'}`, 14, 32);
      doc.text(
        `Filtro Período: ${
          mesSeleccionado
            ? opcionesMeses.find((m) => m.valor === mesSeleccionado)?.etiqueta || mesSeleccionado
            : 'Todos los registros'
        }`,
        14,
        37
      );

      doc.setFillColor(243, 244, 246);
      doc.roundedRect(130, 23, 66, 18, 2, 2, 'F');

      doc.setTextColor(30, 58, 138);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL INGRESOS VÁLIDOS', 133, 29);

      doc.setFontSize(12);
      doc.text(`$${totalMontoFiltrado.toLocaleString('es-CL')}`, 133, 36);

      const columnas = ['N° Pedido', 'Fecha', 'Cliente', 'Vendedor', 'Ítems', 'Total', 'Estado'];
      const filas = ventasFiltradas.map((v) => [
        `#${v.id}`,
        new Date(v.fechaPedido).toLocaleDateString('es-CL'),
        v.clienteNombre || 'Sin nombre',
        v.vendedorNombre || 'N/A',
        v.cantidadProductos || 0,
        `$${(v.total || 0).toLocaleString('es-CL')}`,
        v.estado || 'N/A'
      ]);

      autoTable(doc, {
        head: [columnas],
        body: filas,
        startY: 45,
        theme: 'striped',
        styles: { fontSize: 8.5, cellPadding: 2.5, font: 'helvetica' },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', halign: 'left' },
        columnStyles: {
          0: { fontStyle: 'bold', width: 22 },
          1: { width: 24 },
          2: { width: 48 },
          3: { width: 35 },
          4: { halign: 'center', width: 15 },
          5: { halign: 'right', fontStyle: 'bold', width: 26 },
          6: { halign: 'center', width: 22 }
        },
        didDrawPage: (data) => {
          const totalPaginasPDF = doc.internal.getNumberOfPages();
          const altoPagina = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();

          doc.setFontSize(8);
          doc.setTextColor(156, 163, 175);
          doc.setFont('helvetica', 'normal');
          doc.setDrawColor(229, 231, 235);
          doc.line(14, altoPagina - 12, 196, altoPagina - 12);

          doc.text(`Página ${data.pageNumber} de ${totalPaginasPDF}`, 196, altoPagina - 7, { align: 'right' });
          doc.text('Documento generado automáticamente por el Sistema de Gestión.', 14, altoPagina - 7);
        }
      });

      const fechaNombre = new Date().toISOString().slice(0, 10);
      doc.save(`Reporte_Ventas_${fechaNombre}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el reporte en PDF.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {esAdmin ? 'Gestión General de Ventas' : 'Mis Ventas Realizadas'}
          </h2>
          <p className="text-sm text-gray-500">
            {esAdmin
              ? 'Panel de administración global'
              : `Vendedor en sesión: ${usuarioSesion?.usuario || usuarioSesion?.nombre || 'Usuario'}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportarExcel}
            className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition font-medium text-xs flex items-center gap-1 shadow-sm"
          >
            📊 Exportar Excel
          </button>
          <button
            onClick={exportarPDF}
            className="px-3 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition font-medium text-xs flex items-center gap-1 shadow-sm"
          >
            🖨️ Imprimir PDF
          </button>
          <button
            onClick={cargarVentas}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium text-xs shadow-sm"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* FILTROS Y TARJETA DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row items-center gap-4">
          {/* Filtro Vendedor (Solo para administradores) */}
          {esAdmin && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="filtroVendedor" className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                Vendedor:
              </label>
              <select
                id="filtroVendedor"
                value={vendedorSeleccionado}
                onChange={(e) => {
                  setVendedorSeleccionado(e.target.value);
                  setPaginaActual(1);
                }}
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los vendedores</option>
                {usuarios.map((u) => {
                  const nombre = u.usuario || u.nombreUsuario || u.nombre;
                  return (
                    <option key={u.id || u.idUsuario} value={nombre}>
                      {nombre}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Filtro por Mes */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="filtroMes" className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Mes:
            </label>
            <select
              id="filtroMes"
              value={mesSeleccionado}
              onChange={(e) => {
                setMesSeleccionado(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los meses</option>
              {opcionesMeses.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </option>
              ))}
            </select>
          </div>

          {(vendedorSeleccionado || mesSeleccionado) && (
            <button
              onClick={() => {
                setVendedorSeleccionado('');
                setMesSeleccionado('');
                setPaginaActual(1);
              }}
              className="text-xs text-red-600 hover:text-red-800 font-semibold underline whitespace-nowrap ml-auto sm:ml-0"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Tarjeta con total acumulado */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-right">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Ingresos Reales Filtrados
          </span>
          <p className="text-2xl font-black text-blue-900">${totalMontoFiltrado.toLocaleString('es-CL')}</p>
          <span className="text-xs text-gray-500">
            {ventasFiltradas.filter((v) => esVentaValida(v.estado)).length} ventas concretadas
          </span>
        </div>
      </div>

      {/* GRÁFICO RESUMEN */}
      {!cargando && !error && datosGraficoMensual.length > 0 && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Total de Ventas por Mes {vendedorSeleccionado ? `(${vendedorSeleccionado})` : ''}
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGraficoMensual} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(val) => `$${val.toLocaleString('es-CL')}`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString('es-CL')}`, 'Monto Total']}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="Total" fill="#2563eb" radius={[4, 4, 0, 0]} name="Ventas ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TABLA DE RESULTADOS */}
      {cargando ? (
        <p className="text-center py-8 text-gray-500">Cargando registros de ventas...</p>
      ) : error ? (
        <p className="text-center py-8 text-red-600 font-medium">{error}</p>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">N° Pedido</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
                  {esAdmin && <th className="px-4 py-3 text-left font-semibold text-gray-700">Vendedor</th>}
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Ítems</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {ventasPaginadas.length === 0 ? (
                  <tr>
                    <td colSpan={esAdmin ? 7 : 6} className="text-center py-8 text-gray-500">
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  ventasPaginadas.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-bold text-gray-900">#{v.id}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(v.fechaPedido).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{v.clienteNombre}</td>
                      {esAdmin && (
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                            {v.vendedorNombre || 'N/A'}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center text-gray-600">{v.cantidadProductos}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        ${v.total?.toLocaleString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            v.estado === 'Procesado' || v.estado === 'Completado'
                              ? 'bg-green-100 text-green-800'
                              : v.estado === 'Pendiente'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {v.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* CONTROLES DE PAGINACIÓN */}
          {ventasFiltradas.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
              <span className="text-xs text-gray-600">
                Mostrando <span className="font-semibold">{indiceInicio + 1}</span> a{' '}
                <span className="font-semibold">
                  {Math.min(indiceInicio + elementosPorPagina, ventasFiltradas.length)}
                </span>{' '}
                de <span className="font-semibold">{ventasFiltradas.length}</span> ventas
              </span>

              <div className="inline-flex items-center space-x-1">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
                  Página {paginaActual} de {totalPaginas}
                </span>

                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VentasList;