<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocenteController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\AdministradorController;
use App\Http\Controllers\PersonalController;
use App\Http\Controllers\DepartamentoController;
use App\Http\Controllers\DistritoController;
use App\Http\Controllers\InstitutoController;
use App\Http\Controllers\ProvinciaController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\PeriodoController;
use App\Http\Controllers\SemestreController;
use App\Http\Controllers\PlanEstudioController;
use App\Http\Controllers\ModuloFormativoController;
use App\Http\Controllers\CursoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Página principal
|--------------------------------------------------------------------------
*/

Route::redirect('/', '/login');

/*
|--------------------------------------------------------------------------
| Dashboard según rol
|--------------------------------------------------------------------------
*/

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth'])
    ->name('dashboard');

/*
|--------------------------------------------------------------------------
| Rutas protegidas
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Perfil
    |--------------------------------------------------------------------------
    */

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    /*
    |--------------------------------------------------------------------------
    | Docentes
    |--------------------------------------------------------------------------
    */

    Route::post('/docentes/buscar', [DocenteController::class, 'buscar'])->name('docentes.buscar');

    Route::resource('docentes', DocenteController::class);

    /*
    |--------------------------------------------------------------------------
    | Administradores
    |--------------------------------------------------------------------------
    */

    Route::prefix('administradores')
        ->name('administradores.')
        ->group(function () {

            Route::get('/', [
                AdministradorController::class,
                'index',
            ])->name('index');

            Route::get('/crear', [
                AdministradorController::class,
                'create',
            ])->name('create');

            Route::post('/', [
                AdministradorController::class,
                'store',
            ])->name('store');

            Route::get('/{administrador}/editar', [
                AdministradorController::class,
                'edit',
            ])->name('edit');

            Route::put('/{administrador}', [
                AdministradorController::class,
                'update',
            ])->name('update');

            Route::put('/{administrador}/estado', [
                AdministradorController::class,
                'actualizarEstado',
            ])->name('estado');

            Route::delete('/{administrador}', [
                AdministradorController::class,
                'destroy',
            ])->name('destroy');
        });

    /*
    |--------------------------------------------------------------------------
    | Personal
    |--------------------------------------------------------------------------
    */

    Route::prefix('personal')
        ->name('personal.')
        ->group(function () {

            Route::get('/', [
                PersonalController::class,
                'index',
            ])->name('index');

            Route::get('/crear', [
                PersonalController::class,
                'create',
            ])->name('create');

            Route::post('/', [
                PersonalController::class,
                'store',
            ])->name('store');

            Route::get('/{personal}/editar', [
                PersonalController::class,
                'edit',
            ])->name('edit');

            Route::put('/{personal}', [
                PersonalController::class,
                'update',
            ])->name('update');

            Route::put('/{personal}/estado', [
                PersonalController::class,
                'actualizarEstado',
            ])->name('estado');

            Route::delete('/{personal}', [
                PersonalController::class,
                'destroy',
            ])->name('destroy');
    });
    /*
    |--------------------------------------------------------------------------
    | Usuarios
    |--------------------------------------------------------------------------
    */

    Route::prefix('usuarios')
        ->name('usuarios.')
        ->group(function () {

            Route::get('/', [
                UsuarioController::class,
                'index',
            ])->name('index');

            Route::post('/buscar', [
                UsuarioController::class,
                'buscar',
            ])->name('buscar');

            Route::put('/{usuario}/clave', [
                UsuarioController::class,
                'cambiarClave',
            ])->name('cambiar-clave');

            Route::post('/{usuario}/resetear-clave', [
                UsuarioController::class,
                'resetearClave',
            ])->name('resetear-clave');

            Route::put('/{usuario}/roles', [
                UsuarioController::class,
                'actualizarRoles',
            ])->name('actualizar-roles');

            Route::put('/{usuario}/estado', [
                UsuarioController::class,
                'actualizarEstado',
            ])->name('actualizar-estado');

            /*
             * Debe ir al final por el parámetro dinámico.
             */
            Route::get('/{usuario}', [
                UsuarioController::class,
                'show',
            ])->name('show');
    });
     /*
    |--------------------------------------------------------------------------
    | Consultas dependientes
    |--------------------------------------------------------------------------
    */

    Route::get('/departamentos/{departamento}/provincias',[ProvinciaController::class, 'porDepartamento'])->name('provincias.por-departamento');

    Route::get('/provincias/{provincia}/distritos',[DistritoController::class, 'porProvincia'])->name('distritos.por-provincia');

    /*
    |--------------------------------------------------------------------------
    | Departamentos
    |--------------------------------------------------------------------------
    */

    Route::prefix('departamentos')->name('departamentos.')->group(function () 
    {

            Route::get('/', [DepartamentoController::class,'index',])->name('index');

            Route::get('/crear', [DepartamentoController::class,'create',])->name('create');
            Route::post('/', [
                DepartamentoController::class,
                'store',
            ])->name('store');

            Route::get('/{departamento}/editar', [
                DepartamentoController::class,
                'edit',
            ])->name('edit');

            Route::put('/{departamento}', [
                DepartamentoController::class,
                'update',
            ])->name('update');

            Route::delete('/{departamento}', [
                DepartamentoController::class,
                'destroy',
            ])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Provincias
    |--------------------------------------------------------------------------
    */

    Route::prefix('provincias')
        ->name('provincias.')
        ->group(function () {

            Route::get('/', [
                ProvinciaController::class,
                'index',
            ])->name('index');

            Route::get('/crear', [
                ProvinciaController::class,
                'create',
            ])->name('create');

            Route::post('/', [
                ProvinciaController::class,
                'store',
            ])->name('store');

            Route::get('/{provincia}/editar', [
                ProvinciaController::class,
                'edit',
            ])->name('edit');

            Route::put('/{provincia}', [
                ProvinciaController::class,
                'update',
            ])->name('update');

            Route::delete('/{provincia}', [
                ProvinciaController::class,
                'destroy',
            ])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Distritos
    |--------------------------------------------------------------------------
    */

    Route::prefix('distritos')
        ->name('distritos.')
        ->group(function () {

            Route::get('/', [
                DistritoController::class,
                'index',
            ])->name('index');

            Route::get('/crear', [
                DistritoController::class,
                'create',
            ])->name('create');

            Route::post('/', [
                DistritoController::class,
                'store',
            ])->name('store');

            Route::get('/{distrito}/editar', [
                DistritoController::class,
                'edit',
            ])->name('edit');

            Route::put('/{distrito}', [
                DistritoController::class,
                'update',
            ])->name('update');

            Route::delete('/{distrito}', [
                DistritoController::class,
                'destroy',
            ])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Instituto
    |--------------------------------------------------------------------------
    */

    Route::prefix('instituto')->name('instituto.')->group(function () 
    {

            Route::get('/', [
                InstitutoController::class,
                'index',
            ])->name('index');

            Route::get('/crear', [
                InstitutoController::class,
                'create',
            ])->name('create');

            Route::post('/', [
                InstitutoController::class,
                'store',
            ])->name('store');

            Route::get('/{instituto}/editar', [
                InstitutoController::class,
                'edit',
            ])->name('edit');

            Route::put('/{instituto}', [
                InstitutoController::class,
                'update',
            ])->name('update');

            Route::delete('/{instituto}', [
                InstitutoController::class,
                'destroy',
            ])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Areas
    |--------------------------------------------------------------------------
    */

    Route::prefix('areas')->name('areas.')->group(function ()
    {
            Route::get('/', [AreaController::class, 'index'])->name('index');
            Route::get('/crear', [AreaController::class, 'create'])->name('create');
            Route::post('/', [AreaController::class, 'store'])->name('store');
            Route::get('/{area}/editar', [AreaController::class, 'edit'])->name('edit');
            Route::put('/{area}', [AreaController::class, 'update'])->name('update');
            Route::put('/{area}/estado', [AreaController::class, 'actualizarEstado'])->name('estado');
            Route::delete('/{area}', [AreaController::class, 'destroy'])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Periodos
    |--------------------------------------------------------------------------
    */

    Route::prefix('periodos')
        ->name('periodos.')
        ->group(function () {
            Route::get(
                '/',
                [PeriodoController::class, 'index']
            )->name('index');

            Route::get(
                '/crear',
                [PeriodoController::class, 'create']
            )->name('create');

            Route::post(
                '/',
                [PeriodoController::class, 'store']
            )->name('store');

            Route::get(
                '/{periodo}/editar',
                [PeriodoController::class, 'edit']
            )->name('edit');

            Route::put(
                '/{periodo}',
                [PeriodoController::class, 'update']
            )->name('update');

            Route::put(
                '/{periodo}/activar',
                [PeriodoController::class, 'activar']
            )->name('activar');

            Route::put(
                '/{periodo}/desactivar',
                [PeriodoController::class, 'desactivar']
            )->name('desactivar');

            Route::delete(
                '/{periodo}',
                [PeriodoController::class, 'destroy']
            )->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Semestres
    |--------------------------------------------------------------------------
    */
    Route::prefix('semestres')
        ->name('semestres.')
        ->group(function () {
            Route::get(
                '/',
                [SemestreController::class, 'index']
            )->name('index');

            Route::get(
                '/crear',
                [SemestreController::class, 'create']
            )->name('create');

            Route::post(
                '/',
                [SemestreController::class, 'store']
            )->name('store');

            Route::get(
                '/{semestre}/editar',
                [SemestreController::class, 'edit']
            )->name('edit');

            Route::put(
                '/{semestre}',
                [SemestreController::class, 'update']
            )->name('update');

            Route::put(
                '/{semestre}/estado',
                [SemestreController::class, 'actualizarEstado']
            )->name('estado');

            Route::delete(
                '/{semestre}',
                [SemestreController::class, 'destroy']
            )->name('destroy');
    });

     /*
    |--------------------------------------------------------------------------
    | Rutas especiales de planes de estudio
    |--------------------------------------------------------------------------
    */

    Route::put(
        '/planes-estudio/{planEstudio}/estado',
        [PlanEstudioController::class, 'actualizarEstado']
    )->name('planes-estudio.estado');

    Route::get(
        '/planes-estudio/{planEstudio}/periodos',
        [PlanEstudioController::class, 'periodos']
    )->name('planes-estudio.periodos');

    Route::put(
        '/planes-estudio/{planEstudio}/periodos',
        [PlanEstudioController::class, 'sincronizarPeriodos']
    )->name('planes-estudio.periodos.sync');

    /*
    |--------------------------------------------------------------------------
    | CRUD de planes de estudio
    |--------------------------------------------------------------------------
    */

    Route::resource(
        'planes-estudio',
        PlanEstudioController::class
    )
        ->parameters([
            'planes-estudio' => 'planEstudio',
        ])
        ->except(['show']);

    Route::resource(
        'modulos-formativos',
        ModuloFormativoController::class
    )
        ->parameters([
            'modulos-formativos' => 'moduloFormativo',
        ])
        ->except(['show']);    

        Route::post('/cursos/importar',[CursoController::class, 'importar'])->name('cursos.importar');

        Route::resource('cursos',CursoController::class)->except(['show']);
});

/*
|--------------------------------------------------------------------------
| Autenticación
|--------------------------------------------------------------------------
*/

require __DIR__ . '/auth.php';