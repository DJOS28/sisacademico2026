<?php

namespace App\Http\Controllers;

use App\Models\PlanEstudio;
use App\Models\PlanEstudioSupervisor;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlanEstudioSupervisorController extends Controller
{
    /**
     * Vista de gestión de asignaciones de supervisores
     */
    public function index(): Response
    {
        // 1. Obtener todos los planes de estudio con sus supervisores asignados
        $planes = PlanEstudio::with([
            'supervisoresAsignados.usuario.personal',
            'supervisoresAsignados.usuario.docente',
            'supervisoresAsignados.usuario.administrador',
        ])
        ->select('id', 'nombre', 'codigo', 'resolucion', 'tipo', 'activo')
        ->orderBy('nombre')
        ->get()
        ->map(function ($plan) {
            return [
                'id'           => $plan->id,
                'nombre'       => $plan->nombre,
                'codigo'       => $plan->codigo,
                'resolucion'   => $plan->resolucion,
                'tipo'         => $plan->tipo,
                'activo'       => $plan->activo,
                'supervisores' => $plan->supervisoresAsignados->map(function ($rel) {
                    $u = $rel->usuario;
                    
                    $nombreCompleto = $u?->personal ? "{$u->personal->apellido}, {$u->personal->nombre}" :
                        ($u?->docente ? "{$u->docente->apellido}, {$u->docente->nombre}" :
                        ($u?->administrador ? "{$u->administrador->apellido}, {$u->administrador->nombre}" : ($u?->nombre_completo ?? $u?->username)));

                    return [
                        'id'              => $rel->id,
                        'usuario_id'      => $rel->usuario_id,
                        'nombre_completo' => $nombreCompleto,
                        'username'        => $u?->username,
                        'activo'          => (bool) $rel->activo,
                        'asignado_el'     => $rel->created_at?->format('d/m/Y'),
                    ];
                }),
            ];
        });

        // 2. Filtrar ÚNICAMENTE los usuarios que tienen asignado el ROL SUPERVISOR (de Personal o Docentes)
        $usuariosDisponibles = Usuario::with(['personal', 'docente', 'administrador', 'roles'])
            ->whereHas('roles', function ($q) {
                $q->where('nombre', 'like', '%Supervisor%');
            })
            ->where('status', ['Activo', 'Disponible'])
            ->get()
            ->map(function ($u) {
                $nombreCompleto = null;
                $dni = null;
                $tipo = 'Usuario';

                if ($u->personal) {
                    $nombreCompleto = "{$u->personal->apellido}, {$u->personal->nombre}";
                    $dni = $u->personal->dni;
                    $tipo = 'Personal';
                } elseif ($u->docente) {
                    $nombreCompleto = "{$u->docente->apellido}, {$u->docente->nombre}";
                    $dni = $u->docente->dni;
                    $tipo = 'Docente';
                } elseif ($u->administrador) {
                    $nombreCompleto = "{$u->administrador->apellido}, {$u->administrador->nombre}";
                    $dni = $u->administrador->dni;
                    $tipo = 'Administración';
                } else {
                    $nombreCompleto = $u->username;
                    $dni = '---';
                }

                return [
                    'id'              => $u->id,
                    'nombre_completo' => $nombreCompleto,
                    'dni'             => $dni,
                    'username'        => $u->username,
                    'tipo'            => $tipo,
                ];
            })
            ->sortBy('nombre_completo')
            ->values();

        return Inertia::render('Supervision/AsignacionPlanes', [
            'planes'              => $planes,
            'usuariosDisponibles' => $usuariosDisponibles,
        ]);
    }

    /**
     * Asignar un supervisor a un plan de estudio
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'plan_estudio_id' => 'required|integer|exists:planes_estudio,id',
            'usuario_id'      => 'required|integer|exists:usuarios,id',
        ]);

        $asignacion = PlanEstudioSupervisor::updateOrCreate(
            [
                'plan_estudio_id' => $request->plan_estudio_id,
                'usuario_id'      => $request->usuario_id,
            ],
            [
                'activo' => 1,
            ]
        );

        $usuario = Usuario::with(['personal', 'docente', 'administrador'])->find($request->usuario_id);

        $nombreCompleto = $usuario?->personal ? "{$usuario->personal->apellido}, {$usuario->personal->nombre}" :
            ($usuario?->docente ? "{$usuario->docente->apellido}, {$usuario->docente->nombre}" :
            ($usuario?->administrador ? "{$usuario->administrador->apellido}, {$usuario->administrador->nombre}" : ($usuario?->nombre_completo ?? $usuario?->username)));

        return response()->json([
            'success' => true,
            'message' => 'Supervisor asignado exitosamente al plan de estudio.',
            'data'    => [
                'id'              => $asignacion->id,
                'usuario_id'      => $asignacion->usuario_id,
                'nombre_completo' => $nombreCompleto,
                'username'        => $usuario?->username,
                'activo'          => true,
                'asignado_el'     => date('d/m/Y'),
            ]
        ]);
    }

    /**
     * Alternar estado activo / inactivo de la asignación
     */
    public function toggleEstado($id): JsonResponse
    {
        $asignacion = PlanEstudioSupervisor::findOrFail($id);
        $asignacion->activo = !$asignacion->activo;
        $asignacion->save();

        return response()->json([
            'success' => true,
            'activo'  => (bool) $asignacion->activo,
            'message' => $asignacion->activo ? 'Supervisión reactivada.' : 'Supervisión pausada.',
        ]);
    }

    /**
     * Eliminar asignación
     */
    public function destroy($id): JsonResponse
    {
        $asignacion = PlanEstudioSupervisor::findOrFail($id);
        $asignacion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asignación eliminada correctamente.',
        ]);
    }
}