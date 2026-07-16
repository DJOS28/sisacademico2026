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
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware('auth')
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    /* Perfil */
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /* Docentes */
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
});

require __DIR__ . '/auth.php';
