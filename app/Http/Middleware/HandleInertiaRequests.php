<?php

namespace App\Http\Middleware;

use App\Models\Instituto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * La vista raíz que se carga en la primera visita.
     */
    protected $rootView = 'app';

    /**
     * Determina la versión actual de los assets.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Datos compartidos globalmente con todas las vistas Inertia.
     */
    public function share(Request $request): array
    {
        $usuario = $request->user();

        if ($usuario) {
            $usuario->loadMissing([
                'roles.modulos',
                'administrador',
                'docente',
                'cajero',
                'personal.area',
                'postulante',
                'areas',
            ]);
        }

        $perfil = $usuario?->perfil();

        $tipoPerfil = null;

        if ($usuario) {
            $tipoPerfil = match (true) {
                $usuario->administrador !== null => 'administrador',
                $usuario->docente !== null => 'docente',
                $usuario->cajero !== null => 'cajero',
                $usuario->personal !== null => 'personal',
                $usuario->postulante !== null => 'postulante',
                default => null,
            };
        }

        return [
            ...parent::share($request),

            /*
            |--------------------------------------------------------------------------
            | Usuario autenticado
            |--------------------------------------------------------------------------
            */
            'auth' => [
                'user' => $usuario
                    ? [
                        'id' => $usuario->id,
                        'username' => $usuario->username,
                        'status' => $usuario->status,

                        'img' => $this->publicFileUrl(
                            $usuario->img
                        ),

                        'nombre_completo' =>
                            $usuario->nombre_completo,

                        'rol_principal' =>
                            $usuario->rol_principal,

                        'roles' => $usuario->roles
                            ->pluck('nombre')
                            ->values()
                            ->all(),

                        'modulos' => $usuario->roles
                            ->flatMap(
                                fn ($rol) => $rol->modulos
                            )
                            ->unique('id')
                            ->map(
                                fn ($modulo) => [
                                    'id' => $modulo->id,
                                    'nombre' => $modulo->nombre,
                                    'codigo' => $modulo->codigo
                                        ?? null,
                                ]
                            )
                            ->values()
                            ->all(),

                        'perfil' => $perfil
                            ? [
                                'tipo' => $tipoPerfil,

                                'id' => $perfil->id
                                    ?? $perfil->id_postulante
                                    ?? null,

                                'nombre' => $perfil->nombre
                                    ?? $perfil->nombres
                                    ?? null,

                                'apellido' => $perfil->apellido
                                    ?? $perfil->apellidos
                                    ?? null,

                                'email' => $perfil->email
                                    ?? null,

                                'dni' => $perfil->dni
                                    ?? null,

                                'telefono' => $perfil->telefono
                                    ?? null,

                                'cargo' => $perfil->cargo
                                    ?? $perfil->puesto
                                    ?? $perfil->grado
                                    ?? null,

                                'foto' => $this->publicFileUrl(
                                    $perfil->foto_postulante
                                        ?? $usuario->img
                                        ?? null
                                ),

                                'area' => $perfil->area?->nombre
                                    ?? $usuario->areas
                                        ->first()?->nombre
                                    ?? null,

                                'areas' => $usuario->areas
                                    ->map(
                                        fn ($area) => [
                                            'id' => $area->id,
                                            'nombre' => $area->nombre,
                                            'activo' => (bool) (
                                                $area->pivot?->activo
                                                ?? true
                                            ),
                                        ]
                                    )
                                    ->values()
                                    ->all(),
                            ]
                            : null,
                    ]
                    : null,
            ],

            /*
            |--------------------------------------------------------------------------
            | Datos del instituto
            |--------------------------------------------------------------------------
            |
            | Estos datos estarán disponibles en cualquier componente mediante:
            |
            | const { instituto } = usePage().props;
            |
            */
            'instituto' => function (): ?array {
                $instituto = Instituto::query()
                    ->with([
                        'distrito.provincia.departamento',
                    ])
                    ->first();

                if (! $instituto) {
                    return null;
                }

                return [
                    'id' => $instituto->id,
                    'nombre' => $instituto->nombre,
                    'direccion' => $instituto->direccion,
                    'telefono' => $instituto->telefono,
                    'codigo_modular' =>
                        $instituto->codigo_modular,
                    'dre' => $instituto->dre,
                    'idDist' => $instituto->idDist,

                    'logo' => $this->publicFileUrl(
                        $instituto->logo
                    ),

                    'distrito' =>
                        $instituto->distrito?->Distrito,

                    'provincia' =>
                        $instituto
                            ->distrito
                            ?->provincia
                            ?->Provincia,

                    'departamento' =>
                        $instituto
                            ->distrito
                            ?->provincia
                            ?->departamento
                            ?->Departamento,

                    'ubicacion_completa' => collect([
                        $instituto->distrito?->Distrito,
                        $instituto
                            ->distrito
                            ?->provincia
                            ?->Provincia,
                        $instituto
                            ->distrito
                            ?->provincia
                            ?->departamento
                            ?->Departamento,
                    ])
                        ->filter()
                        ->implode(' - '),
                ];
            },

            /*
            |--------------------------------------------------------------------------
            | Mensajes flash
            |--------------------------------------------------------------------------
            */
            'flash' => [
                'success' => fn () =>
                    $request->session()->get('success'),

                'error' => fn () =>
                    $request->session()->get('error'),

                'warning' => fn () =>
                    $request->session()->get('warning'),

                'info' => fn () =>
                    $request->session()->get('info'),
            ],
        ];
    }

    /**
     * Convierte una ruta guardada en BD a una URL pública.
     */
    private function publicFileUrl(
        ?string $path
    ): ?string {
        if (! $path) {
            return null;
        }

        if (
            str_starts_with($path, 'http://') ||
            str_starts_with($path, 'https://') ||
            str_starts_with($path, '/storage/')
        ) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}