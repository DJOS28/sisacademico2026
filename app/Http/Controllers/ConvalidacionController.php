<?php

namespace App\Http\Controllers;

use App\Models\Convalidacion;
use App\Models\Matricula;
use App\Models\MatriculaCurso;
use App\Models\NotaFinal;
use App\Models\Periodo;
use App\Models\Postulante;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Instituto;
class ConvalidacionController extends Controller
{
    /**
     * Vista principal con listado paginado.
     */
    public function index(Request $request): Response
    {
        $buscar    = trim((string)$request->input('buscar', ''));
        $periodoId = $request->input('periodo_id', '');
        $estado    = $request->input('estado', '');

        $convalidaciones = $this->obtenerConsulta($buscar, $periodoId, $estado)
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Convalidaciones/Index', [
            'convalidaciones' => $convalidaciones,
            'periodos'        => Periodo::select('id', 'nombre')->get(),
            'estados'         => ['Pendiente', 'Aprobado', 'Rechazado'],
            'filtros'         => [
                'buscar'     => $buscar,
                'periodo_id' => $periodoId,
                'estado'     => $estado,
            ],
        ]);
    }

    /**
     * Filtrado dinámico procesado por POST (Inertia reload parcial).
     */
    public function filtrar(Request $request): Response
    {
        return $this->index($request);
    }

    /**
     * Muestra la vista para registrar un nuevo expediente.
     */
    public function create(): Response
    {
        // Se obtiene únicamente el Periodo Lectivo Activo
        $periodoActivo = Periodo::where('activo', 1)->first();

        return Inertia::render('Convalidaciones/Create', [
            'periodoActivo' => $periodoActivo,
        ]);
    }

    /**
     * Muestra la vista para editar un expediente existente.
     */
    public function edit(int $id): Response
    {
        $convalidacion = Convalidacion::with(['estudiante', 'cursoDestino', 'periodo'])->findOrFail($id);

        return Inertia::render('Convalidaciones/Edit', [
            'convalidacion' => $convalidacion,
            'periodos'      => Periodo::select('id', 'nombre')->get(),
        ]);
    }

    /**
     * Busca al estudiante por DNI y obtiene sus cursos matriculados en el periodo activo.
     */
    public function buscarEstudianteMatricula(Request $request): JsonResponse
    {
        $request->validate([
            'dni'        => 'required|string',
            'periodo_id' => 'required|integer|exists:periodos,id',
        ]);

        $dni       = trim($request->input('dni'));
        $periodoId = $request->input('periodo_id');

        // 1. Localizar al estudiante por DNI
        $estudiante = Postulante::select('id_postulante', 'nombres', 'apellidos', 'dni')
            ->where('dni', $dni)
            ->first();

        if (!$estudiante) {
            return response()->json([
                'encontrado'  => false,
                'matriculado' => false,
                'mensaje'     => 'No se encontró ningún estudiante registrado con el DNI ingresado.',
                'estudiante'  => null,
                'cursos'      => [],
            ]);
        }

        // 2. Verificar la matrícula activa del estudiante para ese periodo
        $matricula = Matricula::where('postulante_id', $estudiante->id_postulante)
            ->where('periodo_id', $periodoId)
            ->first();

        if (!$matricula) {
            return response()->json([
                'encontrado'  => true,
                'matriculado' => false,
                'mensaje'     => 'El estudiante ' . $estudiante->nombres . ' ' . $estudiante->apellidos . ' no cuenta con matrícula en el periodo lectivo activo.',
                'estudiante'  => $estudiante,
                'cursos'      => [],
            ]);
        }

        // 3. Obtener las asignaturas inscritas de su matrícula
        $cursos = MatriculaCurso::with('curso:id,nombre,creditos')
            ->where('matricula_id', $matricula->id)
            ->get()
            ->map(fn($det) => [
                'curso_id' => $det->curso_id,
                'nombre'   => $det->curso?->nombre ?? '---',
                'estado'   => $det->estado,
            ])
            ->unique('curso_id')
            ->values();

        return response()->json([
            'encontrado'  => true,
            'matriculado' => true,
            'mensaje'     => 'Estudiante y carga lectiva cargados correctamente.',
            'estudiante'  => $estudiante,
            'cursos'      => $cursos,
        ]);
    }

    /**
     * Guarda el expediente de convalidación en la base de datos.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $request->validate([
            'estudiante_id'       => 'required|integer|exists:postulantes,id_postulante',
            'curso_destino_id'    => 'required|integer|exists:cursos,id',
            'periodo_id'          => 'required|integer|exists:periodos,id',
            'institucion_origen'  => 'required|string|max:255',
            'curso_origen'        => 'required|string|max:255',
            'nota_origen'         => 'required|numeric|min:0|max:20',
            'fecha_convalidacion' => 'required|date',
            'estado'              => 'required|string|in:Pendiente,Aprobado,Rechazado',
            'observaciones'       => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($datos) {
                $convalidacion = Convalidacion::create($datos);

                if ($convalidacion->estado === 'Aprobado') {
                    $this->procesarAprobacionAcademicamente($convalidacion);
                }
            });

            return to_route('convalidaciones.index')->with('success', 'Expediente de convalidación registrado con éxito.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al guardar: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualiza el expediente y sincroniza la carga académica.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $convalidacion = Convalidacion::findOrFail($id);

        $datos = $request->validate([
            'institucion_origen'  => 'required|string|max:255',
            'curso_origen'        => 'required|string|max:255',
            'nota_origen'         => 'required|numeric|min:0|max:20',
            'fecha_convalidacion' => 'required|date',
            'estado'              => 'required|string|in:Pendiente,Aprobado,Rechazado',
            'observaciones'       => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($convalidacion, $datos) {
                $estadoPrevio = $convalidacion->estado;
                $convalidacion->update($datos);

                if ($estadoPrevio !== 'Aprobado' && $convalidacion->estado === 'Aprobado') {
                    $this->procesarAprobacionAcademicamente($convalidacion);
                }
            });

            return to_route('convalidaciones.index')->with('success', 'Convalidación actualizada correctamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Error al actualizar: ' . $e->getMessage()]);
        }
    }

    /**
     * Elimina el expediente de convalidación.
     */
    public function destroy(int $id): RedirectResponse
    {
        try {
            $convalidacion = Convalidacion::findOrFail($id);
            $convalidacion->delete();

            return to_route('convalidaciones.index')->with('success', 'Convalidación eliminada correctamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'No se pudo eliminar el expediente.']);
        }
    }

    /**
     * Prepara el query Builder para búsquedas y listado.
     */
    private function obtenerConsulta($buscar, $periodoId, $estado)
    {
        $query = Convalidacion::with(['estudiante', 'cursoDestino', 'periodo']);

        if ($buscar !== '') {
            $query->where(function ($q) use ($buscar) {
                $q->where('curso_origen', 'like', "%{$buscar}%")
                  ->orWhere('institucion_origen', 'like', "%{$buscar}%")
                  ->orWhereHas('estudiante', function ($sub) use ($buscar) {
                      $sub->where('dni', 'like', "%{$buscar}%")
                          ->orWhere('nombres', 'like', "%{$buscar}%")
                          ->orWhere('apellidos', 'like', "%{$buscar}%");
                  })
                  ->orWhereHas('cursoDestino', function ($sub) use ($buscar) {
                      $sub->where('nombre', 'like', "%{$buscar}%");
                  });
            });
        }

        if (!blank($periodoId)) {
            $query->where('periodo_id', $periodoId);
        }

        if (!blank($estado)) {
            $query->where('estado', $estado);
        }

        return $query->orderBy('id', 'desc');
    }

    /**
     * Sincroniza la matrícula e impacta el acta de notas finales.
     */
    private function procesarAprobacionAcademicamente(Convalidacion $convalidacion): void
    {
        $matricula = Matricula::where('postulante_id', $convalidacion->estudiante_id)
            ->where('periodo_id', $convalidacion->periodo_id)
            ->first();

        if ($matricula) {
            MatriculaCurso::where('matricula_id', $matricula->id)
                ->where('curso_id', $convalidacion->curso_destino_id)
                ->update(['estado' => 'Convalidado']);
        }

        NotaFinal::updateOrCreate(
            [
                'estudiante_id' => $convalidacion->estudiante_id,
                'curso_id'      => $convalidacion->curso_destino_id,
            ],
            [
                'id_periodo'    => $convalidacion->periodo_id,
                'promedio'      => round($convalidacion->nota_origen),
                'usuario'       => auth()->user()?->username ?? 'Sistema',
            ]
        );
    }

    public function generarPdf(int $id)
{
    $convalidacion = Convalidacion::with([
        'estudiante',
        'cursoDestino',
        'periodo'
    ])->findOrFail($id);

    $instituto = Instituto::with('distrito.provincia.departamento')->first();

    // Procesar Logo a Base64 para Dompdf
    $imagenBase64 = null;
    if ($instituto && !empty($instituto->logo) && file_exists(public_path('storage/' . $instituto->logo))) {
        $path = public_path('storage/' . $instituto->logo);
        $type = pathinfo($path, PATHINFO_EXTENSION);
        $data = file_get_contents($path);
        $imagenBase64 = 'data:image/' . $type . ';base64,' . base64_encode($data);
    }

    $pdf = Pdf::loadView('pdf.convalidacion', [
        'convalidacion' => $convalidacion,
        'instituto'     => $instituto,
        'imagenBase64'  => $imagenBase64,
    ]);

    return $pdf->stream('Convalidacion_Exp_' . str_pad($convalidacion->id, 6, '0', STR_PAD_LEFT) . '.pdf');
}
}