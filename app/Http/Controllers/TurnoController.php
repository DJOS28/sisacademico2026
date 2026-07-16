<?php

namespace App\Http\Controllers;

use App\Models\Turno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TurnoController extends Controller
{
    /**
     * Muestra el listado inicial de turnos.
     */
    public function index(): Response
    {
        return Inertia::render('Turnos/Index', [
            'turnos' => $this->obtenerTurnos(),
            'filtros' => [
                'buscar' => '',
            ],
        ]);
    }

    /**
     * Filtra los turnos mediante AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:100',
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $buscar = trim((string) ($datos['buscar'] ?? ''));
        $pagina = (int) ($datos['page'] ?? 1);

        return response()->json([
            'turnos' => $this->obtenerTurnos(
                buscar: $buscar,
                pagina: $pagina
            ),
            'filtros' => [
                'buscar' => $buscar,
            ],
        ]);
    }

    /**
     * Muestra el formulario de registro.
     */
    public function create(): Response
    {
        return Inertia::render('Turnos/Create');
    }

    /**
     * Registra un turno.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        Turno::create([
            'nombre' => trim($datos['nombre']),
            'hora_inicio' => $datos['hora_inicio'],
            'hora_fin' => $datos['hora_fin'],
        ]);

        return to_route('turnos.index')
            ->with(
                'success',
                'Turno registrado correctamente.'
            );
    }

    /**
     * Muestra el formulario de edición.
     */
    public function edit(Turno $turno): Response
    {
        return Inertia::render('Turnos/Edit', [
            'turno' => [
                'id' => $turno->id,
                'nombre' => $turno->nombre,
                'hora_inicio' => $this->formatearHora(
                    $turno->hora_inicio
                ),
                'hora_fin' => $this->formatearHora(
                    $turno->hora_fin
                ),
            ],
        ]);
    }

    /**
     * Actualiza un turno.
     */
    public function update(
        Request $request,
        Turno $turno
    ): RedirectResponse {
        $datos = $this->validar($request, $turno);

        $turno->update([
            'nombre' => trim($datos['nombre']),
            'hora_inicio' => $datos['hora_inicio'],
            'hora_fin' => $datos['hora_fin'],
        ]);

        return to_route('turnos.index')
            ->with(
                'success',
                'Turno actualizado correctamente.'
            );
    }

    /**
     * Elimina un turno.
     */
    public function destroy(
        Turno $turno
    ): RedirectResponse {
        /*
         * Cuando se relacione con secciones, horarios u otras tablas,
         * valida aquí antes de eliminar.
         */

        $turno->delete();

        return back()->with(
            'success',
            'Turno eliminado correctamente.'
        );
    }

    /**
     * Consulta reutilizable para listado y filtrado.
     */
    private function obtenerTurnos(
    string $buscar = '',
    int $pagina = 1
) {
    $turnos = Turno::query()
        ->when(
            $buscar !== '',
            function ($query) use ($buscar) {
                $query->where(
                    function ($subquery) use ($buscar) {
                        $subquery
                            ->where(
                                'nombre',
                                'like',
                                "%{$buscar}%"
                            )
                            ->orWhere(
                                'hora_inicio',
                                'like',
                                "%{$buscar}%"
                            )
                            ->orWhere(
                                'hora_fin',
                                'like',
                                "%{$buscar}%"
                            );
                    }
                );
            }
        )
        ->orderBy('hora_inicio')
        ->paginate(
            perPage: 15,
            columns: ['*'],
            pageName: 'page',
            page: $pagina
        );

    $turnos->getCollection()->transform(
        function (Turno $turno) {
            $inicio = \Carbon\Carbon::createFromFormat(
                'H:i:s',
                $turno->getRawOriginal('hora_inicio')
            );

            $fin = \Carbon\Carbon::createFromFormat(
                'H:i:s',
                $turno->getRawOriginal('hora_fin')
            );

            $minutos = $inicio->diffInMinutes($fin);

            $horas = intdiv($minutos, 60);
            $restoMinutos = $minutos % 60;

            $turno->duracion = sprintf(
                '%02d h %02d min',
                $horas,
                $restoMinutos
            );

            return $turno;
        }
    );

    return $turnos;
}

    /**
     * Reglas de validación para registrar y actualizar.
     */
    private function validar(
        Request $request,
        ?Turno $turno = null
    ): array {
        return $request->validate(
            [
                'nombre' => [
                    'required',
                    'string',
                    'max:50',
                    Rule::unique('turnos', 'nombre')
                        ->ignore($turno?->id),
                ],
                'hora_inicio' => [
                    'required',
                    'date_format:H:i',
                ],
                'hora_fin' => [
                    'required',
                    'date_format:H:i',
                    'after:hora_inicio',
                ],
            ],
            [
                'nombre.required' =>
                    'El nombre del turno es obligatorio.',
                'nombre.unique' =>
                    'Ya existe un turno con este nombre.',
                'hora_inicio.required' =>
                    'La hora de inicio es obligatoria.',
                'hora_inicio.date_format' =>
                    'La hora de inicio no tiene un formato válido.',
                'hora_fin.required' =>
                    'La hora de fin es obligatoria.',
                'hora_fin.date_format' =>
                    'La hora de fin no tiene un formato válido.',
                'hora_fin.after' =>
                    'La hora de fin debe ser posterior a la hora de inicio.',
            ]
        );
    }

    /**
     * Convierte una hora del modelo al formato HH:mm.
     */
    private function formatearHora($hora): string
    {
        if ($hora === null) {
            return '';
        }

        if ($hora instanceof \DateTimeInterface) {
            return $hora->format('H:i');
        }

        return substr((string) $hora, 0, 5);
    }
}