<?php

use App\Http\Controllers\AdministradorController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\CursoController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartamentoController;
use App\Http\Controllers\DistritoController;
use App\Http\Controllers\DocenteController;
use App\Http\Controllers\InstitutoController;
use App\Http\Controllers\ModuloFormativoController;
use App\Http\Controllers\PeriodoController;
use App\Http\Controllers\PersonalController;
use App\Http\Controllers\PlanEstudioController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProvinciaController;
use App\Http\Controllers\SemestreController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\PabellonController;
use App\Http\Controllers\AulaController;
use App\Http\Controllers\TurnoController;
use App\Http\Controllers\SeccionController;
use App\Http\Controllers\HorarioController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\EstudianteController;
use App\Http\Controllers\MatriculaController;
use App\Http\Controllers\LogroCursoController;
use App\Http\Controllers\NotasController;
use App\Http\Controllers\ClaseEnVivoController;
use App\Http\Controllers\TareaController;
use App\Http\Controllers\SilaboController;
use App\Http\Controllers\EvaluacionController;
use App\Http\Controllers\Estudiante\EstudianteCursoController;
use App\Http\Controllers\ConvalidacionController;
use App\Http\Controllers\BoletaNotasController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\TipoContratoController;
use App\Http\Controllers\OfertaLaboralController;
use App\Http\Controllers\PanelAnaliticoController;
use App\Http\Controllers\AdmisionController;
use App\Http\Controllers\RequisitoController;
use App\Http\Controllers\TipoPagoController;
use App\Http\Controllers\InscripcionController;
use App\Http\Controllers\InscripcionPublicaController;
use App\Http\Controllers\ResultadoAdmisionController;
use App\Http\Controllers\MatriculaIngresanteController;
use App\Http\Controllers\ReporteMatriculaController;
use App\Http\Controllers\ConceptoController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\PagoPostulanteController;
use App\Http\Controllers\ReporteCajaController;
use App\Http\Controllers\TramiteController;
use App\Http\Controllers\RequisitoTramiteController;
use App\Http\Controllers\SolicitudExternaController;
use App\Http\Controllers\SolicitudTramiteController;
use Inertia\Inertia;
use App\Http\Controllers\Auth\PasswordOtpController;
use App\Http\Controllers\RepositorioCategoriaController;
use App\Http\Controllers\RepositorioAutorController;
use App\Http\Controllers\RepositorioRecursoController;
use App\Http\Controllers\TitulacionModalidadController;
use App\Http\Controllers\TitulacionRequisitoController;
use App\Http\Controllers\TitulacionController;
use App\Http\Controllers\TitulacionSustentacionController;
use App\Http\Controllers\TitulacionRegistroController;
use App\Http\Controllers\PatrimonioCategoriaController;
use App\Http\Controllers\PatrimonioBienController;
use App\Http\Controllers\PatrimonioMovimientoController;
use App\Http\Controllers\PatrimonioMantenimientoController;
use App\Http\Controllers\PatrimonioBajaController;
use App\Http\Controllers\PatrimonioReporteController;
use App\Http\Controllers\MoodleSsoController;
use App\Http\Controllers\SupervisionDocenteController;
use App\Http\Controllers\PlanEstudioSupervisorController;
use App\Http\Controllers\CriterioSubcomponenteController;
use App\Http\Controllers\AsistenciaDocenteController;
use App\Http\Controllers\AuditoriaController;
use App\Http\Controllers\KpiIndicadoresController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AnuncioController;

/*
|--------------------------------------------------------------------------
| Rutas públicas — Solicitud de trámite para externos
|--------------------------------------------------------------------------
| Sin middleware 'auth': cualquier persona puede acceder sin cuenta.
| Agregar dentro de routes/web.php, fuera del grupo autenticado.
*/
 
Route::middleware('guest')->group(function () {
    Route::get('/recuperar-clave', [PasswordOtpController::class, 'showForgotPassword'])->name('password.otp.show');
    Route::post('/recuperar-clave/enviar-codigo', [PasswordOtpController::class, 'sendOtp'])->name('password.otp.send');
    Route::post('/recuperar-clave/validar-codigo', [PasswordOtpController::class, 'verifyOtp'])->name('password.otp.verify');
    Route::post('/recuperar-clave/cambiar-clave', [PasswordOtpController::class, 'resetPassword'])->name('password.otp.reset');
});

Route::prefix('solicitud-externa')->group(function () {
    Route::get('/', [SolicitudExternaController::class, 'create'])
        ->name('solicitud-externa.create');
 
    Route::post('/', [SolicitudExternaController::class, 'store'])
        ->name('solicitud-externa.store');

    // Consultas a RENIEC y SUNAT (DeColecta)
    Route::get('/consultar-dni/{dni}', [SolicitudExternaController::class, 'consultarDni'])->name('solicitud-externa.consultar-dni');
    Route::get('/consultar-ruc/{ruc}', [SolicitudExternaController::class, 'consultarRuc'])->name('solicitud-externa.consultar-ruc');
    
    Route::get('/solicitud-externa/seguimiento/{codigo?}', [SolicitudExternaController::class, 'seguimiento'])
    ->name('solicitud-externa.seguimiento');
 
   
});
 

// Formulario externo de Inscripción
Route::get('inscripcion-online/{admision?}', [InscripcionPublicaController::class, 'create'])->name('inscripcion.publica');
Route::post('inscripcion-online', [InscripcionPublicaController::class, 'store'])->name('inscripcion.publica.store');

// Confirmación / Éxito
Route::get('inscripcion-confirmada', fn () => Inertia::render('Public/InscripcionExito'))->name('inscripcion.exito');

Route::redirect('/', '/login');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware('auth')
    ->name('dashboard');

Route::middleware('auth')->group(function () {

    Route::get('/aula-virtual/ingresar', [MoodleSsoController::class, 'ingresar'])
        ->name('moodle.sso');
    /* Perfil */
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/docente/silabos/obtener', [SilaboController::class, 'obtenerSilabo'])->name('silabos.obtener');
    Route::post('/docente/silabos/guardar', [SilaboController::class, 'guardar'])->name('silabos.guardar');
    Route::get('/docente/silabos/ver/{id}', [SilaboController::class, 'ver'])->name('silabos.ver');
    Route::delete('/docente/silabos/eliminar/{id}', [SilaboController::class, 'eliminar'])->name('silabos.eliminar');

    /* Sesiones */

    Route::post('/docente/cursos/sesiones', [DocenteController::class, 'storeSesion'])->name('cursos.sesiones.store');
    Route::post('/docente/cursos/sesiones/{id}', [DocenteController::class, 'updateSesion'])->name('cursos.sesiones.update'); // Usa POST para soportar multipart file upload en updates
    Route::patch('/docente/cursos/sesiones/{id}/toggle', [DocenteController::class, 'toggleSesion'])->name('cursos.sesiones.toggle');
    Route::delete('/docente/cursos/sesiones/{id}', [DocenteController::class, 'destroySesion'])->name('cursos.sesiones.destroy');
    Route::post('/cursos/sesiones/generar-automatico', [DocenteController::class, 'generarSesionesAutomaticas'])->name('cursos.sesiones.generar-automatico');
    
    // Asistencias
    Route::get('/docente/cursos/asistencias/sesion/{sesionId}', [DocenteController::class, 'getAsistenciasPorSesion'])->name('cursos.asistencias.obtener');
    Route::post('/docente/cursos/asistencias/guardar', [DocenteController::class, 'guardarAsistencia'])->name('cursos.asistencias.guardar');
    Route::get('/docente/cursos/gestionar/asistencias/pdf', [DocenteController::class, 'generarPdfReporte'])->name('cursos.asistencias.pdf');


    // ==========================================
    // MÓDULO INDEPENDIENTE: CONTROL DE ASISTENCIAS
    // ==========================================
    Route::get('/docente/asistencias', [AsistenciaDocenteController::class, 'index'])->name('docente.asistencias.index');
    Route::post('/docente/asistencias/select', [AsistenciaDocenteController::class, 'setContext'])->name('docente.asistencias.select');
    Route::get('/docente/asistencias/matriz', [AsistenciaDocenteController::class, 'getMatriz'])->name('docente.asistencias.matriz');
    Route::post('/docente/asistencias/guardar', [AsistenciaDocenteController::class, 'guardar'])->name('docente.asistencias.guardar');
    Route::get('/docente/asistencias/pdf', [AsistenciaDocenteController::class, 'generarPdfReporte'])->name('docente.asistencias.pdf');

    
    // Materiales del Curso
    Route::post('/docente/cursos/materiales', [DocenteController::class, 'storeMaterial'])->name('cursos.materiales.store');
    Route::post('/docente/cursos/materiales/{id}', [DocenteController::class, 'updateMaterial'])->name('cursos.materiales.update');
    Route::delete('/docente/cursos/materiales/{id}', [DocenteController::class, 'destroyMaterial'])->name('cursos.materiales.destroy');

    //notas
    Route::get('/docente/cursos/gestionar/ranking/pdf', [NotasController::class, 'generarPdfRankingTop5'])->name('cursos.ranking.pdf');
    Route::get('/reportes/acta-final/{id}', [NotasController::class, 'actaFinal'])->name('reportes.acta_final');
    Route::get('/reporte/nomina-matriculados', [NotasController::class, 'generarPdfNominaMatriculados'])->name('reportes.nomina_matriculados');
    Route::get('/docente/cursos/matriz-notas', [NotasController::class, 'getMatrizNotas'])->name('cursos.notas.matriz');
    Route::get('/docente/cursos/gestionar/notas/pdf', [NotasController::class, 'generarPdfReporte'])->name('cursos.notas.pdf');
    Route::post('/docente/cursos/matriz-notas', [NotasController::class, 'guardarNotasMatriz'])->name('cursos.notas.guardar');

    // Rutas de integración con Moodle
    Route::get('/evaluaciones/moodle/disponibles', [NotasController::class, 'listarEvaluacionesMoodle'])->name('evaluaciones.moodle.disponibles');
    Route::post('/notas/importar-moodle', [NotasController::class, 'importarNotasMoodle'])->name('notas.importar.moodle');

    // Rutas de Clases en Vivo (Módulo Docente)
    Route::get('docente/cursos/clases-en-vivo/obtener', [ClaseEnVivoController::class, 'index'])->middleware('auth')->name('cursos.clases.index');
    Route::post('docente/cursos/clases-en-vivo/crear', [ClaseEnVivoController::class, 'store'])->middleware('auth')->name('cursos.clases.store');
    Route::post('docente/cursos/clases-en-vivo/{id}/estado', [ClaseEnVivoController::class, 'cambiarEstado'])->middleware('auth')->name('cursos.clases.estado');
    Route::patch('docente/cursos/clases-en-vivo/{id}/grabacion', [ClaseEnVivoController::class, 'registrarGrabacion'])->middleware('auth')->name('cursos.clases.grabacion');
    Route::delete('docente/cursos/clases-en-vivo/{id}', [ClaseEnVivoController::class, 'destroy'])->middleware('auth')->name('cursos.clases.destroy');

    
    // Rutas de Tareas integradas a la gestión del curso
    Route::get('/docente/cursos/gestionar/tareas', [TareaController::class, 'index'])->name('cursos.tareas.index');
    Route::post('/docente/cursos/gestionar/tareas', [TareaController::class, 'store'])->name('cursos.tareas.store');
    Route::get('/docente/cursos/gestionar/tareas/{id}/entregas', [TareaController::class, 'verEntregas'])->name('cursos.tareas.entregas');
    Route::post('/docente/cursos/gestionar/tareas/calificar/{envioId}', [TareaController::class, 'calificar'])->name('cursos.tareas.calificar');
    Route::delete('/docente/cursos/gestionar/tareas/{id}', [TareaController::class, 'destroy'])->name('cursos.tareas.destroy');

    //evaluaciones de estudiantes
    Route::get('/evaluaciones', [EvaluacionController::class, 'index'])->name('evaluaciones.index');
    Route::get('/evaluaciones/crear', [EvaluacionController::class, 'create'])->name('evaluaciones.create');
    Route::post('/evaluaciones', [EvaluacionController::class, 'store'])->name('evaluaciones.store');
    //Route::get('/evaluaciones/{id}/resultados', [EvaluacionController::class, 'resultados'])->name('evaluaciones.resultados');
    Route::delete('/evaluaciones/{id}', [EvaluacionController::class, 'destroy'])->name('evaluaciones.destroy');
    Route::put('/evaluaciones/{id}', [EvaluacionController::class, 'update']);
    Route::get('/evaluaciones/{evaluacion}/resultados', [EvaluacionController::class, 'verResultados'])->middleware(['auth']);

    /// Cargar la vista de Logros por POST
    Route::match(['get', 'post'], '/docente/cursos/logros', [LogroCursoController::class, 'index'])->name('cursos.logros');

    // Guardar Logro (¡Sin parámetros en la URL!)
    Route::post('/docente/logros/store', [LogroCursoController::class, 'storeLogro'])->name('cursos.logros.store');

    // Actualizar y Eliminar Logro
    Route::put('/docente/logros/{logro}', [LogroCursoController::class, 'updateLogro'])->name('logros.update');

    Route::delete('/docente/logros/{logro}', [LogroCursoController::class, 'destroyLogro'])->name('logros.destroy');

    // CRUD Subcomponentes
    Route::post('/docente/logros/{logro}/subcomponentes', [LogroCursoController::class, 'storeSubcomponente'])->name('logros.subcomponentes.store');

    Route::delete('/docente/subcomponentes/{subcomponente}', [LogroCursoController::class, 'destroySubcomponente'])->name('subcomponentes.destroy');


    Route::get('/docente/registro-auxiliar', [DocenteController::class, 'registroAuxiliarIndex'])
        ->name('docente.registro-auxiliar');
        
    Route::post('/docente/registro-auxiliar/seleccionar', [DocenteController::class, 'setRegistroAuxiliarContext'])
        ->name('docente.registro-auxiliar.select');

        // Importación de Excel por Backend
    Route::post('/registro-auxiliar/importar-excel', [DocenteController::class, 'importarNotasLogroExcel'])->name('registro-auxiliar.importar-excel');

    // Rutas del perfil del estudiante (individuales sin Route::group)
    Route::get('/estudiante/mis-cursos', [EstudianteCursoController::class, 'misCursos'])->middleware(['auth'])->name('estudiante.cursos');
    Route::get('/estudiante/mi-horario', [EstudianteCursoController::class, 'miHorario'])->middleware(['auth'])->name('estudiante.horario');
    Route::get('/estudiante/mis-notas', [EstudianteCursoController::class, 'misNotas'])->middleware(['auth'])->name('estudiante.notas');
    Route::get('/estudiante/mi-asistencia', [EstudianteCursoController::class, 'miAsistencia'])->middleware(['auth'])->name('estudiante.asistencia');
    Route::get('/estudiante/historial-academico', [EstudianteCursoController::class, 'historialAcademico'])->middleware(['auth'])->name('estudiante.historial');
    Route::get('/estudiante/aula-virtual/{curso_id}', [EstudianteCursoController::class, 'verAulaVirtual'])->name('estudiante.aula-virtual.show');
    Route::post('/estudiante/tareas/entregar', [EstudianteCursoController::class, 'entregarTarea'])->middleware(['auth'])->name('estudiante.tareas.entregar');
    Route::get('/estudiante/evaluaciones/{evaluacion}/rendir', [EstudianteCursoController::class, 'rendirEvaluacion'])->middleware(['auth'])->name('estudiante.evaluaciones.rendir');
    Route::post('/estudiante/evaluaciones/{evaluacion}/guardar', [EstudianteCursoController::class, 'guardarEvaluacion'])->middleware(['auth'])->name('estudiante.evaluaciones.guardar');
    // Rutas del Perfil de Estudiante
    Route::get('/estudiante/perfil', [EstudianteCursoController::class, 'editarPerfil'])->name('estudiante.perfil.edit');
    Route::put('/estudiante/perfil', [EstudianteCursoController::class, 'actualizarPerfil'])->name('estudiante.perfil.update');

    // Rutas de Trámites para Estudiantes
    Route::get('/estudiante/mis-tramites', [EstudianteCursoController::class, 'misTramites'])->name('estudiante.tramites');

    Route::post('/estudiante/mis-tramites', [EstudianteCursoController::class, 'guardarTramiteEstudiante'])->name('estudiante.tramites.store');

    // ...
    Route::get('/estudiante/bolsa-laboral', [EstudianteCursoController::class, 'bolsaLaboral'])->name('estudiante.bolsa-laboral');

    Route::post('/estudiante/bolsa-laboral/postular', [EstudianteCursoController::class, 'postularOferta'])->name('estudiante.bolsa-laboral.postular');

        // ...
    Route::get('/estudiante/mis-pagos', [EstudianteCursoController::class, 'misPagos'])->name('estudiante.pagos');

    /* Docentes */
    // Ruta de Gestión del Curso
    Route::get('/docente/horarios', [DocenteController::class, 'horarios'])->name('docente.horarios');
    
    Route::get('docente/mi-perfil', [DocenteController::class, 'miPerfil'])->middleware('auth')->name('docente.perfil');
    Route::get('docente/mi-horario/pdf', [DocenteController::class, 'imprimirHorarioPdf'])->middleware('auth')->name('docente.horarios.pdf');
    Route::match(['get', 'post'], '/docente/cursos/gestionar', [DocenteController::class, 'gestionar'])->name('cursos.gestionar');
    Route::match(['get', 'post'], '/docente/mis-cursos', [DocenteController::class, 'misCursos'])->name('docente.cursos');
    Route::post('/docentes/buscar', [DocenteController::class, 'buscar'])->name('docentes.buscar');
    Route::post('docentes/importar-masivo', [DocenteController::class, 'importarMasivo'])->middleware('auth')->name('docentes.importar');
    Route::get('docentes/plantilla-excel', [DocenteController::class, 'descargarPlantillaExcel'])->middleware('auth')->name('docentes.plantilla.excel');
    Route::post('docentes/consultar-dni', [DocenteController::class, 'consultarDni'])->middleware('auth')->name('docentes.consultar.dni');
    Route::resource('docentes', DocenteController::class);

   /* Administradores - Rutas explícitas */
    Route::get('/administradores', [AdministradorController::class, 'index'])->name('administradores.index');
    Route::get('/administradores/create', [AdministradorController::class, 'create'])->name('administradores.create');
    Route::post('/administradores', [AdministradorController::class, 'store'])->name('administradores.store');
    Route::get('/administradores/{administrador}/edit', [AdministradorController::class, 'edit'])->name('administradores.edit');
    Route::put('/administradores/{administrador}', [AdministradorController::class, 'update'])->name('administradores.update');
    Route::put('/administradores/{administrador}/estado', [AdministradorController::class, 'actualizarEstado'])->name('administradores.estado');

    /* Personal */
    Route::put('/personal/{personal}/estado', [PersonalController::class, 'actualizarEstado'])->name('personal.estado');
    Route::get('/personal/buscar', [PersonalController::class, 'buscarAjax'])->name('personal.buscar');
    Route::resource('personal', PersonalController::class)->except('show');

    /* Usuarios: rutas específicas antes de la ruta dinámica */
    Route::post('/usuarios/buscar', [UsuarioController::class, 'buscar'])->name('usuarios.buscar');
    Route::put('/usuarios/{usuario}/clave', [UsuarioController::class, 'cambiarClave'])->name('usuarios.cambiar-clave');
    Route::post('/usuarios/{usuario}/resetear-clave', [UsuarioController::class, 'resetearClave'])->name('usuarios.resetear-clave');
    Route::put('/usuarios/{usuario}/roles', [UsuarioController::class, 'actualizarRoles'])->name('usuarios.actualizar-roles');
    Route::put('/usuarios/{usuario}/estado', [UsuarioController::class, 'actualizarEstado'])->name('usuarios.actualizar-estado');
    Route::resource('usuarios', UsuarioController::class)->only(['index', 'show']);

    /* Consultas dependientes */
    Route::get('/departamentos/{departamento}/provincias', [ProvinciaController::class, 'porDepartamento'])->name('provincias.por-departamento');
    Route::get('/provincias/{provincia}/distritos', [DistritoController::class, 'porProvincia'])->name('distritos.por-provincia');

    /* Mantenimientos territoriales */
    Route::post('/departamentos/filtrar', [DepartamentoController::class, 'filtrar'])->name('departamentos.filtrar');
    Route::resource('departamentos', DepartamentoController::class)->except('show');
    Route::post('/provincias/filtrar', [ProvinciaController::class, 'filtrar'])->name('provincias.filtrar');

    Route::get('/departamentos/{departamento}/provincias', [ProvinciaController::class, 'porDepartamento'])->name('provincias.por-departamento');

    Route::resource('provincias', ProvinciaController::class)->except('show');
    Route::post('/distritos/filtrar', [DistritoController::class, 'filtrar'])->name('distritos.filtrar');
    Route::resource('distritos', DistritoController::class)->except('show');

    /* Instituto */
    Route::resource('instituto', InstitutoController::class)->except('show');

    /* Áreas */
    Route::put('/areas/{area}/estado', [AreaController::class, 'actualizarEstado'])->name('areas.estado');
    Route::post('/areas/filtrar', [AreaController::class, 'filtrar'])->name('areas.filtrar');
    Route::resource('areas', AreaController::class)->except('show');

    /* Periodos */
    Route::put('/periodos/{periodo}/activar', [PeriodoController::class, 'activar'])->name('periodos.activar');
    Route::put('/periodos/{periodo}/desactivar', [PeriodoController::class, 'desactivar'])->name('periodos.desactivar');
    Route::resource('periodos', PeriodoController::class)->except('show');

    /* Semestres */
    Route::put('/semestres/{semestre}/estado', [SemestreController::class, 'actualizarEstado'])->name('semestres.estado');
    Route::resource('semestres', SemestreController::class)->except('show');

    /* Planes de estudio */
    Route::put('/planes-estudio/{planEstudio}/estado', [PlanEstudioController::class, 'actualizarEstado'])->name('planes-estudio.estado');
    Route::get('/planes-estudio/{planEstudio}/periodos', [PlanEstudioController::class, 'periodos'])->name('planes-estudio.periodos');
    Route::put('/planes-estudio/{planEstudio}/periodos', [PlanEstudioController::class, 'sincronizarPeriodos'])->name('planes-estudio.periodos.sync');
    Route::resource('planes-estudio', PlanEstudioController::class)->parameters(['planes-estudio' => 'planEstudio'])->except('show');

    /* Módulos formativos */
    Route::post('/modulos-formativos/filtrar', [ModuloFormativoController::class, 'filtrar'])->name('modulos-formativos.filtrar');
    Route::resource('modulos-formativos', ModuloFormativoController::class)->parameters(['modulos-formativos' => 'moduloFormativo'])->except('show');

    /* Cursos */
    Route::post('/cursos/importar', [CursoController::class, 'importar'])->name('cursos.importar');
    Route::post('/cursos/filtrar', [CursoController::class, 'filtrar'])->name('cursos.filtrar');
    Route::resource('cursos', CursoController::class)->except('show');


    /* |--------------------------------------------------------------------------
     | Pabellones |
    -------------------------------------------------------------------------- */
    Route::post('/pabellones/filtrar',[PabellonController::class, 'filtrar'])->name('pabellones.filtrar');

    Route::resource('pabellones',PabellonController::class)->parameters(['pabellones' => 'pabellon',])->except(['show']);


    /* |-------------------------------------------------------------------------- 
        | Aulas |
    -------------------------------------------------------------------------- */
    Route::post('/aulas/filtrar', [AulaController::class, 'filtrar'])->name('aulas.filtrar');
    Route::resource('aulas', AulaController::class)->except(['show']);

    /*turno*/
    Route::post('/turnos/filtrar',[TurnoController::class, 'filtrar'])->name('turnos.filtrar');

    Route::resource('turnos',TurnoController::class)->parameters(['turnos' => 'turno',])->except(['show']);

    Route::post('/secciones/filtrar',[SeccionController::class, 'filtrar'])->name('secciones.filtrar');

    Route::resource('secciones',SeccionController::class)->parameters(['secciones' => 'seccion',])->except(['show']);

    /*
    |--------------------------------------------------------------------------
    | Horarios
    |--------------------------------------------------------------------------
    */

    Route::get('/planes-estudio/{planEstudio}/cursos',[HorarioController::class, 'cursosPorPlanEstudio'])->name('horarios.cursos-por-plan');

    Route::post('/horarios/filtrar',[HorarioController::class, 'filtrar'])->name('horarios.filtrar');
    Route::get('/horarios/docente/{docente}/pdf',[HorarioController::class, 'pdfPorDocente'])->name('horarios.pdf-docente');


    Route::resource('horarios',HorarioController::class)->parameters(['horarios' => 'horario',])->except(['show']);

    /*
    |--------------------------------------------------------------------------
    | Roles y módulos autorizados
    |--------------------------------------------------------------------------
    */

    Route::post('/roles/filtrar',[RolController::class, 'filtrar'])->name('roles.filtrar');

    Route::get('/roles/{rol}/modulos',[RolController::class, 'modulosAsignados'])->name('roles.modulos');

    Route::put('/roles/{rol}/estado',[RolController::class, 'actualizarEstado'])->name('roles.estado');

    Route::resource('roles',RolController::class)->parameters(['roles' => 'rol',])->except(['show',]);

    /*Estudiantes*/
    Route::get('/estudiantes/descargar-plantilla', [EstudianteController::class, 'descargarPlantilla'])->name('estudiantes.descargar.plantilla');
    Route::post('/estudiantes/importar-masivo', [EstudianteController::class, 'importarMasivo'])->name('estudiantes.importar.masivo');
    Route::post('/estudiantes/importar-masivo', [EstudianteController::class, 'importarMasivo'])->name('estudiantes.importar.masivo');
    Route::post('/estudiantes/consultar-dni', [EstudianteController::class, 'consultarDni'])->name('estudiantes.consultar.dni');
    Route::post('/estudiantes/filtrar',[EstudianteController::class, 'filtrar'])->name('estudiantes.filtrar');
    Route::post('estudiantes/importar', [EstudianteController::class, 'importarExcel'])->name('estudiantes.importar');

    Route::resource('estudiantes',EstudianteController::class)->parameters(['estudiantes' => 'postulante',])->except(['show',]);
    /*Estudiantes*/
    Route::post('/matriculas/filtrar', [MatriculaController::class, 'filtrar'])->name('matriculas.filtrar');
    // Ruta AJAX para obtener los horarios filtrados por Semestre y Periodo
    Route::get('/matriculas/horarios-por-semestre', [MatriculaController::class, 'obtenerHorariosPorSemestre'])->name('matriculas.horarios_semestre');

    Route::get('/matriculas/verificar-estudiante', [MatriculaController::class, 'verificarMatriculaEstudiante'])->name('matriculas.verificar_estudiante');
    Route::get('/matriculas/{id}/ficha', [MatriculaController::class, 'verFicha'])->name('matriculas.ficha');

    Route::post('/matriculas/importar-masivo', [MatriculaController::class, 'importarMasivo'])
    ->name('matriculas.importar_masivo');

    // Rutas CRUD estándar para Matrículas
    Route::resource('matriculas', MatriculaController::class);

    // Rutas de Convalidaciones
    Route::get('/convalidaciones', [ConvalidacionController::class, 'index'])->name('convalidaciones.index');
    Route::get('/convalidaciones/crear', [ConvalidacionController::class, 'create'])->name('convalidaciones.create');
    Route::post('/convalidaciones', [ConvalidacionController::class, 'store'])->name('convalidaciones.store');
    Route::get('/convalidaciones/{id}/editar', [ConvalidacionController::class, 'edit'])->name('convalidaciones.edit');
    Route::put('/convalidaciones/{id}', [ConvalidacionController::class, 'update'])->name('convalidaciones.update');
    Route::delete('/convalidaciones/{id}', [ConvalidacionController::class, 'destroy'])->name('convalidaciones.destroy');

    // AQUÍ: Debe ser Route::post
    Route::post('/convalidaciones/filtrar', [ConvalidacionController::class, 'filtrar'])->name('convalidaciones.filtrar');

    // Búsqueda AJAX de estudiantes por DNI
    Route::get('/convalidaciones/buscar-estudiante-matricula', [ConvalidacionController::class, 'buscarEstudianteMatricula'])
        ->name('convalidaciones.buscar_estudiante_matricula');

    // Generación de PDF
    Route::get('/convalidaciones/{id}/pdf', [ConvalidacionController::class, 'generarPdf'])->name('convalidaciones.pdf');
    // Boleta de notas
    Route::get('/boleta-notas', [BoletaNotasController::class, 'index'])->name('boleta_notas.index');
    Route::get('/boleta-notas/buscar', [BoletaNotasController::class, 'buscarConsolidado'])->name('boleta_notas.buscar');
    
    // 🔒 Ruta protegida con firma criptográfica
    Route::get('/boleta-notas/pdf', [BoletaNotasController::class, 'generarPdf'])->name('boleta_notas.pdf')->middleware('signed');
    //Empresa
    Route::resource('empresas', EmpresaController::class)->except(['create', 'edit', 'show']);
    Route::resource('tipos-contrato', TipoContratoController::class)->except(['create', 'edit', 'show']);

    // Ofertas Laborales (con Create, Edit e Index completos)
    Route::resource('ofertas-laborales', OfertaLaboralController::class)->except(['show']);

    Route::get('/panel-analitico', [PanelAnaliticoController::class, 'index'])->name('panel-analitico.index');

    //Admisiones
    Route::patch('admisiones/{admision}/estado',[AdmisionController::class, 'cambiarEstado'])->name('admisiones.cambiar-estado');
    Route::resource('admisiones', AdmisionController::class)->parameters(['admisiones' => 'admision',]);

    Route::patch('requisitos/{requisito}/estado', [RequisitoController::class, 'cambiarEstado'])->name('requisitos.cambiar-estado');
    Route::resource('requisitos', RequisitoController::class)->parameters(['requisitos' => 'requisito',]);

    Route::patch('tipos-pago/{tipo_pago}/estado', [TipoPagoController::class, 'cambiarEstado'])->name('tipos-pago.cambiar-estado');
    Route::resource('tipos-pago', TipoPagoController::class)->parameters(['tipos-pago' => 'tipo_pago',]);

    Route::patch('inscripciones/{inscripcion}/estado', [InscripcionController::class, 'cambiarEstado'])->name('inscripciones.cambiar-estado');
    Route::resource('inscripciones', InscripcionController::class)->parameters(['inscripciones' => 'inscripcion',]);

    //resultados
    Route::get('/resultados-admision/descargar-plantilla', [ResultadoAdmisionController::class, 'descargarPlantilla'])
    ->name('resultados-admision.plantilla');

    Route::post('/resultados-admision/importar', [ResultadoAdmisionController::class, 'importar'])
    ->name('resultados-admision.importar');
    Route::resource('resultados-admision', ResultadoAdmisionController::class)->parameters(['resultados-admision' => 'resultadoAdmision']);

    // Vista principal (Carga limpia)
    Route::get('/matriculas-ingresantes', [MatriculaIngresanteController::class, 'index'])->name('matriculas.ingresantes.index');

    // Endpoint AJAX para obtener los ingresantes y las secciones activas del 1er Semestre
    Route::get('/api/matriculas-ingresantes/obtener-datos', [MatriculaIngresanteController::class, 'obtenerDatosAjax'])->name('matriculas.ingresantes.ajax');

    // Procesamiento de matrícula masiva
    Route::post('/matriculas-ingresantes', [MatriculaIngresanteController::class, 'store'])->name('matriculas.ingresantes.store');

    // Vista Malla Curricular
    Route::get('/planes/malla-curricular', [PlanEstudioController::class, 'malla'])->name('planes.malla');
    Route::post('/planes/malla-curricular/obtener', [PlanEstudioController::class, 'obtenerMallaAjax'])->name('planes.malla.ajax');
    Route::get('/planes/malla-curricular/pdf/{plan_id}', [PlanEstudioController::class, 'generarPdfMalla'])->name('planes.malla.pdf');

    // Vista de Reportes
    Route::get('/reportes/matriculados', [ReporteMatriculaController::class, 'index'])
        ->name('reportes.matriculados');

    Route::get('/api/reportes/matriculados/obtener', [ReporteMatriculaController::class, 'obtenerMatriculadosAjax'])
        ->name('reportes.matriculados.ajax');

    Route::post('/reportes/matriculados/pdf', [ReporteMatriculaController::class, 'verPdf'])
        ->name('reportes.matriculados.pdf');

    //conceptos    

    Route::get('/conceptos', [ConceptoController::class, 'index'])->name('conceptos.index');
    Route::post('/conceptos', [ConceptoController::class, 'store'])->name('conceptos.store');
    Route::put('/conceptos/{id}', [ConceptoController::class, 'update'])->name('conceptos.update');
    Route::delete('/conceptos/{id}', [ConceptoController::class, 'destroy'])->name('conceptos.destroy');
    Route::post('/conceptos/importar', [ConceptoController::class, 'importarExcel'])->name('conceptos.importar');

    // Módulo de Caja
    Route::get('/caja', [CajaController::class, 'index'])->name('caja.index');
    Route::post('/caja/aperturar', [CajaController::class, 'aperturar'])->name('caja.aperturar');
    Route::post('/caja/cerrar', [CajaController::class, 'cerrar'])->name('caja.cerrar');
    Route::post('/caja/transaccion', [CajaController::class, 'registrarTransaccion'])->name('caja.transaccion');
    Route::delete('/caja/transaccion/{id}', [CajaController::class, 'anularTransaccion'])->name('caja.anular');

    // Cobros a Postulantes / Estudiantes
    Route::get('/pagos', [PagoPostulanteController::class, 'index'])->name('pagos.index');
    Route::get('/pagos/nuevo', [PagoPostulanteController::class, 'create'])->name('pagos.create');
    Route::get('/pagos/buscar-postulante', [PagoPostulanteController::class, 'buscarPostulante'])->name('pagos.buscar');
    Route::post('/pagos', [PagoPostulanteController::class, 'store'])->name('pagos.store');
    Route::delete('/pagos/{id}/anular', [PagoPostulanteController::class, 'anular'])->name('pagos.anular');
    Route::post('/pagos/{id}/ticket', [PagoPostulanteController::class, 'generarTicket'])->name('pagos.ticket');

    // Módulo de Reportes e Historial de Cajas
    Route::get('/reportes/cajas', [ReporteCajaController::class, 'index'])->name('reportes.cajas.index');
    Route::get('/reportes/cajas/{id}', [ReporteCajaController::class, 'detalleCaja'])->name('reportes.cajas.detalle');
    Route::post('/reportes/cajas/{id}/pdf', [ReporteCajaController::class, 'pdfCuadreCaja'])->name('reportes.cajas.pdf');

     
    // 1. Recepción principal de Mesa de Partes
    Route::get('/mesa-de-partes/recepcion', [SolicitudTramiteController::class, 'bandejaMesaPartes'])
        ->name('mesa-partes.bandeja');

    // 2. Bandeja de Atención por Área (Secretaría Académica, Tesorería, etc.)
    Route::get('/tramites/bandeja-area', [SolicitudTramiteController::class, 'porMiArea'])
        ->name('solicitudes.area.index');

    // 3. Mis solicitudes asignadas
    Route::get('/tramites/mis-asignadas', [SolicitudTramiteController::class, 'misAsignadas'])
        ->name('solicitudes.mis-asignadas');

    // 4. Tomar / Asignarse expediente
    Route::post('/tramites/{solicitud}/asignarme', [SolicitudTramiteController::class, 'asignarme'])
        ->name('solicitudes.asignarme');

    // 5. Derivar expediente
    Route::post('/tramites/{solicitud}/derivar', [SolicitudTramiteController::class, 'derivar'])
        ->name('solicitudes.derivar');

    // 6. Resolver / Atender expediente
    Route::put('/tramites/{solicitud}/atender', [SolicitudTramiteController::class, 'resolver'])
        ->name('solicitudes.atender');

    // 7. Seguimiento / Expedientes general
    Route::get('/expedientes', [SolicitudTramiteController::class, 'expedientesIndex'])
        ->name('expedientes.index');


        // Aceptar solicitud externa y enviar correo con código de seguimiento
    Route::post('/mesa-de-partes/aceptar/{id}', [SolicitudExternaController::class, 'aceptarMesaPartes'])
        ->name('solicitud-externa.aceptar-mesa-partes');


    //tramite documentario
    Route::get('/requisitos-tramite', [RequisitoTramiteController::class, 'index'])->name('requisitos-tramite.index');
 
    Route::post('/requisitos-tramite', [RequisitoTramiteController::class, 'store'])->name('requisitos-tramite.store');
 
    Route::put('/requisitos-tramite/{requisitosTramite}', [RequisitoTramiteController::class, 'update'])->name('requisitos-tramite.update');
 
    Route::put('/requisitos-tramite/{requisitosTramite}/estado', [RequisitoTramiteController::class, 'cambiarEstado'])->name('requisitos-tramite.estado');
 
    Route::delete('/requisitos-tramite/{requisitosTramite}', [RequisitoTramiteController::class, 'destroy'])->name('requisitos-tramite.destroy');

      Route::get('/tramites', [TramiteController::class, 'index'])->name('tramites.index');
 
    Route::get('/tramites/create', [TramiteController::class, 'create'])->name('tramites.create');
 
    Route::post('/tramites', [TramiteController::class, 'store'])->name('tramites.store');
 
    Route::get('/tramites/{tramite}/edit', [TramiteController::class, 'edit'])->name('tramites.edit');
 
    Route::get('/tramites/{tramite}', [TramiteController::class, 'show'])->name('tramites.show');
 
    Route::put('/tramites/{tramite}', [TramiteController::class, 'update'])->name('tramites.update');
 
    Route::put('/tramites/{tramite}/estado', [TramiteController::class, 'cambiarEstado'])->name('tramites.estado');
 
    Route::delete('/tramites/{tramite}', [TramiteController::class, 'destroy'])->name('tramites.destroy');


    /* Repositorio - Categorías */
    Route::get('/repositorio/categorias', [RepositorioCategoriaController::class, 'index'])->name('repositorio-categorias.index');
    Route::post('/repositorio/categorias/filtrar', [RepositorioCategoriaController::class, 'filtrar'])->name('repositorio-categorias.filtrar');
    Route::post('/repositorio/categorias', [RepositorioCategoriaController::class, 'store'])->name('repositorio-categorias.store');
    Route::put('/repositorio/categorias/{categoria}', [RepositorioCategoriaController::class, 'update'])->name('repositorio-categorias.update');
    Route::patch('/repositorio/categorias/{categoria}/estado', [RepositorioCategoriaController::class, 'actualizarEstado'])->name('repositorio-categorias.estado');
    Route::delete('/repositorio/categorias/{categoria}', [RepositorioCategoriaController::class, 'destroy'])->name('repositorio-categorias.destroy');

    /* Repositorio - Autores */
    Route::get('/repositorio/autores', [RepositorioAutorController::class, 'index'])->name('repositorio-autores.index');
    Route::post('/repositorio/autores/filtrar', [RepositorioAutorController::class, 'filtrar'])->name('repositorio-autores.filtrar');
    Route::post('/repositorio/autores', [RepositorioAutorController::class, 'store'])->name('repositorio-autores.store');
    Route::put('/repositorio/autores/{autor}', [RepositorioAutorController::class, 'update'])->name('repositorio-autores.update');
    Route::patch('/repositorio/autores/{autor}/estado', [RepositorioAutorController::class, 'actualizarEstado'])->name('repositorio-autores.estado');
    Route::delete('/repositorio/autores/{autor}', [RepositorioAutorController::class, 'destroy'])->name('repositorio-autores.destroy');

    /* Repositorio - Recursos / Documentos */
    Route::get('/repositorio/recursos', [RepositorioRecursoController::class, 'index'])->name('repositorio-recursos.index');
    Route::post('/repositorio/recursos/filtrar', [RepositorioRecursoController::class, 'filtrar'])->name('repositorio-recursos.filtrar');
    Route::post('/repositorio/recursos', [RepositorioRecursoController::class, 'store'])->name('repositorio-recursos.store');
    Route::post('/repositorio/recursos/{recurso}', [RepositorioRecursoController::class, 'update'])->name('repositorio-recursos.update');
    Route::patch('/repositorio/recursos/{recurso}/estado', [RepositorioRecursoController::class, 'actualizarEstado'])->name('repositorio-recursos.estado');
    Route::delete('/repositorio/recursos/{recurso}', [RepositorioRecursoController::class, 'destroy'])->name('repositorio-recursos.destroy');
    Route::get('/repositorio/recursos/{recurso}/ver', [RepositorioRecursoController::class, 'verArchivo'])->name('repositorio-recursos.ver');
    Route::get('/repositorio/recursos/{recurso}/descargar', [RepositorioRecursoController::class, 'descargarArchivo'])->name('repositorio-recursos.descargar');

    Route::get('/repositorio/dashboard', [RepositorioRecursoController::class, 'dashboard'])->name('repositorio.dashboard');


    /* Titulación - Modalidades */
    Route::get('/titulacion/modalidades', [TitulacionModalidadController::class, 'index'])->name('titulacion-modalidades.index');
    Route::post('/titulacion/modalidades/filtrar', [TitulacionModalidadController::class, 'filtrar'])->name('titulacion-modalidades.filtrar');
    Route::post('/titulacion/modalidades', [TitulacionModalidadController::class, 'store'])->name('titulacion-modalidades.store');
    Route::put('/titulacion/modalidades/{modalidad}', [TitulacionModalidadController::class, 'update'])->name('titulacion-modalidades.update');
    Route::patch('/titulacion/modalidades/{modalidad}/estado', [TitulacionModalidadController::class, 'actualizarEstado'])->name('titulacion-modalidades.estado');
    Route::delete('/titulacion/modalidades/{modalidad}', [TitulacionModalidadController::class, 'destroy'])->name('titulacion-modalidades.destroy');

    /* Titulación - Requisitos */
    Route::get('/titulacion/requisitos', [TitulacionRequisitoController::class, 'index'])->name('titulacion-requisitos.index');
    Route::post('/titulacion/requisitos/filtrar', [TitulacionRequisitoController::class, 'filtrar'])->name('titulacion-requisitos.filtrar');
    Route::post('/titulacion/requisitos', [TitulacionRequisitoController::class, 'store'])->name('titulacion-requisitos.store');
    Route::put('/titulacion/requisitos/{requisito}', [TitulacionRequisitoController::class, 'update'])->name('titulacion-requisitos.update');
    Route::patch('/titulacion/requisitos/{requisito}/estado', [TitulacionRequisitoController::class, 'actualizarEstado'])->name('titulacion-requisitos.estado');
    Route::patch('/titulacion/requisitos/{requisito}/obligatorio', [TitulacionRequisitoController::class, 'toggleObligatorio'])->name('titulacion-requisitos.obligatorio');
    Route::delete('/titulacion/requisitos/{requisito}', [TitulacionRequisitoController::class, 'destroy'])->name('titulacion-requisitos.destroy');

    /* Titulación - Expedientes */
    Route::get('/titulacion/expedientes', [TitulacionController::class, 'index'])->name('titulaciones.index');
    Route::post('/titulacion/expedientes/filtrar', [TitulacionController::class, 'filtrar'])->name('titulaciones.filtrar');
    Route::get('/titulacion/expedientes/crear', [TitulacionController::class, 'create'])->name('titulaciones.create');
    Route::post('/titulacion/expedientes', [TitulacionController::class, 'store'])->name('titulaciones.store');
    Route::get('/titulacion/expedientes/{titulacion}', [TitulacionController::class, 'show'])->name('titulaciones.show');
    Route::patch('/titulacion/expedientes/{titulacion}/estado', [TitulacionController::class, 'cambiarEstadoExpediente'])->name('titulaciones.estado');
    Route::delete('/titulacion/expedientes/{titulacion}', [TitulacionController::class, 'destroy'])->name('titulaciones.destroy');

    /* Requisitos dentro del expediente */
    Route::post('/titulacion/expedientes/requisitos/{expedienteRequisito}/subir', [TitulacionController::class, 'subirArchivoRequisito'])->name('titulaciones.requisito.subir');
    Route::patch('/titulacion/expedientes/requisitos/{expedienteRequisito}/evaluar', [TitulacionController::class, 'evaluarRequisito'])->name('titulaciones.requisito.evaluar');
    Route::get('/titulacion/descargar/{tipo}/{id}', [TitulacionController::class, 'descargarArchivo'])->name('titulaciones.descargar');

    Route::get('/titulacion/expedientes/{titulacion}/editar', [TitulacionController::class, 'edit'])->name('titulaciones.edit');
    Route::post('/titulacion/expedientes/{titulacion}/actualizar', [TitulacionController::class, 'update'])->name('titulaciones.update');

    /* Titulación - Sustentaciones y Actas */
    Route::get('/titulacion/sustentaciones', [TitulacionSustentacionController::class, 'index'])->name('titulacion-sustentaciones.index');
    Route::post('/titulacion/sustentaciones/filtrar', [TitulacionSustentacionController::class, 'filtrar'])->name('titulacion-sustentaciones.filtrar');
    Route::post('/titulacion/sustentaciones/{titulacion}/guardar', [TitulacionSustentacionController::class, 'guardarSustentacion'])->name('titulacion-sustentaciones.guardar');
    Route::get('/titulacion/sustentaciones/{titulacion}/acta-pdf', [TitulacionSustentacionController::class, 'emitirActaPdf'])->name('titulacion-sustentaciones.pdf');

    /* Titulación - Libro de Títulos y Registro */
    Route::get('/titulacion/registro', [TitulacionRegistroController::class, 'index'])->name('titulacion-registro.index');
    Route::post('/titulacion/registro/filtrar', [TitulacionRegistroController::class, 'filtrar'])->name('titulacion-registro.filtrar');
    Route::post('/titulacion/registro/{titulacion}/diploma', [TitulacionRegistroController::class, 'registrarDiploma'])->name('titulacion-registro.diploma');
    Route::get('/titulacion/registro/{titulacion}/constancia-pdf', [TitulacionRegistroController::class, 'emitirConstanciaPdf'])->name('titulacion-registro.pdf');

    /* Patrimonio - Categorías */
    Route::get('/patrimonio/categorias', [PatrimonioCategoriaController::class, 'index'])->name('patrimonio-categorias.index');
    Route::post('/patrimonio/categorias/filtrar', [PatrimonioCategoriaController::class, 'filtrar'])->name('patrimonio-categorias.filtrar');
    Route::post('/patrimonio/categorias', [PatrimonioCategoriaController::class, 'store'])->name('patrimonio-categorias.store');
    Route::put('/patrimonio/categorias/{categoria}', [PatrimonioCategoriaController::class, 'update'])->name('patrimonio-categorias.update');
    Route::patch('/patrimonio/categorias/{categoria}/estado', [PatrimonioCategoriaController::class, 'actualizarEstado'])->name('patrimonio-categorias.estado');
    Route::delete('/patrimonio/categorias/{categoria}', [PatrimonioCategoriaController::class, 'destroy'])->name('patrimonio-categorias.destroy');

    /* Patrimonio - Inventario de Bienes */
    Route::get('/patrimonio/bienes', [PatrimonioBienController::class, 'index'])->name('patrimonio-bienes.index');
    Route::post('/patrimonio/bienes/filtrar', [PatrimonioBienController::class, 'filtrar'])->name('patrimonio-bienes.filtrar');
    Route::post('/patrimonio/bienes', [PatrimonioBienController::class, 'store'])->name('patrimonio-bienes.store');
    Route::post('/patrimonio/bienes/{biene}', [PatrimonioBienController::class, 'update'])->name('patrimonio-bienes.update');
    Route::delete('/patrimonio/bienes/{biene}', [PatrimonioBienController::class, 'destroy'])->name('patrimonio-bienes.destroy');

    /* Patrimonio - Movimientos y Asignaciones */
    Route::get('/patrimonio/movimientos', [PatrimonioMovimientoController::class, 'index'])->name('patrimonio-movimientos.index');
    Route::post('/patrimonio/movimientos/filtrar', [PatrimonioMovimientoController::class, 'filtrar'])->name('patrimonio-movimientos.filtrar');
    Route::post('/patrimonio/movimientos', [PatrimonioMovimientoController::class, 'store'])->name('patrimonio-movimientos.store');
    Route::delete('/patrimonio/movimientos/{movimiento}', [PatrimonioMovimientoController::class, 'destroy'])->name('patrimonio-movimientos.destroy');

    /* Patrimonio - Mantenimientos */
    Route::get('/patrimonio/mantenimientos', [PatrimonioMantenimientoController::class, 'index'])->name('patrimonio-mantenimientos.index');
    Route::post('/patrimonio/mantenimientos/filtrar', [PatrimonioMantenimientoController::class, 'filtrar'])->name('patrimonio-mantenimientos.filtrar');
    Route::post('/patrimonio/mantenimientos', [PatrimonioMantenimientoController::class, 'store'])->name('patrimonio-mantenimientos.store');
    Route::put('/patrimonio/mantenimientos/{mantenimiento}', [PatrimonioMantenimientoController::class, 'update'])->name('patrimonio-mantenimientos.update');
    Route::delete('/patrimonio/mantenimientos/{mantenimiento}', [PatrimonioMantenimientoController::class, 'destroy'])->name('patrimonio-mantenimientos.destroy');

    /* Patrimonio - Bajas de Inventario */
    Route::get('/patrimonio/bajas', [PatrimonioBajaController::class, 'index'])->name('patrimonio-bajas.index');
    Route::post('/patrimonio/bajas/filtrar', [PatrimonioBajaController::class, 'filtrar'])->name('patrimonio-bajas.filtrar');
    Route::post('/patrimonio/bajas', [PatrimonioBajaController::class, 'store'])->name('patrimonio-bajas.store');
    Route::delete('/patrimonio/bajas/{baja}', [PatrimonioBajaController::class, 'destroy'])->name('patrimonio-bajas.destroy');
    Route::get('/patrimonio/bajas/{baja}/acta-pdf', [PatrimonioBajaController::class, 'emitirActaPdf'])->name('patrimonio-bajas.pdf');

    /* Patrimonio - Reportes y Códigos */
    Route::get('/patrimonio/reportes', [PatrimonioReporteController::class, 'dashboard'])->name('patrimonio.dashboard');
    Route::get('/patrimonio/reportes/etiquetas-pdf', [PatrimonioReporteController::class, 'imprimirEtiquetas'])->name('patrimonio.reportes.etiquetas');
    Route::get('/patrimonio/reportes/inventario-pdf', [PatrimonioReporteController::class, 'reporteInventarioPdf'])->name('patrimonio.reportes.inventario');

    // 1. Módulo de Supervisión / Monitoreo Docente
    Route::get('/supervision/docentes', [SupervisionDocenteController::class, 'index'])->name('supervision.index');
    Route::get('/supervision/filtrar', [SupervisionDocenteController::class, 'filtrar'])->name('supervision.filtrar');
    Route::get('/supervision/historial-curso/{horarioId}', [SupervisionDocenteController::class, 'historialCurso'])->name('supervision.historial.curso');
    Route::post('/supervision/guardar', [SupervisionDocenteController::class, 'store'])->name('supervision.store');
    Route::get('/supervision/detalles-curso/{horarioId}', [SupervisionDocenteController::class, 'detallesCurso'])->name('supervision.detalles.curso');

    // 2. Módulo de Asignación de Supervisores por Plan de Estudio
    Route::get('/supervision/planes', [PlanEstudioSupervisorController::class, 'index'])->name('supervision.planes.index');
    Route::post('/supervision/planes/asignar', [PlanEstudioSupervisorController::class, 'store'])->name('supervision.planes.store');
    Route::patch('/supervision/planes/{id}/toggle', [PlanEstudioSupervisorController::class, 'toggleEstado'])->name('supervision.planes.toggle');
    Route::delete('/supervision/planes/{id}', [PlanEstudioSupervisorController::class, 'destroy'])->name('supervision.planes.destroy');


    // ==========================================
    // RUTAS: CRITERIOS Y ESTRUCTURA OFICIAL MINEDU
    // ==========================================
    // Listar criterios de un subcomponente/dimensión
    Route::get('/criterios/subcomponente/{subcomponenteId}', [CriterioSubcomponenteController::class, 'index'])->name('criterios.index');
    
    // Crear un criterio manual
    Route::post('/criterios', [CriterioSubcomponenteController::class, 'store'])->name('criterios.store');
    
    // Actualizar un criterio
    Route::put('/criterios/{id}', [CriterioSubcomponenteController::class, 'update'])->name('criterios.update');
    
    // Eliminar un criterio
    Route::delete('/criterios/{id}', [CriterioSubcomponenteController::class, 'destroy'])->name('criterios.destroy');
    
    // Autogenerar C1, C2, C3, C4 para un subcomponente individual
    Route::post('/criterios/generar-defecto/{subcomponenteId}', [CriterioSubcomponenteController::class, 'generarCriteriosDefecto'])->name('criterios.generar_defecto');
    
    // Generar la estructura oficial completa a un Logro (Actitudinal, Conceptual y Procedimental con C1-C4)
    Route::post('/logros/{id}/generar-estructura-oficial', [CriterioSubcomponenteController::class, 'generarEstructuraOficial'])->name('logros.generar_oficial');

    // ==========================================
    // RUTAS: MATRIZ Y REGISTRO DE CALIFICACIONES
    // ==========================================
    // Para NotasTab (dentro de Gestionar Curso)
    Route::get('/docente/cursos/notas/matriz', [NotasController::class, 'getMatrizNotas'])->name('cursos.notas.matriz');
    Route::post('/docente/cursos/notas/guardar', [NotasController::class, 'guardarNotasMatriz'])->name('cursos.notas.guardar');

    // Para la vista independiente del Registro Auxiliar (Excel MINEDU)
    Route::get('/docente/registro-auxiliar/matriz', [NotasController::class, 'getMatrizRegistroAuxiliar'])->name('docente.registro-auxiliar.matriz');
    Route::post('/docente/registro-auxiliar/guardar', [NotasController::class, 'guardarRegistroAuxiliar'])->name('docente.registro-auxiliar.guardar');

    Route::get('/auditoria', [AuditoriaController::class, 'index'])->name('auditoria.index');
    Route::get('/auditoria/exportar', [AuditoriaController::class, 'exportar'])->name('auditoria.exportar');


    Route::get('/reportes/indicadores', [KpiIndicadoresController::class, 'index'])->name('reportes.kpi.index');
    Route::post('/reportes/indicadores/data', [KpiIndicadoresController::class, 'obtenerDataAjax'])->name('reportes.kpi.data');
    Route::get('/reportes/indicadores/exportar', [KpiIndicadoresController::class, 'exportar'])->name('reportes.kpi.exportar');


    Route::get('/anuncios', [AnuncioController::class, 'index'])->name('anuncios.index');
    Route::post('/anuncios/filtrar', [AnuncioController::class, 'filtrar'])->name('anuncios.filtrar');
    Route::post('/anuncios', [AnuncioController::class, 'store'])->name('anuncios.store');
    Route::put('/anuncios/{anuncio}', [AnuncioController::class, 'update'])->name('anuncios.update');
    Route::patch('/anuncios/{anuncio}/toggle-estado', [AnuncioController::class, 'toggleEstado'])->name('anuncios.toggle-estado');
    Route::delete('/anuncios/{anuncio}', [AnuncioController::class, 'destroy'])->name('anuncios.destroy');
   

    

});

require __DIR__ . '/auth.php';
