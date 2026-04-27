import { Component, OnInit } from '@angular/core';
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
}

type RolUsuario = 'admin' | 'usuario';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly apiBaseUrl = 'http://localhost/inventario-app/api';
  private readonly alertasStorageKey = 'inventario_alertas_local';
  private readonly sessionStorageKey = 'inventario_sesion_local';
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
  vistaActual: 'inventario' | 'alertas' = 'inventario';
  mensajeImportacion = '';
  tipoMensajeImportacion: 'ok' | 'warning' | '' = '';
  importacionEnProgreso = false;
  importacionTotal = 0;
  importacionProcesados = 0;
  importacionExitosos = 0;
  importacionFallidos = 0;
  detallesImportacionFallida: string[] = [];
  mensajePortapapeles = '';
  tipoMensajePortapapeles: 'ok' | 'warning' | '' = '';
  private portapapelesTimeoutId: ReturnType<typeof setTimeout> | null = null;
  mensajeAlerta = '';
  tipoMensajeAlerta: 'ok' | 'warning' | '' = '';
  sesionActiva = false;
  usuarioActual = '';
  rolActual: RolUsuario | '' = '';
  equipoIdEnSesion: number | null = null;
  credenciales = { usuario: '', contrasena: '' };

  usuariosPermitidos = [
    { usuario: 'admin', contrasena: 'admin123', nombre: 'Administrador', rol: 'admin' as RolUsuario },
    { usuario: 'soporte', contrasena: 'soporte123', nombre: 'Soporte', rol: 'admin' as RolUsuario },
    { usuario: 'usuario1', contrasena: 'usuario123', nombre: 'Usuario General', rol: 'usuario' as RolUsuario }
  ];

  nuevoRegistro: DatosEquipoBase = {
    tipo: 'Impresora',
    marca: '',
    modelo: '',
    serial: '',
    ubicacion: '',
    estado: 'Activo'
  };

  inventario: RegistroInventario[] = [];

  alertas: AlertaEquipo[] = [];
  nuevaAlerta = {
    equipoId: 0,
    descripcion: ''
  };

  constructor() {
    this.cargarAlertasLocal();
    this.cargarSesionLocal();
  }

  async ngOnInit(): Promise<void> {
    await this.cargarInventarioDesdeApi();
  }

  get totalEquipos(): number {
    return this.inventario.length;
  }

  get equiposFiltrados(): RegistroInventario[] {
    if (this.filtroTipo === 'Todos') {
      return this.inventario;
    }

    return this.inventario.filter((equipo) => equipo.tipo === this.filtroTipo);
  }

  get alertasAbiertas(): AlertaEquipo[] {
    return this.alertas.filter((alerta) => alerta.estado === 'Abierta');
  }

  get alertasAbiertasVisibles(): AlertaEquipo[] {
    if (this.esAdmin) {
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

  get progresoImportacionPorcentaje(): number {
    if (!this.importacionTotal) {
      return 0;
    }
    return Math.round((this.importacionProcesados / this.importacionTotal) * 100);
  }

  get esAdmin(): boolean {
    return this.rolActual === 'admin';
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
      this.vistaActual = this.esAdmin ? 'inventario' : 'alertas';
      this.guardarSesionLocal();
      this.credenciales = { usuario: '', contrasena: '' };
      this.mostrarMensajeAlerta(
        `Bienvenido ${this.usuarioActual}. Rol: ${this.esAdmin ? 'Administrador' : 'Usuario'}.`,
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

    this.nuevoRegistro = {
      tipo: this.nuevoRegistro.tipo,
      marca: '',
      modelo: '',
      serial: '',
      ubicacion: '',
      estado: 'Activo'
    };
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

  resolverAlerta(id: number): void {
    if (!this.esAdmin) {
      return;
    }
    this.alertas = this.alertas.map((alerta) =>
      alerta.id === id ? { ...alerta, estado: 'Resuelta' } : alerta
    );
    this.guardarAlertasLocal();
    this.mostrarMensajeAlerta('Alerta marcada como resuelta.', 'ok');
  }

  async exportarExcel(): Promise<void> {
    if (!this.esAdmin) {
      return;
    }
    const xlsx = await import('xlsx');
    const datos = this.inventario.map((equipo) => ({
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
    xlsx.writeFile(libro, `inventario-equipos-${this.fechaArchivo()}.xlsx`);
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

  async importarExcel(event: Event): Promise<void> {
    if (!this.esAdmin) {
      return;
    }
    if (this.importacionEnProgreso) {
      return;
    }
    this.limpiarMensajeImportacion();
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

    const serialesOcupados = new Set(this.inventario.map((equipo) => equipo.serial));
    const nuevosGuardados: RegistroInventario[] = [];

    for (let i = 0; i < filas.length; i += 1) {
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
      } else {
        this.importacionFallidos += 1;
        this.detallesImportacionFallida.push(
          `Fila ${filaNumero}: no se pudo guardar en base de datos (serial ${serialUnico}).`
        );
      }

      this.importacionProcesados += 1;
    }

    if (nuevosGuardados.length > 0) {
      this.inventario = [...nuevosGuardados, ...this.inventario];
    }

    if (this.importacionExitosos === 0) {
      this.mostrarMensajeImportacion(
        'No se importaron equipos. Verifica columnas (Tipo, Marca, Modelo, Serial, Ubicacion, Estado) y valores permitidos.',
        'warning'
      );
    } else {
      this.mostrarMensajeImportacion(
        `Importacion completada: ${this.importacionExitosos} cargados y ${this.importacionFallidos} omitidos.`,
        this.importacionFallidos > 0 ? 'warning' : 'ok'
      );
    }

    this.importacionEnProgreso = false;
    input.value = '';
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

  private mostrarMensajeImportacion(
    mensaje: string,
    tipo: 'ok' | 'warning'
  ): void {
    this.mensajeImportacion = mensaje;
    this.tipoMensajeImportacion = tipo;
  }

  private limpiarMensajeImportacion(): void {
    this.mensajeImportacion = '';
    this.tipoMensajeImportacion = '';
  }

  private mostrarMensajeAlerta(mensaje: string, tipo: 'ok' | 'warning'): void {
    this.mensajeAlerta = mensaje;
    this.tipoMensajeAlerta = tipo;
  }

  private limpiarMensajeAlerta(): void {
    this.mensajeAlerta = '';
    this.tipoMensajeAlerta = '';
  }

  private async cargarInventarioDesdeApi(): Promise<void> {
    try {
      const respuesta = await fetch(`${this.apiBaseUrl}/equipos.php`);
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
        this.vistaActual = this.esAdmin ? 'inventario' : 'alertas';
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
}
