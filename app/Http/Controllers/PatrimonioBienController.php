<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Models\Aula;
use App\Models\PatrimonioBien;
use App\Models\PatrimonioCategoria;
use App\Models\Personal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PatrimonioBienController extends Controller
{
    /**
     * Listado general del inventario patrimonial.
     */
    public function index(Request $request): Response
    {
        $buscar             = trim((string) $request->input('buscar', ''));
        $categoriaId        = $request->input('categoria_id');
        $situacion          = trim((string) $request->input('situacion', ''));
        $estadoConservacion = trim((string) $request->input('estado_conservacion', ''));
        $aulaId             = $request->input('aula_id');
        $areaId             = $request->input('area_id');

        $bienes = PatrimonioBien::query()
            ->with([
                'categoria:id,codigo,nombre',
                'aula:id,nombre,numero_aula,id_pabellon',
                'aula.pabellon:id,nombre',
                'area:id,nombre',
                'responsable:id,dni,nombre,apellido',
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_patrimonial', 'like', "%{$buscar}%")
                        ->orWhere('denominacion', 'like', "%{$buscar}%")
                        ->orWhere('marca', 'like', "%{$buscar}%")
                        ->orWhere('modelo', 'like', "%{$buscar}%")
                        ->orWhere('serie', 'like', "%{$buscar}%");
                });
            })
            ->when(! blank($categoriaId), fn ($q) => $q->where('categoria_id', $categoriaId))
            ->when($situacion !== '', fn ($q) => $q->where('situacion', $situacion))
            ->when($estadoConservacion !== '', fn ($q) => $q->where('estado_conservacion', $estadoConservacion))
            ->when(! blank($aulaId), fn ($q) => $q->where('aula_id', $aulaId))
            ->when(! blank($areaId), fn ($q) => $q->where('area_id', $areaId))
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Patrimonio/Bienes/Index', [
            'bienes'             => $bienes,
            'categorias'         => PatrimonioCategoria::where('activo', 1)->select('id', 'codigo', 'nombre')->orderBy('nombre')->get(),
            'aulas'              => Aula::with('pabellon:id,nombre')->select('id', 'nombre', 'numero_aula', 'id_pabellon')->orderBy('nombre')->get(),
            'areas'              => Area::where('estado', 'Activo')->select('id', 'nombre')->orderBy('nombre')->get(),
            'personal'           => Personal::select('id', 'dni', 'nombre', 'apellido')->orderBy('apellido')->get(),
            'situaciones'        => ['Operativo', 'En_Mantenimiento', 'Inoperativo', 'De_Baja'],
            'estadosConservacion'=> ['Nuevo', 'Bueno', 'Regular', 'Malo', 'Chatarra'],
            'filtros'            => [
                'buscar'              => $buscar,
                'categoria_id'        => $categoriaId ?? '',
                'situacion'           => $situacion,
                'estado_conservacion' => $estadoConservacion,
                'aula_id'             => $aulaId ?? '',
                'area_id'             => $areaId ?? '',
            ],
        ]);
    }

    /**
     * Filtrado dinámico vía AJAX.
     */
    public function filtrar(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'buscar'              => ['nullable', 'string', 'max:100'],
            'categoria_id'        => ['nullable', 'integer', 'exists:patrimonio_categorias,id'],
            'situacion'           => ['nullable', 'string', 'in:Operativo,En_Mantenimiento,Inoperativo,De_Baja'],
            'estado_conservacion' => ['nullable', 'string', 'in:Nuevo,Bueno,Regular,Malo,Chatarra'],
            'aula_id'             => ['nullable', 'integer', 'exists:aulas,id'],
            'area_id'             => ['nullable', 'integer', 'exists:areas,id'],
            'page'                => ['nullable', 'integer', 'min:1'],
        ]);

        $buscar             = trim((string) ($datos['buscar'] ?? ''));
        $categoriaId        = $datos['categoria_id'] ?? null;
        $situacion          = trim((string) ($datos['situacion'] ?? ''));
        $estadoConservacion = trim((string) ($datos['estado_conservacion'] ?? ''));
        $aulaId             = $datos['aula_id'] ?? null;
        $areaId             = $datos['area_id'] ?? null;
        $pagina             = (int) ($datos['page'] ?? 1);

        $bienes = PatrimonioBien::query()
            ->with([
                'categoria:id,codigo,nombre',
                'aula:id,nombre,numero_aula,id_pabellon',
                'aula.pabellon:id,nombre',
                'area:id,nombre',
                'responsable:id,dni,nombre,apellido',
            ])
            ->when($buscar !== '', function ($query) use ($buscar) {
                $query->where(function ($sub) use ($buscar) {
                    $sub->where('codigo_patrimonial', 'like', "%{$buscar}%")
                        ->orWhere('denominacion', 'like', "%{$buscar}%")
                        ->orWhere('marca', 'like', "%{$buscar}%")
                        ->orWhere('modelo', 'like', "%{$buscar}%")
                        ->orWhere('serie', 'like', "%{$buscar}%");
                });
            })
            ->when(! blank($categoriaId), fn ($q) => $q->where('categoria_id', $categoriaId))
            ->when($situacion !== '', fn ($q) => $q->where('situacion', $situacion))
            ->when($estadoConservacion !== '', fn ($q) => $q->where('estado_conservacion', $estadoConservacion))
            ->when(! blank($aulaId), fn ($q) => $q->where('aula_id', $aulaId))
            ->when(! blank($areaId), fn ($q) => $q->where('area_id', $areaId))
            ->orderByDesc('id')
            ->paginate(perPage: 10, columns: ['*'], pageName: 'page', page: $pagina);

        return response()->json(['bienes' => $bienes]);
    }

    /**
     * Registra un nuevo bien patrimonial en el inventario.
     */
    public function store(Request $request): RedirectResponse
    {
        $datos = $this->validar($request);

        DB::transaction(function () use ($datos, $request) {
            $fotoPath = null;
            if ($request->hasFile('foto')) {
                $fotoPath = $request->file('foto')->store('patrimonio/bienes', 'public');
            }

            // Si no se especifica código, autogenerar correlativo
            $codigoPatrimonial = ! empty($datos['codigo_patrimonial'])
                ? strtoupper(trim($datos['codigo_patrimonial']))
                : 'PAT-' . date('Y') . '-' . str_pad((PatrimonioBien::max('id') + 1), 6, '0', STR_PAD_LEFT);

            PatrimonioBien::create([
                'codigo_patrimonial'     => $codigoPatrimonial,
                'categoria_id'           => $datos['categoria_id'],
                'denominacion'           => trim($datos['denominacion']),
                'marca'                  => $this->normalizarNullable($datos['marca'] ?? null),
                'modelo'                 => $this->normalizarNullable($datos['modelo'] ?? null),
                'serie'                  => $this->normalizarNullable($datos['serie'] ?? null),
                'color'                  => $this->normalizarNullable($datos['color'] ?? null),
                'dimensiones'            => $this->normalizarNullable($datos['dimensiones'] ?? null),
                'estado_conservacion'    => $datos['estado_conservacion'],
                'situacion'              => $datos['situacion'],
                'valor_adquisicion'      => $datos['valor_adquisicion'] ?? 0.00,
                'fecha_adquisicion'      => $datos['fecha_adquisicion'] ?? null,
                'aula_id'                => $datos['aula_id'] ?? null,
                'area_id'                => $datos['area_id'] ?? null,
                'responsable_personal_id'=> $datos['responsable_personal_id'] ?? null,
                'foto'                   => $fotoPath,
                'observaciones'          => $this->normalizarNullable($datos['observaciones'] ?? null),
            ]);
        });

        return back()->with('success', 'Bien patrimonial incorporado al inventario con éxito.');
    }

    /**
     * Actualiza la información técnica y física del bien.
     */
    public function update(Request $request, PatrimonioBien $biene): RedirectResponse
    {
        $datos = $this->validar($request, $biene);

        DB::transaction(function () use ($datos, $request, $biene) {
            $fotoPath = $biene->foto;

            if ($request->hasFile('foto')) {
                if (! empty($biene->foto) && Storage::disk('public')->exists($biene->foto)) {
                    Storage::disk('public')->delete($biene->foto);
                }
                $fotoPath = $request->file('foto')->store('patrimonio/bienes', 'public');
            }

            $biene->update([
                'codigo_patrimonial'     => strtoupper(trim($datos['codigo_patrimonial'])),
                'categoria_id'           => $datos['categoria_id'],
                'denominacion'           => trim($datos['denominacion']),
                'marca'                  => $this->normalizarNullable($datos['marca'] ?? null),
                'modelo'                 => $this->normalizarNullable($datos['modelo'] ?? null),
                'serie'                  => $this->normalizarNullable($datos['serie'] ?? null),
                'color'                  => $this->normalizarNullable($datos['color'] ?? null),
                'dimensiones'            => $this->normalizarNullable($datos['dimensiones'] ?? null),
                'estado_conservacion'    => $datos['estado_conservacion'],
                'situacion'              => $datos['situacion'],
                'valor_adquisicion'      => $datos['valor_adquisicion'] ?? 0.00,
                'fecha_adquisicion'      => $datos['fecha_adquisicion'] ?? null,
                'aula_id'                => $datos['aula_id'] ?? null,
                'area_id'                => $datos['area_id'] ?? null,
                'responsable_personal_id'=> $datos['responsable_personal_id'] ?? null,
                'foto'                   => $fotoPath,
                'observaciones'          => $this->normalizarNullable($datos['observaciones'] ?? null),
            ]);
        });

        return back()->with('success', 'Bien patrimonial actualizado correctamente.');
    }

    /**
     * Elimina el bien y su fotografía adjunta.
     */
    public function destroy(PatrimonioBien $biene): RedirectResponse
    {
        try {
            DB::transaction(function () use ($biene) {
                if (! empty($biene->foto) && Storage::disk('public')->exists($biene->foto)) {
                    Storage::disk('public')->delete($biene->foto);
                }

                $biene->delete();
            });

            return back()->with('success', 'Bien patrimonial eliminado del inventario.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'No se pudo eliminar el bien patrimonial.');
        }
    }

    /**
     * Validación de campos de formulario.
     */
    private function validar(Request $request, ?PatrimonioBien $biene = null): array
    {
        return $request->validate([
            'codigo_patrimonial'     => ['nullable', 'string', 'max:50', Rule::unique('patrimonio_bienes', 'codigo_patrimonial')->ignore($biene?->id)],
            'categoria_id'           => ['required', 'integer', 'exists:patrimonio_categorias,id'],
            'denominacion'           => ['required', 'string', 'max:255'],
            'marca'                  => ['nullable', 'string', 'max:100'],
            'modelo'                 => ['nullable', 'string', 'max:100'],
            'serie'                  => ['nullable', 'string', 'max:100'],
            'color'                  => ['nullable', 'string', 'max:50'],
            'dimensiones'            => ['nullable', 'string', 'max:100'],
            'estado_conservacion'    => ['required', 'string', 'in:Nuevo,Bueno,Regular,Malo,Chatarra'],
            'situacion'              => ['required', 'string', 'in:Operativo,En_Mantenimiento,Inoperativo,De_Baja'],
            'valor_adquisicion'      => ['nullable', 'numeric', 'min:0'],
            'fecha_adquisicion'      => ['nullable', 'date'],
            'aula_id'                => ['nullable', 'integer', 'exists:aulas,id'],
            'area_id'                => ['nullable', 'integer', 'exists:areas,id'],
            'responsable_personal_id'=> ['nullable', 'integer', 'exists:personal,id'],
            'foto'                   => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // 5MB
            'observaciones'          => ['nullable', 'string', 'max:1000'],
        ], [
            'categoria_id.required'        => 'Debe seleccionar la categoría del bien.',
            'denominacion.required'        => 'La denominación o descripción del bien es obligatoria.',
            'estado_conservacion.required' => 'Debe indicar el estado de conservación.',
            'situacion.required'           => 'Debe indicar la situación operativa.',
        ]);
    }

    /**
     * Limpia cadenas vacías a null.
     */
    private function normalizarNullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);
        return $valor !== '' ? $valor : null;
    }
}