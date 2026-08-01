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
use Inertia\Inertia;


use Illuminate\Support\Facades\Route;

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
    
    // Asistencias
    Route::get('/docente/cursos/asistencias/sesion/{sesionId}', [DocenteController::class, 'getAsistenciasPorSesion'])->name('cursos.asistencias.obtener');
    Route::post('/docente/cursos/asistencias/guardar', [DocenteController::class, 'guardarAsistencia'])->name('cursos.asistencias.guardar');
    Route::get('/docente/cursos/gestionar/asistencias/pdf', [DocenteController::class, 'generarPdfReporte'])->name('cursos.asistencias.pdf');
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

    // Rutas de Clases en Vivo (Módulo Docente)
    Route::get('docente/cursos/clases-en-vivo/obtener', [ClaseEnVivoController::class, 'index'])->middleware('auth')->name('cursos.clases.index');
    Route::post('docente/cursos/clases-en-vivo/crear', [ClaseEnVivoController::class, 'store'])->middleware('auth')->name('cursos.clases.store');
    Route::post('docente/cursos/clases-en-vivo/{id}/estado', [ClaseEnVivoController::class, 'cambiarEstado'])->middleware('auth')->name('cursos.clases.estado');
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

    /* Docentes */
    // Ruta de Gestión del Curso
    Route::get('/docente/horarios', [DocenteController::class, 'horarios'])->name('docente.horarios');
    Route::match(['get', 'post'], '/docente/cursos/gestionar', [DocenteController::class, 'gestionar'])->name('cursos.gestionar');
    Route::match(['get', 'post'], '/docente/mis-cursos', [DocenteController::class, 'misCursos'])->name('docente.cursos');
    Route::post('/docentes/buscar', [DocenteController::class, 'buscar'])->name('docentes.buscar');
    Route::resource('docentes', DocenteController::class);

    /* Administradores */
    Route::put('/administradores/{administrador}/estado', [AdministradorController::class, 'actualizarEstado'])->name('administradores.estado');
    Route::resource('administradores', AdministradorController::class)->except('show');

    /* Personal */
    Route::put('/personal/{personal}/estado', [PersonalController::class, 'actualizarEstado'])->name('personal.estado');
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

    Route::post('/estudiantes/filtrar',[EstudianteController::class, 'filtrar'])->name('estudiantes.filtrar');
    Route::post('estudiantes/importar', [EstudianteController::class, 'importarExcel'])->name('estudiantes.importar');

    Route::resource('estudiantes',EstudianteController::class)->parameters(['estudiantes' => 'postulante',])->except(['show',]);
    /*Estudiantes*/
    Route::post('/matriculas/filtrar', [MatriculaController::class, 'filtrar'])->name('matriculas.filtrar');
    // Ruta AJAX para obtener los horarios filtrados por Semestre y Periodo
    Route::get('/matriculas/horarios-por-semestre', [MatriculaController::class, 'obtenerHorariosPorSemestre'])->name('matriculas.horarios_semestre');

    Route::get('/matriculas/verificar-estudiante', [MatriculaController::class, 'verificarMatriculaEstudiante'])->name('matriculas.verificar_estudiante');
    Route::get('/matriculas/{id}/ficha', [MatriculaController::class, 'verFicha'])->name('matriculas.ficha');

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


    

});

require __DIR__ . '/auth.php';
