import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

type TipoEquipo = 'Impresora' | 'Escaner' | 'PC Todo en Uno' | 'Laptop' | 'PC de Mesa';

interface RegistroInventario {
  id: number;
  tipo: TipoEquipo;
  marca: string;
  modelo: string;
  serial: string;
  ubicacion: string;
  estado: 'Activo' | 'En reparacion' | 'Baja';
  equipoUsuario: string;
  equipoContrasena: string;
}

type DatosEquipoBase = Omit<RegistroInventario, 'id' | 'equipoUsuario' | 'equipoContrasena'>;

interface AlertaEquipo {
  id: number;
  equipoId: number;
  reportadoPor: string;
  descripcion: string;
  fecha: string;
  estado: 'Abierta' | 'Resuelta';
  fechaResolucion?: string;
  resueltaPor?: string;
  motivoResolucion?: string;
  solucionado?: boolean;
}

type RolUsuario = 'admin' | 'soporte' | 'usuario';
type VistaPrincipal = 'equipos' | 'usuarios' | 'alertas';
interface UsuarioSistema {
  usuario: string;
  contrasena: string;
  nombre: string;
  rol: RolUsuario;
  editable?: boolean;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiBaseUrl = 'http://localhost/inventario-app/api';
  private readonly alertasStorageKey = 'inventario_alertas_local';
  private readonly sessionStorageKey = 'inventario_sesion_local';
  private readonly usuariosStorageKey = 'inventario_usuarios_local';
  private readonly contrasenaUniversalEquipo = 'Equipo2026';
  private readonly tiposValidos: TipoEquipo[] = [
    'Impresora',
    'Escaner',
    'PC Todo en Uno',
    'Laptop',
    'PC de Mesa'
  ];
  private readonly estadosValidos: Array<'Activo' | 'En reparacion' | 'Baja'> = [
    'Activo',
    'En reparacion',
    'Baja'
  ];
  private readonly tipoAlias: Record<string, TipoEquipo> = {
    impresora: 'Impresora',
    escaner: 'Escaner',
    scanner: 'Escaner',
    'pc todo en uno': 'PC Todo en Uno',
    allinone: 'PC Todo en Uno',
    laptop: 'Laptop',
    portatil: 'Laptop',
    notebook: 'Laptop',
    'pc de mesa': 'PC de Mesa',
    escritorio: 'PC de Mesa',
    'pc escritorio': 'PC de Mesa',
    servidor: 'PC de Mesa'
  };
  private readonly estadoAlias: Record<string, 'Activo' | 'En reparacion' | 'Baja'> = {
    activo: 'Activo',
    inactivo: 'Baja',
    baja: 'Baja',
    'en reparacion': 'En reparacion',
    reparacion: 'En reparacion',
    'en mantenimiento': 'En reparacion',
    mantenimiento: 'En reparacion'
  };

  tiposEquipo: TipoEquipo[] = ['Impresora', 'Escaner', 'PC Todo en Uno', 'Laptop', 'PC de Mesa'];
  filtroTipo: 'Todos' | TipoEquipo = 'Todos';
  filtroExportacionTipo: 'Todos' | TipoEquipo = 'Todos';
  filtroExportacionUbicacion = 'Todas';
  filtroExportacionMarca = 'Todas';
  filtroExportacionEstado: 'Todos' | 'Activo' | 'En reparacion' | 'Baja' = 'Todos';
  filtroBusquedaEquipos = '';
  vistaActual: VistaPrincipal = 'equipos';
  mostrarOpcionesExportacion = false;
  mensajeImportacion = '';
  tipoMensajeImportacion: 'ok' | 'warning' | '' = '';
  importacionEnProgreso = false;
  importacionTotal = 0;
  importacionProcesados = 0;
  importacionExitosos = 0;
  importacionFallidos = 0;
  detallesImportacionFallida: string[] = [];
  cancelacionImportacionSolicitada = false;
  private importacionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  mensajePortapapeles = '';
  tipoMensajePortapapeles: 'ok' | 'warning' | '' = '';
  private portapapelesTimeoutId: ReturnType<typeof setTimeout> | null = null;
  mensajeAlerta = '';
  tipoMensajeAlerta: 'ok' | 'warning' | '' = '';
  private alertaTimeoutId: ReturnType<typeof setTimeout> | null = null;
  mensajeConexionApi = 'Verificando conexion con backend...';
  tipoMensajeConexionApi: 'ok' | 'warning' | '' = '';
  private conexionApiTimeoutId: ReturnType<typeof setTimeout> | null = null;
  sesionActiva = false;
  usuarioActual = '';
  rolActual: RolUsuario | '' = '';
  equipoIdEnSesion: number | null = null;
  credenciales = { usuario: '', contrasena: '' };
  mensajeUsuarios = '';
  tipoMensajeUsuarios: 'ok' | 'warning' | '' = '';
  mostrarModalEdicionUsuario = false;
  usuarioEnEdicionOriginal = '';
  usuarioEdicion = {
    nombre: '',
    usuario: '',
    contrasena: '',
    rol: 'usuario' as 'soporte' | 'usuario'
  };

  usuariosPermitidos: UsuarioSistema[] = [
    { usuario: 'admin', contrasena: 'admin123', nombre: 'Administrador', rol: 'admin', editable: false },
    { usuario: 'usuario1', contrasena: 'usuario123', nombre: 'Usuario General', rol: 'usuario', editable: true }
  ];
  nuevoUsuario: UsuarioSistema = {
    usuario: '',
    contrasena: '',
    nombre: '',
    rol: 'usuario'
  };

  nuevoRegistro: DatosEquipoBase = {
    tipo: 'Impresora',
    marca: '',
    modelo: '',
    serial: '',
    ubicacion: '',
    estado: 'Activo'
  };

  inventario: RegistroInventario[] = [];
  mostrarModalEdicionEquipo = false;
  equipoEnEdicionId: number | null = null;
  equipoEdicion: DatosEquipoBase = {
    tipo: 'Impresora',
    marca: '',
    modelo: '',
    serial: '',
    ubicacion: '',
    estado: 'Activo'
  };

  alertas: AlertaEquipo[] = [];
  nuevaAlerta = {
    equipoId: 0,
    descripcion: ''
  };
  mostrarModalResolverAlerta = false;
  alertaEnResolucionId: number | null = null;
  resolucionAlerta = {
    motivo: '',
    solucionado: '' as '' | 'si' | 'no'
  };
  historialFiltroEquipoId: number | 'Todos' = 'Todos';
  historialFiltroResultado: 'Todos' | 'Corregida' | 'No corregida' = 'Todos';
  historialBusqueda = '';
  mostrarModalEditarHistorial = false;
  alertaEnEdicionHistorialId: number | null = null;
  historialEdicion = {
    motivo: '',
    solucionado: '' as '' | 'si' | 'no'
  };

  constructor() {
    this.cargarUsuariosLocal();
    this.cargarAlertasLocal();
    this.cargarSesionLocal();
  }

  async ngOnInit(): Promise<void> {
    const apiDisponible = await this.verificarConexionApi();
    if (!apiDisponible) {
      this.mostrarMensajeConexionApi(
        'No hay conexion con backend/API. Verifica Apache, MySQL y la ruta http://localhost/inventario-app/api.',
        'warning',
        5000
      );
      return;
    }
    this.mostrarMensajeConexionApi('Conexion con backend/API verificada.', 'ok', 3000);
    await this.cargarInventarioDesdeApi();
  }

  get totalEquipos(): number {
    return this.equiposFiltrados.length;
  }

  get equiposFiltrados(): RegistroInventario[] {
    const termino = this.filtroBusquedaEquipos.trim().toLowerCase();
    return this.inventario.filter((equipo) => {
      const coincideTipo =
        this.filtroExportacionTipo === 'Todos' || equipo.tipo === this.filtroExportacionTipo;
      const coincideUbicacion =
        this.filtroExportacionUbicacion === 'Todas' ||
        equipo.ubicacion === this.filtroExportacionUbicacion;
      const coincideMarca =
        this.filtroExportacionMarca === 'Todas' || equipo.marca === this.filtroExportacionMarca;
      const coincideEstado =
        this.filtroExportacionEstado === 'Todos' || equipo.estado === this.filtroExportacionEstado;
      const textoBase = [
        equipo.tipo,
        equipo.marca,
        equipo.modelo,
        equipo.serial,
        equipo.ubicacion,
        equipo.estado
      ]
        .join(' ')
        .toLowerCase();
      const coincideBusqueda = !termino || textoBase.includes(termino);
      return coincideTipo && coincideUbicacion && coincideMarca && coincideEstado && coincideBusqueda;
    });
  }

  get ubicacionesDisponibles(): string[] {
    return [...new Set(this.inventario.map((equipo) => equipo.ubicacion).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }

  get marcasDisponibles(): string[] {
    return [...new Set(this.inventario.map((equipo) => equipo.marca).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }

  get alertasAbiertas(): AlertaEquipo[] {
    return this.alertas.filter((alerta) => alerta.estado === 'Abierta');
  }

  get alertasAbiertasVisibles(): AlertaEquipo[] {
    if (this.puedeGestionarAlertas) {
      return this.alertasAbiertas;
    }

    return this.alertasAbiertas.filter((alerta) => alerta.reportadoPor === this.usuarioActual);
  }

  get alertasConEquipo(): Array<AlertaEquipo & { equipo: RegistroInventario | undefined }> {
    return this.alertasAbiertasVisibles.map((alerta) => ({
      ...alerta,
      equipo: this.inventario.find((equipo) => equipo.id === alerta.equipoId)
    }));
  }

  get alertasResueltasVisibles(): AlertaEquipo[] {
    const resueltas = this.alertas.filter((alerta) => alerta.estado === 'Resuelta');
    if (this.puedeGestionarAlertas) {
      return resueltas;
    }
    return resueltas.filter((alerta) => alerta.reportadoPor === this.usuarioActual);
  }

  get historialAlertasConEquipo(): Array<AlertaEquipo & { equipo: RegistroInventario | undefined }> {
    return this.alertasResueltasVisibles.map((alerta) => ({
      ...alerta,
      equipo: this.inventario.find((equipo) => equipo.id === alerta.equipoId)
    }));
  }

  get historialEquiposDisponibles(): Array<{ id: number; etiqueta: string }> {
    const mapa = new Map<number, string>();
    for (const alerta of this.historialAlertasConEquipo) {
      if (!alerta.equipo) {
        continue;
      }
      mapa.set(
        alerta.equipo.id,
        `${alerta.equipo.tipo} - ${alerta.equipo.marca} ${alerta.equipo.modelo} (${alerta.equipo.serial})`
      );
    }
    return Array.from(mapa.entries())
      .map(([id, etiqueta]) => ({ id, etiqueta }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
  }

  get historialAlertasFiltrado(): Array<AlertaEquipo & { equipo: RegistroInventario | undefined }> {
    const termino = this.historialBusqueda.trim().toLowerCase();
    return this.historialAlertasConEquipo.filter((alerta) => {
      const coincideEquipo =
        this.historialFiltroEquipoId === 'Todos' || alerta.equipoId === this.historialFiltroEquipoId;
      const resultado = alerta.solucionado ? 'Corregida' : 'No corregida';
      const coincideResultado =
        this.historialFiltroResultado === 'Todos' || this.historialFiltroResultado === resultado;
      const textoBase = [
        alerta.descripcion,
        alerta.reportadoPor,
        alerta.resueltaPor ?? '',
        alerta.motivoResolucion ?? '',
        alerta.equipo?.tipo ?? '',
        alerta.equipo?.marca ?? '',
        alerta.equipo?.modelo ?? '',
        alerta.equipo?.serial ?? '',
        alerta.equipo?.ubicacion ?? ''
      ]
        .join(' ')
        .toLowerCase();
      const coincideBusqueda = !termino || textoBase.includes(termino);
      return coincideEquipo && coincideResultado && coincideBusqueda;
    });
  }

  get progresoImportacionPorcentaje(): number {
    if (!this.importacionTotal) {
      return 0;
    }
    return Math.round((this.importacionProcesados / this.importacionTotal) * 100);
  }

  get esAdmin(): boolean {
    return this.rolActual === 'admin';
  }

  get esSoporte(): boolean {
    return this.rolActual === 'soporte';
  }

  get puedeVerInventario(): boolean {
    return this.esAdmin || this.esSoporte;
  }

  get puedeGestionarUsuarios(): boolean {
    return this.esAdmin;
  }

  get puedeImportarExportar(): boolean {
    return this.esAdmin;
  }

  get puedeGestionarAlertas(): boolean {
    return this.esAdmin || this.esSoporte;
  }

  get etiquetaRolActual(): string {
    if (this.rolActual === 'admin') {
      return 'Admin';
    }
    if (this.rolActual === 'soporte') {
      return 'Soporte';
    }
    return 'Usuario';
  }

  get equiposParaReportarAlerta(): RegistroInventario[] {
    if (this.esAdmin) {
      return this.inventario;
    }
    if (this.equipoIdEnSesion !== null) {
      return this.inventario.filter((e) => e.id === this.equipoIdEnSesion);
    }
    return this.inventario;
  }

  iniciarSesion(): void {
    const usuario = this.credenciales.usuario.trim();
    const contrasena = this.credenciales.contrasena.trim();

    const usuarioValido = this.usuariosPermitidos.find(
      (u) => u.usuario === usuario && u.contrasena === contrasena
    );

    if (usuarioValido) {
      this.sesionActiva = true;
      this.usuarioActual = usuarioValido.nombre;
      this.rolActual = usuarioValido.rol;
      this.equipoIdEnSesion = null;
      this.vistaActual = this.esAdmin || this.esSoporte ? 'equipos' : 'alertas';
      this.guardarSesionLocal();
      this.credenciales = { usuario: '', contrasena: '' };
      this.mostrarMensajeAlerta(
        `Bienvenido ${this.usuarioActual}. Rol: ${this.etiquetaRolActual}.`,
        'ok'
      );
      return;
    }

    const usuarioNorm = usuario.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const equipoPorCredencial = this.inventario.find((eq) => {
      const uEq = (eq.equipoUsuario || eq.serial || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
      const passEq = (eq.equipoContrasena || this.contrasenaUniversalEquipo).trim();
      const passOk =
        contrasena === passEq || contrasena.toLowerCase() === passEq.toLowerCase();
      return uEq && usuarioNorm === uEq && passOk;
    });

    if (equipoPorCredencial) {
      this.sesionActiva = true;
      this.usuarioActual = `${equipoPorCredencial.tipo} (${equipoPorCredencial.serial})`;
      this.rolActual = 'usuario';
      this.equipoIdEnSesion = equipoPorCredencial.id;
      this.nuevaAlerta.equipoId = equipoPorCredencial.id;
      this.vistaActual = 'alertas';
      this.guardarSesionLocal();
      this.credenciales = { usuario: '', contrasena: '' };
      this.mostrarMensajeAlerta(
        `Bienvenido. Entraste con la cuenta del equipo ${equipoPorCredencial.serial}.`,
        'ok'
      );
      return;
    }

    this.mostrarMensajeAlerta('Usuario o contrasena invalidos.', 'warning');
  }

  cerrarSesion(): void {
    this.sesionActiva = false;
    this.usuarioActual = '';
    this.rolActual = '';
    this.equipoIdEnSesion = null;
    this.nuevaAlerta.equipoId = 0;
    localStorage.removeItem(this.sessionStorageKey);
    this.mostrarMensajeAlerta('Sesion cerrada.', 'ok');
  }

  crearUsuario(): void {
    if (!this.esAdmin) {
      return;
    }
    const usuario = this.nuevoUsuario.usuario.trim().toLowerCase();
    const contrasena = this.nuevoUsuario.contrasena.trim();
    const nombre = this.nuevoUsuario.nombre.trim();

    if (!usuario || !contrasena || !nombre) {
      this.mostrarMensajeUsuarios('Completa nombre, usuario y contrasena.', 'warning');
      return;
    }
    if (!/^[a-z0-9._-]{4,20}$/.test(usuario)) {
      this.mostrarMensajeUsuarios(
        'El usuario debe tener 4-20 caracteres (letras, numeros, punto, guion o guion bajo).',
        'warning'
      );
      return;
    }
    if (contrasena.length < 6) {
      this.mostrarMensajeUsuarios('La contrasena debe tener minimo 6 caracteres.', 'warning');
      return;
    }
    if (this.usuariosPermitidos.some((u) => u.usuario.toLowerCase() === usuario)) {
      this.mostrarMensajeUsuarios('Ese usuario ya existe. Usa otro nombre de usuario.', 'warning');
      return;
    }

    this.usuariosPermitidos = [
      ...this.usuariosPermitidos,
      {
        usuario,
        contrasena,
        nombre,
        rol: this.nuevoUsuario.rol,
        editable: true
      }
    ];
    this.guardarUsuariosLocal();
    this.nuevoUsuario = { usuario: '', contrasena: '', nombre: '', rol: 'usuario' };
    this.mostrarMensajeUsuarios('Usuario creado correctamente.', 'ok');
  }

  eliminarUsuario(usuario: string): void {
    if (!this.esAdmin) {
      return;
    }
    const objetivo = this.usuariosPermitidos.find((u) => u.usuario === usuario);
    if (!objetivo) {
      return;
    }
    if (!objetivo.editable && objetivo.rol === 'admin') {
      this.mostrarMensajeUsuarios('Este usuario base no se puede eliminar.', 'warning');
      return;
    }
    this.usuariosPermitidos = this.usuariosPermitidos.filter((u) => u.usuario !== usuario);
    this.guardarUsuariosLocal();
    this.mostrarMensajeUsuarios(`Usuario ${usuario} eliminado.`, 'ok');
  }

  abrirModalEditarUsuario(usuario: string): void {
    if (!this.esAdmin) {
      return;
    }
    const objetivo = this.usuariosPermitidos.find((u) => u.usuario === usuario);
    if (!objetivo || !objetivo.editable) {
      this.mostrarMensajeUsuarios('Este usuario base no se puede editar.', 'warning');
      return;
    }
    this.usuarioEnEdicionOriginal = objetivo.usuario;
    this.usuarioEdicion = {
      nombre: objetivo.nombre,
      usuario: objetivo.usuario,
      contrasena: objetivo.contrasena,
      rol: objetivo.rol === 'soporte' ? 'soporte' : 'usuario'
    };
    this.mostrarModalEdicionUsuario = true;
  }

  cerrarModalEditarUsuario(): void {
    this.mostrarModalEdicionUsuario = false;
    this.usuarioEnEdicionOriginal = '';
    this.usuarioEdicion = {
      nombre: '',
      usuario: '',
      contrasena: '',
      rol: 'usuario'
    };
  }

  guardarEdicionUsuario(): void {
    if (!this.esAdmin) {
      return;
    }
    const nombre = this.usuarioEdicion.nombre.trim();
    const usuario = this.usuarioEdicion.usuario.trim().toLowerCase();
    const contrasena = this.usuarioEdicion.contrasena.trim();
    const rol = this.usuarioEdicion.rol;

    if (!nombre || !usuario || !contrasena) {
      this.mostrarMensajeUsuarios('Completa nombre, usuario, contrasena y rol.', 'warning');
      return;
    }
    if (!/^[a-z0-9._-]{4,20}$/.test(usuario)) {
      this.mostrarMensajeUsuarios(
        'El usuario debe tener 4-20 caracteres (letras, numeros, punto, guion o guion bajo).',
        'warning'
      );
      return;
    }
    if (contrasena.length < 6) {
      this.mostrarMensajeUsuarios('La contrasena debe tener minimo 6 caracteres.', 'warning');
      return;
    }
    if (rol !== 'soporte' && rol !== 'usuario') {
      this.mostrarMensajeUsuarios('Solo se permite autorizar roles Soporte o Usuario.', 'warning');
      return;
    }
    const existeOtroUsuario = this.usuariosPermitidos.some(
      (u) =>
        u.usuario.toLowerCase() === usuario &&
        u.usuario.toLowerCase() !== this.usuarioEnEdicionOriginal.toLowerCase()
    );
    if (existeOtroUsuario) {
      this.mostrarMensajeUsuarios('Ese usuario ya existe. Usa otro nombre de usuario.', 'warning');
      return;
    }

    this.usuariosPermitidos = this.usuariosPermitidos.map((u) => {
      if (u.usuario !== this.usuarioEnEdicionOriginal) {
        return u;
      }
      return {
        ...u,
        nombre,
        usuario,
        contrasena,
        rol
      };
    });
    this.guardarUsuariosLocal();
    this.mostrarMensajeUsuarios(`Usuario ${usuario} actualizado.`, 'ok');
    this.cerrarModalEditarUsuario();
  }

  async agregarEquipo(): Promise<void> {
    if (!this.esAdmin) {
      return;
    }
    const registroLimpio = {
      tipo: this.nuevoRegistro.tipo,
      marca: this.nuevoRegistro.marca.trim(),
      modelo: this.nuevoRegistro.modelo.trim(),
      serial: this.nuevoRegistro.serial.trim(),
      ubicacion: this.nuevoRegistro.ubicacion.trim(),
      estado: this.nuevoRegistro.estado
    };

    if (
      !registroLimpio.marca ||
      !registroLimpio.modelo ||
      !registroLimpio.serial ||
      !registroLimpio.ubicacion
    ) {
      return;
    }

    const serialUnico = this.generarSerialUnico(
      registroLimpio.serial,
      new Set(this.inventario.map((equipo) => equipo.serial))
    );
    const guardado = await this.crearEquipoEnApi({
      ...registroLimpio,
      serial: serialUnico
    });
    if (!guardado) {
      this.mostrarMensajeAlerta('No se pudo guardar el equipo en la base de datos.', 'warning');
      return;
    }
    this.inventario.unshift(guardado);
    this.cdr.detectChanges();

    this.nuevoRegistro = {
      tipo: this.nuevoRegistro.tipo,
      marca: '',
      modelo: '',
      serial: '',
      ubicacion: '',
      estado: 'Activo'
    };
    this.cdr.detectChanges();
  }

  async eliminarEquipo(id: number): Promise<void> {
    if (!this.esAdmin) {
      return;
    }
    const eliminado = await this.eliminarEquipoEnApi(id);
    if (!eliminado) {
      this.mostrarMensajeAlerta('No se pudo eliminar el equipo en la base de datos.', 'warning');
      return;
    }
    this.inventario = this.inventario.filter((equipo) => equipo.id !== id);
    this.alertas = this.alertas.filter((alerta) => alerta.equipoId !== id);
    this.guardarAlertasLocal();
  }

  abrirModalEditarEquipo(equipo: RegistroInventario): void {
    if (!this.esAdmin) {
      return;
    }
    this.equipoEnEdicionId = equipo.id;
    this.equipoEdicion = {
      tipo: equipo.tipo,
      marca: equipo.marca,
      modelo: equipo.modelo,
      serial: equipo.serial,
      ubicacion: equipo.ubicacion,
      estado: equipo.estado
    };
    this.mostrarModalEdicionEquipo = true;
  }

  cerrarModalEditarEquipo(): void {
    this.mostrarModalEdicionEquipo = false;
    this.equipoEnEdicionId = null;
    this.equipoEdicion = {
      tipo: 'Impresora',
      marca: '',
      modelo: '',
      serial: '',
      ubicacion: '',
      estado: 'Activo'
    };
  }

  async guardarEdicionEquipo(): Promise<void> {
    if (!this.esAdmin || this.equipoEnEdicionId === null) {
      return;
    }

    const registroLimpio = {
      tipo: this.equipoEdicion.tipo,
      marca: this.equipoEdicion.marca.trim(),
      modelo: this.equipoEdicion.modelo.trim(),
      serial: this.equipoEdicion.serial.trim(),
      ubicacion: this.equipoEdicion.ubicacion.trim(),
      estado: this.equipoEdicion.estado
    };
    if (
      !registroLimpio.marca ||
      !registroLimpio.modelo ||
      !registroLimpio.serial ||
      !registroLimpio.ubicacion
    ) {
      this.mostrarMensajeAlerta('Completa marca, modelo, serial y ubicacion para editar.', 'warning');
      return;
    }

    const actualizado = await this.actualizarEquipoEnApi(this.equipoEnEdicionId, registroLimpio);
    if (!actualizado) {
      this.mostrarMensajeAlerta('No se pudo actualizar el equipo en la base de datos.', 'warning');
      return;
    }

    this.inventario = this.inventario.map((equipo) =>
      equipo.id === actualizado.id ? { ...equipo, ...actualizado } : equipo
    );
    this.mostrarMensajeAlerta('Equipo actualizado correctamente.', 'ok');
    this.cerrarModalEditarEquipo();
  }

  async copiarCredencialesEquipo(equipo: RegistroInventario): Promise<void> {
    const texto = `Usuario: ${equipo.equipoUsuario}\nContrasena: ${equipo.equipoContrasena}`;
    try {
      await navigator.clipboard.writeText(texto);
      this.mostrarMensajePortapapeles('Credenciales copiadas al portapapeles.');
    } catch {
      this.copiarPortapapelesFallback(texto);
    }
  }

  private copiarPortapapelesFallback(texto: string): void {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.mostrarMensajePortapapeles('Credenciales copiadas al portapapeles.');
    } catch {
      this.mostrarMensajePortapapeles('No se pudo copiar. Copia manualmente.', 'warning');
    }
    document.body.removeChild(ta);
  }

  private mostrarMensajePortapapeles(mensaje: string, tipo: 'ok' | 'warning' = 'ok'): void {
    if (this.portapapelesTimeoutId !== null) {
      clearTimeout(this.portapapelesTimeoutId);
    }
    this.mensajePortapapeles = mensaje;
    this.tipoMensajePortapapeles = tipo;
    this.portapapelesTimeoutId = setTimeout(() => {
      this.mensajePortapapeles = '';
      this.tipoMensajePortapapeles = '';
      this.portapapelesTimeoutId = null;
    }, 2500);
  }

  reportarAlerta(): void {
    if (!this.sesionActiva || !this.rolActual) {
      return;
    }
    this.limpiarMensajeAlerta();
    const descripcion = this.nuevaAlerta.descripcion.trim();

    if (!this.nuevaAlerta.equipoId || !descripcion) {
      this.mostrarMensajeAlerta('Selecciona equipo y describe la falla.', 'warning');
      return;
    }

    this.alertas.unshift({
      id: Date.now(),
      equipoId: this.nuevaAlerta.equipoId,
      reportadoPor: this.usuarioActual,
      descripcion,
      fecha: new Date().toLocaleString(),
      estado: 'Abierta'
    });

    this.guardarAlertasLocal();
    this.nuevaAlerta = {
      equipoId: this.equipoIdEnSesion ?? 0,
      descripcion: ''
    };
    this.mostrarMensajeAlerta('Alerta registrada correctamente.', 'ok');
    this.vistaActual = 'alertas';
  }

  abrirModalResolverAlerta(id: number): void {
    if (!this.puedeGestionarAlertas) {
      return;
    }
    this.alertaEnResolucionId = id;
    this.resolucionAlerta = {
      motivo: '',
      solucionado: ''
    };
    this.mostrarModalResolverAlerta = true;
  }

  cerrarModalResolverAlerta(): void {
    this.mostrarModalResolverAlerta = false;
    this.alertaEnResolucionId = null;
    this.resolucionAlerta = {
      motivo: '',
      solucionado: ''
    };
  }

  resolverAlerta(): void {
    if (!this.puedeGestionarAlertas || this.alertaEnResolucionId === null) {
      return;
    }
    const motivo = this.resolucionAlerta.motivo.trim();
    if (!motivo || !this.resolucionAlerta.solucionado) {
      this.mostrarMensajeAlerta(
        'Completa el motivo e indica si la falla se arreglo o no.',
        'warning'
      );
      return;
    }
    const seArreglo = this.resolucionAlerta.solucionado === 'si';
    this.alertas = this.alertas.map((alerta) =>
      alerta.id === this.alertaEnResolucionId
        ? {
            ...alerta,
            estado: 'Resuelta',
            motivoResolucion: motivo,
            solucionado: seArreglo,
            resueltaPor: this.usuarioActual,
            fechaResolucion: new Date().toLocaleString()
          }
        : alerta
    );
    this.guardarAlertasLocal();
    this.mostrarMensajeAlerta(
      `Alerta resuelta (${seArreglo ? 'falla corregida' : 'falla no corregida'}).`,
      'ok'
    );
    this.cerrarModalResolverAlerta();
  }

  abrirModalEditarHistorial(id: number): void {
    if (!this.esAdmin) {
      return;
    }
    const alerta = this.alertas.find((item) => item.id === id && item.estado === 'Resuelta');
    if (!alerta) {
      this.mostrarMensajeAlerta('No se encontro la alerta en historial.', 'warning');
      return;
    }
    this.alertaEnEdicionHistorialId = id;
    this.historialEdicion = {
      motivo: alerta.motivoResolucion ?? '',
      solucionado: alerta.solucionado ? 'si' : 'no'
    };
    this.mostrarModalEditarHistorial = true;
  }

  cerrarModalEditarHistorial(): void {
    this.mostrarModalEditarHistorial = false;
    this.alertaEnEdicionHistorialId = null;
    this.historialEdicion = {
      motivo: '',
      solucionado: ''
    };
  }

  guardarEdicionHistorial(): void {
    if (!this.esAdmin || this.alertaEnEdicionHistorialId === null) {
      return;
    }
    const motivo = this.historialEdicion.motivo.trim();
    const solucionado = this.historialEdicion.solucionado;
    if (!motivo || !solucionado) {
      this.mostrarMensajeAlerta('Completa motivo y resultado para guardar el historial.', 'warning');
      return;
    }
    const seArreglo = solucionado === 'si';
    this.alertas = this.alertas.map((alerta) =>
      alerta.id === this.alertaEnEdicionHistorialId
        ? {
            ...alerta,
            motivoResolucion: motivo,
            solucionado: seArreglo,
            fechaResolucion: alerta.fechaResolucion || new Date().toLocaleString()
          }
        : alerta
    );
    this.guardarAlertasLocal();
    this.mostrarMensajeAlerta('Historial actualizado correctamente.', 'ok');
    this.cerrarModalEditarHistorial();
  }

  eliminarAlertaHistorial(id: number): void {
    if (!this.esAdmin) {
      return;
    }
    const existe = this.alertas.some((alerta) => alerta.id === id && alerta.estado === 'Resuelta');
    if (!existe) {
      this.mostrarMensajeAlerta('No se encontro la alerta en historial.', 'warning');
      return;
    }
    this.alertas = this.alertas.filter((alerta) => alerta.id !== id);
    this.guardarAlertasLocal();
    this.mostrarMensajeAlerta('Registro de historial eliminado.', 'ok');
  }

  async exportarExcel(): Promise<void> {
    if (!this.esAdmin) {
      return;
    }
    const equiposAExportar = this.obtenerEquiposParaExportar();
    if (equiposAExportar.length === 0) {
      this.mostrarMensajeImportacion(
        'No hay equipos para exportar con esos filtros. Cambia Tipo, Ubicacion, Marca o Estado.',
        'warning'
      );
      return;
    }

    const xlsx = await import('xlsx');
    const datos = equiposAExportar.map((equipo) => ({
      Tipo: equipo.tipo,
      Marca: equipo.marca,
      Modelo: equipo.modelo,
      Serial: equipo.serial,
      Ubicacion: equipo.ubicacion,
      Estado: equipo.estado,
      UsuarioEquipo: equipo.equipoUsuario,
      ContrasenaEquipo: equipo.equipoContrasena
    }));

    const hoja = xlsx.utils.json_to_sheet(datos);
    const libro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(libro, hoja, 'Inventario');
    const sufijoTipo =
      this.filtroExportacionTipo === 'Todos'
        ? 'todos'
        : this.filtroExportacionTipo.toLowerCase().replace(/\s+/g, '-');
    const sufijoUbicacion =
      this.filtroExportacionUbicacion === 'Todas'
        ? 'todas'
        : this.filtroExportacionUbicacion.toLowerCase().replace(/\s+/g, '-');
    const sufijoMarca =
      this.filtroExportacionMarca === 'Todas'
        ? 'todas-marcas'
        : this.filtroExportacionMarca.toLowerCase().replace(/\s+/g, '-');
    const sufijoEstado =
      this.filtroExportacionEstado === 'Todos'
        ? 'todos-estados'
        : this.filtroExportacionEstado.toLowerCase().replace(/\s+/g, '-');

    xlsx.writeFile(
      libro,
      `inventario-${sufijoTipo}-${sufijoUbicacion}-${sufijoMarca}-${sufijoEstado}-${this.fechaArchivo()}.xlsx`
    );
    this.mostrarMensajeImportacion(
      `Excel exportado (${equiposAExportar.length} equipos).`,
      'ok'
    );
    this.cerrarModalExportacion();
  }

  abrirModalExportacion(): void {
    this.limpiarFiltrosExportacion();
    this.mostrarOpcionesExportacion = true;
  }

  cerrarModalExportacion(): void {
    this.mostrarOpcionesExportacion = false;
  }

  limpiarFiltrosExportacion(): void {
    this.filtroExportacionTipo = 'Todos';
    this.filtroExportacionUbicacion = 'Todas';
    this.filtroExportacionMarca = 'Todas';
    this.filtroExportacionEstado = 'Todos';
    this.filtroBusquedaEquipos = '';
  }

  async descargarPlantillaExcel(): Promise<void> {
    if (!this.esAdmin) {
      return;
    }
    const xlsx = await import('xlsx');
    const plantilla = [
      {
        Tipo: '',
        Marca: '',
        Modelo: '',
        Serial: '',
        Ubicacion: '',
        Estado: '',
        UsuarioEquipo: '',
        ContrasenaEquipo: ''
      }
    ];
    const hoja = xlsx.utils.json_to_sheet(plantilla);
    const libro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(libro, hoja, 'Plantilla');
    xlsx.writeFile(libro, 'plantilla-inventario-equipos.xlsx');
  }

  async exportarPdf(): Promise<void> {
    if (!this.esAdmin) {
      return;
    }
    const jspdfModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const doc = new jspdfModule.jsPDF();
    doc.setFontSize(14);
    doc.text('Inventario de Equipos', 14, 16);
    doc.setFontSize(10);
    doc.text(`Total de equipos: ${this.inventario.length}`, 14, 22);

    autoTableModule.default(doc, {
      startY: 28,
      head: [[
        'Tipo',
        'Marca',
        'Modelo',
        'Serial',
        'Ubicacion',
        'Usuario equipo',
        'Contrasena equipo',
        'Estado'
      ]],
      body: this.inventario.map((equipo) => [
        equipo.tipo,
        equipo.marca,
        equipo.modelo,
        equipo.serial,
        equipo.ubicacion,
        equipo.equipoUsuario,
        equipo.equipoContrasena,
        equipo.estado
      ]),
      styles: { fontSize: 9 }
    });

    doc.save(`inventario-equipos-${this.fechaArchivo()}.pdf`);
  }

  async exportarPdfFiltrado(): Promise<void> {
    if (!this.esAdmin) {
      return;
    }
    const equiposAExportar = this.obtenerEquiposParaExportar();
    if (equiposAExportar.length === 0) {
      this.mostrarMensajeImportacion(
        'No hay equipos para exportar con esos filtros. Cambia Tipo, Ubicacion, Marca o Estado.',
        'warning'
      );
      return;
    }

    const jspdfModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const doc = new jspdfModule.jsPDF();
    doc.setFontSize(14);
    doc.text('Inventario de Equipos (Filtrado)', 14, 16);
    doc.setFontSize(10);
    doc.text(`Total de equipos: ${equiposAExportar.length}`, 14, 22);

    autoTableModule.default(doc, {
      startY: 28,
      head: [[
        'Tipo',
        'Marca',
        'Modelo',
        'Serial',
        'Ubicacion',
        'Usuario equipo',
        'Contrasena equipo',
        'Estado'
      ]],
      body: equiposAExportar.map((equipo) => [
        equipo.tipo,
        equipo.marca,
        equipo.modelo,
        equipo.serial,
        equipo.ubicacion,
        equipo.equipoUsuario,
        equipo.equipoContrasena,
        equipo.estado
      ]),
      styles: { fontSize: 9 }
    });

    const sufijoTipo =
      this.filtroExportacionTipo === 'Todos'
        ? 'todos'
        : this.filtroExportacionTipo.toLowerCase().replace(/\s+/g, '-');
    const sufijoUbicacion =
      this.filtroExportacionUbicacion === 'Todas'
        ? 'todas'
        : this.filtroExportacionUbicacion.toLowerCase().replace(/\s+/g, '-');
    const sufijoMarca =
      this.filtroExportacionMarca === 'Todas'
        ? 'todas-marcas'
        : this.filtroExportacionMarca.toLowerCase().replace(/\s+/g, '-');
    const sufijoEstado =
      this.filtroExportacionEstado === 'Todos'
        ? 'todos-estados'
        : this.filtroExportacionEstado.toLowerCase().replace(/\s+/g, '-');

    doc.save(
      `inventario-${sufijoTipo}-${sufijoUbicacion}-${sufijoMarca}-${sufijoEstado}-${this.fechaArchivo()}.pdf`
    );
    this.mostrarMensajeImportacion(
      `PDF exportado (${equiposAExportar.length} equipos).`,
      'ok'
    );
    this.cerrarModalExportacion();
  }

  async exportarHistorialExcel(): Promise<void> {
    const historial = this.historialAlertasFiltrado;
    if (historial.length === 0) {
      this.mostrarMensajeAlerta('No hay historial para exportar con esos filtros.', 'warning');
      return;
    }
    const xlsx = await import('xlsx');
    const datos = historial.map((alerta) => ({
      Equipo: `${alerta.equipo?.tipo ?? 'N/A'} - ${alerta.equipo?.marca ?? ''} ${alerta.equipo?.modelo ?? ''}`.trim(),
      Serial: alerta.equipo?.serial ?? 'N/A',
      Ubicacion: alerta.equipo?.ubicacion ?? 'N/A',
      Descripcion: alerta.descripcion,
      ReportadoPor: alerta.reportadoPor,
      ResueltaPor: alerta.resueltaPor ?? 'N/A',
      FechaReporte: alerta.fecha,
      FechaResolucion: alerta.fechaResolucion ?? 'N/A',
      Resultado: alerta.solucionado ? 'Corregida' : 'No corregida',
      MotivoSolucion: alerta.motivoResolucion ?? 'N/A'
    }));
    const hoja = xlsx.utils.json_to_sheet(datos);
    const libro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(libro, hoja, 'Historial');
    xlsx.writeFile(libro, `historial-alertas-${this.fechaArchivo()}.xlsx`);
    this.mostrarMensajeAlerta(`Historial exportado en Excel (${historial.length} registros).`, 'ok');
  }

  async exportarHistorialPdf(): Promise<void> {
    const historial = this.historialAlertasFiltrado;
    if (historial.length === 0) {
      this.mostrarMensajeAlerta('No hay historial para exportar con esos filtros.', 'warning');
      return;
    }
    const jspdfModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    const doc = new jspdfModule.jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Historial de Alertas', 14, 16);
    doc.setFontSize(10);
    doc.text(`Total de registros: ${historial.length}`, 14, 22);
    autoTableModule.default(doc, {
      startY: 28,
      head: [[
        'Equipo',
        'Ubicacion',
        'Descripcion',
        'Reportado por',
        'Resuelta por',
        'Fecha reporte',
        'Fecha resolucion',
        'Resultado'
      ]],
      body: historial.map((alerta) => [
        `${alerta.equipo?.tipo ?? 'N/A'} ${alerta.equipo?.marca ?? ''} ${alerta.equipo?.modelo ?? ''}`.trim(),
        alerta.equipo?.ubicacion ?? 'N/A',
        alerta.descripcion,
        alerta.reportadoPor,
        alerta.resueltaPor ?? 'N/A',
        alerta.fecha,
        alerta.fechaResolucion ?? 'N/A',
        alerta.solucionado ? 'Corregida' : 'No corregida'
      ]),
      styles: { fontSize: 8 }
    });
    doc.save(`historial-alertas-${this.fechaArchivo()}.pdf`);
    this.mostrarMensajeAlerta(`Historial exportado en PDF (${historial.length} registros).`, 'ok');
  }

  async importarExcel(event: Event): Promise<void> {
    if (!this.esAdmin) {
      return;
    }
    if (this.importacionEnProgreso) {
      return;
    }
    this.limpiarMensajeImportacion();
    this.vistaActual = 'equipos';
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];

    if (!archivo) {
      return;
    }

    const xlsx = await import('xlsx');
    const buffer = await archivo.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const nombreHoja = workbook.SheetNames[0];

    if (!nombreHoja) {
      this.mostrarMensajeImportacion('No se encontro una hoja valida en el archivo.', 'warning');
      input.value = '';
      return;
    }

    const hoja = workbook.Sheets[nombreHoja];
    const filas = xlsx.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '' });
    this.importacionEnProgreso = true;
    this.importacionTotal = filas.length;
    this.importacionProcesados = 0;
    this.importacionExitosos = 0;
    this.importacionFallidos = 0;
    this.detallesImportacionFallida = [];
    this.cancelacionImportacionSolicitada = false;
    this.cdr.detectChanges();

    const serialesOcupados = new Set(this.inventario.map((equipo) => equipo.serial));
    const nuevosGuardados: RegistroInventario[] = [];

    for (let i = 0; i < filas.length; i += 1) {
      if (this.cancelacionImportacionSolicitada) {
        break;
      }
      const filaNumero = i + 2;
      const registro = this.mapearFilaARegistro(filas[i]);
      if (!registro) {
        this.importacionFallidos += 1;
        this.detallesImportacionFallida.push(
          `Fila ${filaNumero}: formato invalido (revisa Tipo, Marca, Modelo, Serial, Ubicacion y Estado).`
        );
        this.importacionProcesados += 1;
        continue;
      }

      const serialUnico = this.generarSerialUnico(registro.serial, serialesOcupados);
      serialesOcupados.add(serialUnico);
      const guardado = await this.crearEquipoEnApi({ ...registro, serial: serialUnico });

      if (guardado) {
        this.importacionExitosos += 1;
        nuevosGuardados.push(guardado);
        this.inventario = [guardado, ...this.inventario];
      } else {
        this.importacionFallidos += 1;
        this.detallesImportacionFallida.push(
          `Fila ${filaNumero}: no se pudo guardar en base de datos (serial ${serialUnico}).`
        );
      }

      this.importacionProcesados += 1;
      this.cdr.detectChanges();
    }

    if (this.cancelacionImportacionSolicitada) {
      this.mostrarMensajeImportacion(
        `Importacion cancelada: ${this.importacionExitosos} cargados y ${this.importacionFallidos} omitidos.`,
        'warning'
      );
    } else if (this.importacionExitosos === 0) {
      this.mostrarMensajeImportacion(
        'No se importaron equipos. Verifica columnas (Tipo, Marca, Modelo, Serial, Ubicacion, Estado) y valores permitidos.',
        'warning'
      );
    } else {
      await this.cargarInventarioDesdeApi();
      this.vistaActual = 'equipos';
      this.mostrarMensajeImportacion(
        `Importacion completada: ${this.importacionExitosos} cargados y ${this.importacionFallidos} omitidos.`,
        this.importacionFallidos > 0 ? 'warning' : 'ok'
      );
    }

    this.importacionEnProgreso = false;
    this.cancelacionImportacionSolicitada = false;
    input.value = '';
    this.cdr.detectChanges();
  }

  cancelarImportacion(): void {
    if (!this.importacionEnProgreso) {
      return;
    }
    this.cancelacionImportacionSolicitada = true;
  }

  private mapearFilaARegistro(fila: Record<string, unknown>): DatosEquipoBase | null {
    const tipo = this.normalizarTipo(String(fila['Tipo'] ?? '').trim());
    const marca = String(fila['Marca'] ?? '').trim();
    const modelo = String(fila['Modelo'] ?? '').trim();
    const serial = String(fila['Serial'] ?? '').trim();
    const ubicacion = String(fila['Ubicacion'] ?? '').trim();
    const estado = this.normalizarEstado(String(fila['Estado'] ?? '').trim());

    if (
      !tipo ||
      !marca ||
      !modelo ||
      !serial ||
      !ubicacion ||
      !estado
    ) {
      return null;
    }

    return {
      tipo,
      marca,
      modelo,
      serial,
      ubicacion,
      estado
    };
  }

  private normalizarTipo(valor: string): TipoEquipo | null {
    const clave = this.normalizarTexto(valor);
    if (this.tipoAlias[clave]) {
      return this.tipoAlias[clave];
    }
    const tipoExacto = this.tiposValidos.find((tipo) => this.normalizarTexto(tipo) === clave);
    return tipoExacto ?? null;
  }

  private normalizarEstado(valor: string): 'Activo' | 'En reparacion' | 'Baja' | null {
    const clave = this.normalizarTexto(valor);
    if (this.estadoAlias[clave]) {
      return this.estadoAlias[clave];
    }
    const estadoExacto = this.estadosValidos.find((estado) => this.normalizarTexto(estado) === clave);
    return estadoExacto ?? null;
  }

  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generarCredencialesEquipo(
    serialUnico: string
  ): Pick<RegistroInventario, 'equipoUsuario' | 'equipoContrasena'> {
    return {
      equipoUsuario: serialUnico,
      equipoContrasena: this.contrasenaUniversalEquipo
    };
  }

  private generarSerialUnico(serialBase: string, serialesOcupados: Set<string>): string {
    const base = serialBase.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'EQP';
    let serial = base;
    if (!serialesOcupados.has(serial)) {
      return serial;
    }

    let contador = 1;
    while (serialesOcupados.has(`${base}-${String(contador).padStart(3, '0')}`)) {
      contador += 1;
    }
    return `${base}-${String(contador).padStart(3, '0')}`;
  }

  private normalizarInventarioConCredenciales(inventario: RegistroInventario[]): RegistroInventario[] {
    const serialesUsados = new Set<string>();

    return inventario.map((equipo) => {
      let serial = (equipo.serial || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (!serial || serialesUsados.has(serial)) {
        serial = this.generarSerialUnico(equipo.serial || 'EQP', serialesUsados);
      }
      serialesUsados.add(serial);

      const credenciales = this.generarCredencialesEquipo(serial);
      return {
        ...equipo,
        serial,
        ...credenciales
      };
    });
  }

  private fechaArchivo(): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private obtenerEquiposParaExportar(): RegistroInventario[] {
    const termino = this.filtroBusquedaEquipos.trim().toLowerCase();
    return this.inventario.filter((equipo) => {
      const coincideTipo =
        this.filtroExportacionTipo === 'Todos' || equipo.tipo === this.filtroExportacionTipo;
      const coincideUbicacion =
        this.filtroExportacionUbicacion === 'Todas' ||
        equipo.ubicacion === this.filtroExportacionUbicacion;
      const coincideMarca =
        this.filtroExportacionMarca === 'Todas' || equipo.marca === this.filtroExportacionMarca;
      const coincideEstado =
        this.filtroExportacionEstado === 'Todos' || equipo.estado === this.filtroExportacionEstado;
      const textoBase = [
        equipo.tipo,
        equipo.marca,
        equipo.modelo,
        equipo.serial,
        equipo.ubicacion,
        equipo.estado
      ]
        .join(' ')
        .toLowerCase();
      const coincideBusqueda = !termino || textoBase.includes(termino);
      return coincideTipo && coincideUbicacion && coincideMarca && coincideEstado && coincideBusqueda;
    });
  }

  private mostrarMensajeImportacion(
    mensaje: string,
    tipo: 'ok' | 'warning'
  ): void {
    if (this.importacionTimeoutId !== null) {
      clearTimeout(this.importacionTimeoutId);
    }
    this.mensajeImportacion = mensaje;
    this.tipoMensajeImportacion = tipo;
    this.cdr.detectChanges();
    this.importacionTimeoutId = setTimeout(() => {
      this.limpiarMensajeImportacion();
      this.importacionTimeoutId = null;
      this.cdr.detectChanges();
    }, tipo === 'warning' ? 5000 : 3000);
  }

  private limpiarMensajeImportacion(): void {
    if (this.importacionTimeoutId !== null) {
      clearTimeout(this.importacionTimeoutId);
      this.importacionTimeoutId = null;
    }
    this.mensajeImportacion = '';
    this.tipoMensajeImportacion = '';
  }

  private mostrarMensajeAlerta(mensaje: string, tipo: 'ok' | 'warning'): void {
    if (this.alertaTimeoutId !== null) {
      clearTimeout(this.alertaTimeoutId);
    }
    this.mensajeAlerta = mensaje;
    this.tipoMensajeAlerta = tipo;
    this.cdr.detectChanges();
    this.alertaTimeoutId = setTimeout(() => {
      this.limpiarMensajeAlerta();
      this.alertaTimeoutId = null;
    }, tipo === 'warning' ? 5000 : 3000);
  }

  private mostrarMensajeConexionApi(
    mensaje: string,
    tipo: 'ok' | 'warning',
    duracionMs = 3000
  ): void {
    if (this.conexionApiTimeoutId !== null) {
      clearTimeout(this.conexionApiTimeoutId);
    }
    this.mensajeConexionApi = mensaje;
    this.tipoMensajeConexionApi = tipo;
    this.cdr.detectChanges();
    this.conexionApiTimeoutId = setTimeout(() => {
      this.mensajeConexionApi = '';
      this.tipoMensajeConexionApi = '';
      this.conexionApiTimeoutId = null;
      this.cdr.detectChanges();
    }, duracionMs);
  }

  private mostrarMensajeUsuarios(mensaje: string, tipo: 'ok' | 'warning'): void {
    this.mensajeUsuarios = mensaje;
    this.tipoMensajeUsuarios = tipo;
  }

  private limpiarMensajeAlerta(): void {
    if (this.alertaTimeoutId !== null) {
      clearTimeout(this.alertaTimeoutId);
      this.alertaTimeoutId = null;
    }
    this.mensajeAlerta = '';
    this.tipoMensajeAlerta = '';
  }

  private async verificarConexionApi(): Promise<boolean> {
    try {
      const respuesta = await fetch(`${this.apiBaseUrl}/equipos.php`, {
        method: 'GET',
        cache: 'no-store'
      });
      return respuesta.ok;
    } catch {
      return false;
    }
  }

  private async cargarInventarioDesdeApi(): Promise<void> {
    try {
      const respuesta = await fetch(`${this.apiBaseUrl}/equipos.php?ts=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!respuesta.ok) {
        throw new Error('No se pudo consultar la API.');
      }
      const equipos = (await respuesta.json()) as RegistroInventario[];
      if (Array.isArray(equipos)) {
        this.inventario = this.normalizarInventarioConCredenciales(equipos);
      }
    } catch {
      this.mostrarMensajeAlerta('No se pudo cargar el inventario desde MySQL.', 'warning');
    }
  }

  private async crearEquipoEnApi(equipo: DatosEquipoBase): Promise<RegistroInventario | null> {
    const credenciales = this.generarCredencialesEquipo(equipo.serial);
    try {
      const respuesta = await fetch(`${this.apiBaseUrl}/equipos.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...equipo,
          ...credenciales
        })
      });
      if (!respuesta.ok) {
        return null;
      }
      const creado = (await respuesta.json()) as RegistroInventario;
      return {
        ...creado,
        ...this.generarCredencialesEquipo(creado.serial)
      };
    } catch {
      return null;
    }
  }

  private async eliminarEquipoEnApi(id: number): Promise<boolean> {
    try {
      const respuesta = await fetch(`${this.apiBaseUrl}/equipos.php?id=${id}`, {
        method: 'DELETE'
      });
      return respuesta.ok;
    } catch {
      return false;
    }
  }

  private async actualizarEquipoEnApi(
    id: number,
    equipo: DatosEquipoBase
  ): Promise<RegistroInventario | null> {
    try {
      const respuesta = await fetch(`${this.apiBaseUrl}/equipos.php?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipo)
      });
      if (!respuesta.ok) {
        return null;
      }
      const actualizado = (await respuesta.json()) as RegistroInventario;
      return {
        ...actualizado,
        ...this.generarCredencialesEquipo(actualizado.serial)
      };
    } catch {
      return null;
    }
  }

  private cargarAlertasLocal(): void {
    const datos = localStorage.getItem(this.alertasStorageKey);
    if (!datos) {
      return;
    }

    try {
      const alertasGuardadas = JSON.parse(datos) as AlertaEquipo[];
      if (Array.isArray(alertasGuardadas)) {
        this.alertas = alertasGuardadas;
      }
    } catch {
      localStorage.removeItem(this.alertasStorageKey);
    }
  }

  private guardarAlertasLocal(): void {
    localStorage.setItem(this.alertasStorageKey, JSON.stringify(this.alertas));
  }

  private cargarSesionLocal(): void {
    const datos = localStorage.getItem(this.sessionStorageKey);
    if (!datos) {
      return;
    }

    try {
      const sesion = JSON.parse(datos) as {
        usuarioActual: string;
        rolActual: RolUsuario;
        equipoIdEnSesion?: number | null;
      };
      if (sesion?.usuarioActual && sesion?.rolActual) {
        this.sesionActiva = true;
        this.usuarioActual = sesion.usuarioActual;
        this.rolActual = sesion.rolActual;
        this.equipoIdEnSesion = sesion.equipoIdEnSesion ?? null;
        if (this.equipoIdEnSesion) {
          this.nuevaAlerta.equipoId = this.equipoIdEnSesion;
        }
        this.vistaActual = this.esAdmin || this.esSoporte ? 'equipos' : 'alertas';
      }
    } catch {
      localStorage.removeItem(this.sessionStorageKey);
    }
  }

  private guardarSesionLocal(): void {
    localStorage.setItem(
      this.sessionStorageKey,
      JSON.stringify({
        usuarioActual: this.usuarioActual,
        rolActual: this.rolActual,
        equipoIdEnSesion: this.equipoIdEnSesion
      })
    );
  }

  private cargarUsuariosLocal(): void {
    const datos = localStorage.getItem(this.usuariosStorageKey);
    if (!datos) {
      return;
    }
    try {
      const usuarios = JSON.parse(datos) as UsuarioSistema[];
      if (Array.isArray(usuarios) && usuarios.length > 0) {
        const usuariosSinSoporteBase = usuarios.filter(
          (u) => !(u.usuario === 'soporte' && u.editable === false)
        );
        this.usuariosPermitidos = usuariosSinSoporteBase.map((u) => {
          if (u.usuario === 'usuario1') {
            return { ...u, editable: true };
          }
          return u;
        });
        this.guardarUsuariosLocal();
      }
    } catch {
      localStorage.removeItem(this.usuariosStorageKey);
    }
  }

  private guardarUsuariosLocal(): void {
    localStorage.setItem(this.usuariosStorageKey, JSON.stringify(this.usuariosPermitidos));
  }
}
