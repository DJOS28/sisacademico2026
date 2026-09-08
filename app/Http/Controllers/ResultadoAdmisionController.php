<?php

namespace App\Http\Controllers;

use App\Exports\PlantillaResultadosExport;
use App\Imports\ResultadosAdmisionImport;
use App\Models\Admision;
use App\Models\Inscripcion;
use App\Models\PlanEstudio;
use App\Models\ResultadoAdmision;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class ResultadoAdmisionController extends Controller
{
    /**
     * Muestra el listado general de resultados de admisión filtrados por proceso.
     */
    public function index(Request $request): Response
    {
        $filtros = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'id_proceso' => ['nullable', 'integer', 'exists:admisiones,id_admision'],
            'plan_estudio_id' => ['nullable', 'integer', 'exists:planes_estudio,id'],
            'estado' => ['nullable', 'string'],
            'por_pagina' => ['nullable', 'integer', Rule::in([10, 15, 25, 50])],
        ]);

        $resultados = ResultadoAdmision::query()
            ->with([
                'admision:id_admision,nombre,activo',
                'postulante:id_postulante,codigo_postulante,nombres,apellidos,dni',
                'planEstudio:id,nombre,codigo',
            ])
            ->when($filtros['buscar'] ?? null, function ($query, $buscar) {
                $query->whereHas('postulante', function ($sub) use ($buscar) {
                    $sub->where('codigo_postulante', 'like', "%{$buscar}%")
                        ->orWhere('dni', 'like', "%{$buscar}%")
                        ->orWhere('nombres', 'like', "%{$buscar}%")
                        ->orWhere('apellidos', 'like', "%{$buscar}%");
                });
            })
            ->when($filtros['id_proceso'] ?? null, fn ($q, $id) => $q->where('id_proceso', $id))
            ->when($filtros['plan_estudio_id'] ?? null, fn ($q, $id) => $q->where('plan_estudio_id', $id))
            ->porEstado($filtros['estado'] ?? null)
            ->orderByDesc('nota')
            ->paginate($filtros['por_pagina'] ?? 15)
            ->withQueryString();

        return Inertia::render('ResultadosAdmision/Index', [
            'resultados' => $resultados,
            'filtros' => [
                'buscar' => $filtros['buscar'] ?? '',
                'id_proceso' => $filtros['id_proceso'] ?? '',
                'plan_estudio_id' => $filtros['plan_estudio_id'] ?? '',
                'estado' => $filtros['estado'] ?? '',
                'por_pagina' => $filtros['por_pagina'] ?? 15,
            ],
            'admisiones' => Admision::query()->select('id_admision', 'nombre', 'activo')->orderByDesc('id_admision')->get(),
            'planesEstudio' => PlanEstudio::query()->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
        ]);
    }

    /**
     * Muestra el formulario para ingresar las notas/resultados.
     * Carga a los postulantes inscritos en el proceso seleccionado.
     */
    public function create(Request $request): Response
    {
        $idProceso = $request->input('id_proceso');

        $inscritos = [];
        if ($idProceso) {
            $inscritos = Inscripcion::query()
                ->where('id_admision', $idProceso)
                ->with([
                    'postulante:id_postulante,codigo_postulante,nombres,apellidos,dni',
                    'planEstudio:id,nombre,codigo',
                ])
                ->get()
                ->map(function ($inscripcion) {
                    $resultadoExistente = ResultadoAdmision::where('id_proceso', $inscripcion->id_admision)
                        ->where('postulante_id', $inscripcion->id_postulante)
                        ->first();

                    return [
                        'id_postulante' => $inscripcion->id_postulante,
                        'codigo_postulante' => $inscripcion->postulante?->codigo_postulante,
                        'nombres' => $inscripcion->postulante?->nombres,
                        'apellidos' => $inscripcion->postulante?->apellidos,
                        'dni' => $inscripcion->postulante?->dni,
                        'plan_estudio_id' => $inscripcion->id_plan,
                        'plan_nombre' => $inscripcion->planEstudio?->nombre,
                        'nota' => $resultadoExistente?->nota ?? '',
                        'estado' => $resultadoExistente?->estado ?? 'con_vacante',
                        'ya_registrado' => (bool) $resultadoExistente,
                    ];
                });
        }

        return Inertia::render('ResultadosAdmision/Create', [
            'admisiones' => Admision::query()->where('activo', 1)->select('id_admision', 'nombre')->orderByDesc('id_admision')->get(),
            'idProcesoSeleccionado' => $idProceso ? (int) $idProceso : null,
            'postulantesInscritos' => $inscritos,
        ]);
    }

    /**
     * Guarda o actualiza los resultados/notas del examen masivamente o individualmente.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'id_proceso' => ['required', 'integer', 'exists:admisiones,id_admision'],
            'resultados' => ['required', 'array', 'min:1'],
            'resultados.*.postulante_id' => ['required', 'integer', 'exists:postulantes,id_postulante'],
            'resultados.*.plan_estudio_id' => ['required', 'integer', 'exists:planes_estudio,id'],
            'resultados.*.nota' => ['required', 'numeric', 'min:0', 'max:20'],
            'resultados.*.estado' => ['required', Rule::in(['con_vacante', 'sin_vacante', 'ausente', 'anulado'])],
        ], [
            'id_proceso.required' => 'Seleccione el proceso de admisión.',
            'resultados.required' => 'No hay postulantes cargados para calificar.',
            'resultados.*.nota.required' => 'Ingrese una nota válida para el postulante.',
            'resultados.*.nota.max' => 'La nota máxima es 20.',
            'resultados.*.estado.required' => 'Seleccione si alcanzó vacante o no.',
        ]);

        DB::transaction(function () use ($datos) {
            foreach ($datos['resultados'] as $res) {
                ResultadoAdmision::updateOrCreate(
                    [
                        'id_proceso' => $datos['id_proceso'],
                        'postulante_id' => $res['postulante_id'],
                    ],
                    [
                        'plan_estudio_id' => $res['plan_estudio_id'],
                        'nota' => $res['nota'],
                        'estado' => $res['estado'],
                        'fecha_creacion' => now(),
                    ]
                );
            }
        });

        return redirect()->route('resultados-admision.index', ['id_proceso' => $datos['id_proceso']])
            ->with('success', 'Los resultados de admisión han sido procesados correctamente.');
    }

    /**
     * Muestra la ficha detallada de un resultado de admisión.
     */
    public function show(ResultadoAdmision $resultadoAdmision): Response
    {
        $resultadoAdmision->load([
            'admision:id_admision,nombre',
            'postulante:id_postulante,codigo_postulante,nombres,apellidos,dni',
            'planEstudio:id,nombre,codigo',
        ]);

        return Inertia::render('ResultadosAdmision/Show', [
            'resultado' => $resultadoAdmision,
        ]);
    }

    /**
     * Muestra la vista de edición individual para un resultado.
     */
    public function edit(ResultadoAdmision $resultadoAdmision): Response
    {
        $resultadoAdmision->load([
            'admision:id_admision,nombre',
            'postulante:id_postulante,codigo_postulante,nombres,apellidos,dni',
            'planEstudio:id,nombre,codigo',
        ]);

        return Inertia::render('ResultadosAdmision/Edit', [
            'resultado' => $resultadoAdmision,
            'planesEstudio' => PlanEstudio::query()->select('id', 'nombre', 'codigo')->orderBy('nombre')->get(),
        ]);
    }

    /**
     * Actualiza un resultado de admisión individual.
     */
    public function update(Request $request, ResultadoAdmision $resultadoAdmision): RedirectResponse
    {
        $datos = $request->validate([
            'plan_estudio_id' => ['required', 'integer', 'exists:planes_estudio,id'],
            'nota' => ['required', 'numeric', 'min:0', 'max:20'],
            'estado' => ['required', Rule::in(['con_vacante', 'sin_vacante', 'ausente', 'anulado'])],
        ]);

        $resultadoAdmision->update($datos);

        return redirect()->route('resultados-admision.index', ['id_proceso' => $resultadoAdmision->id_proceso])
            ->with('success', 'El resultado fue actualizado con éxito.');
    }

    /**
     * Elimina un registro de resultado.
     */
    public function destroy(ResultadoAdmision $resultadoAdmision): RedirectResponse
    {
        try {
            $resultadoAdmision->delete();
            return back()->with('success', 'Resultado eliminado de la lista.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar el resultado seleccionado.');
        }
    }

    /**
     * Procesa la carga masiva desde un archivo Excel/CSV.
     */
    public function importar(Request $request): RedirectResponse
    {
        $request->validate([
            'id_proceso' => ['required', 'integer', 'exists:admisiones,id_admision'],
            'archivo_excel' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
        ], [
            'id_proceso.required' => 'Debe seleccionar a qué proceso de admisión pertenecen estos resultados.',
            'archivo_excel.required' => 'Seleccione un archivo de Excel o CSV para subir.',
            'archivo_excel.mimes' => 'El formato del archivo debe ser .xlsx, .xls o .csv.',
        ]);

        try {
            $importador = new ResultadosAdmisionImport((int) $request->input('id_proceso'));
            Excel::import($importador, $request->file('archivo_excel'));

            return redirect()->route('resultados-admision.index', ['id_proceso' => $request->input('id_proceso')])
                ->with('success', "Se importaron con éxito {$importador->getFilasProcesadas()} resultados.");
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $th) {
            report($th);
            return back()->with('error', 'Error al procesar el archivo: ' . $th->getMessage());
        }
    }

    /**
     * Descarga la plantilla nativa de Excel (.xlsx).
     */
    public function descargarPlantilla(): BinaryFileResponse
    {
        return Excel::download(
            new PlantillaResultadosExport,
            'plantilla_resultados_admision.xlsx',
            ExcelFormat::XLSX
        );
    }
}