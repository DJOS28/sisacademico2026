<?php

namespace App\Imports;

use App\Models\Curso;
use App\Models\ModuloFormativo;
use App\Models\PlanEstudio;
use App\Models\Semestre;
use App\Services\MoodleService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CursoImport implements
    ToCollection,
    WithHeadingRow,
    SkipsEmptyRows
{
    protected MoodleService $moodleService;
    private int $importados = 0;
    private int $omitidos = 0;
    private array $errores = [];

    public function __construct(MoodleService $moodleService)
    {
        $this->moodleService = $moodleService;
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $numeroFila = $index + 2; // +2 por la cabecera del Excel

            // 1. Extraer los textos y valores del Excel
            $planTexto     = trim((string) ($row['plan_estudio'] ?? $row['plan'] ?? $row['codigo_plan'] ?? ''));
            $semestreTexto = trim((string) ($row['semestre'] ?? $row['ciclo'] ?? ''));
            $moduloTexto   = trim((string) ($row['modulo'] ?? $row['modulo_formativo'] ?? $row['num_modulo'] ?? ''));

            $datos = [
                'nombre'            => trim((string) ($row['nombre'] ?? $row['curso'] ?? '')),
                'descripcion'       => $this->nullable($row['descripcion'] ?? null),
                'tipo'              => trim((string) ($row['tipo'] ?? 'Especialidad')),
                'creditos'          => $row['creditos'] ?? null,
                'horas_semestrales' => $row['horas_semestrales'] ?? $row['horas'] ?? null,
                'orden'             => $row['orden'] ?? 1,
            ];

            // 2. Validaciones iniciales de campos obligatorios
            $validator = Validator::make($datos, [
                'nombre'            => ['required', 'string', 'max:100'],
                'descripcion'       => ['nullable', 'string', 'max:3000'],
                'tipo'              => ['required', 'string', 'max:20'],
                'creditos'          => ['required', 'numeric', 'min:0', 'max:99.99'],
                'horas_semestrales' => ['required', 'integer', 'min:1'],
                'orden'             => ['required', 'integer', 'min:1'],
            ], [
                'nombre.required'            => 'El nombre del curso es obligatorio.',
                'creditos.required'          => 'Los créditos son obligatorios.',
                'horas_semestrales.required' => 'Las horas semestrales son obligatorias.',
            ]);

            if ($validator->fails()) {
                $this->registrarError($numeroFila, $validator->errors()->all());
                continue;
            }

            // 3. Buscar el Plan de Estudio por 'codigo' o por 'nombre'
            if ($planTexto === '') {
                $this->registrarError($numeroFila, ['Debe indicar el nombre o código del Plan de Estudio.']);
                continue;
            }

            $plan = PlanEstudio::where('codigo', $planTexto)
                ->orWhere('nombre', $planTexto)
                ->first();

            if (!$plan) {
                $this->registrarError($numeroFila, ["No se encontró el Plan de Estudio: '{$planTexto}'."]);
                continue;
            }

            // 4. Buscar el Semestre por 'nombre' (Ej: I, II, 1, 2, etc.)
            if ($semestreTexto === '') {
                $this->registrarError($numeroFila, ['Debe indicar el Semestre / Ciclo.']);
                continue;
            }

            $semestre = Semestre::where('nombre', $semestreTexto)
                ->orWhere('nombre', 'like', "%{$semestreTexto}%")
                ->first();

            if (!$semestre) {
                $this->registrarError($numeroFila, ["No se encontró el Semestre / Ciclo: '{$semestreTexto}'."]);
                continue;
            }

            // 5. Buscar el Módulo Formativo dentro del Plan de Estudio (por nombre o por num_modulo)
            if ($moduloTexto === '') {
                $this->registrarError($numeroFila, ['Debe indicar el Módulo Formativo.']);
                continue;
            }

            $modulo = ModuloFormativo::where('id_plan_estudio', $plan->id)
                ->where(function ($q) use ($moduloTexto) {
                    $q->where('nombre', $moduloTexto)
                      ->orWhere('nombre', 'like', "%{$moduloTexto}%")
                      ->orWhere('num_modulo', $moduloTexto);
                })
                ->first();

            if (!$modulo) {
                $this->registrarError($numeroFila, ["El módulo '{$moduloTexto}' no existe o no pertenece al plan '{$plan->nombre}'."]);
                continue;
            }

            // 6. Verificar si el curso ya existe para este Plan, Semestre y Módulo
            $duplicado = Curso::where('nombre', $datos['nombre'])
                ->where('semestre_id', $semestre->id)
                ->where('id_modulo', $modulo->id_modulo)
                ->whereHas('planesEstudio', function ($q) use ($plan) {
                    $q->where('planes_estudio.id', $plan->id);
                })
                ->exists();

            if ($duplicado) {
                $this->registrarError($numeroFila, ["El curso '{$datos['nombre']}' ya está registrado en este plan, semestre y módulo."]);
                continue;
            }

            // 7. Sincronización con Moodle (dentro de la categoría del Plan)
            $moodleCourseId = null;

            if ($plan->moodle_category_id) {
                try {
                    $codigoCorto = ($plan->codigo ? $plan->codigo . '-' : '') . 'CUR-' . uniqid();
                    $resMoodle = $this->moodleService->crearCurso(
                        $datos['nombre'],
                        $codigoCorto,
                        (int) $plan->moodle_category_id,
                        $datos['descripcion'] ?? ''
                    );

                    if (is_array($resMoodle) && isset($resMoodle[0]['id'])) {
                        $moodleCourseId = (int) $resMoodle[0]['id'];
                    }
                } catch (\Throwable $e) {
                    Log::error("Error creando curso masivo '{$datos['nombre']}' en Moodle: " . $e->getMessage());
                }
            }

            // 8. Inserción en la base de datos local y vinculación con la tabla pivot
            try {
                DB::transaction(function () use ($datos, $semestre, $modulo, $plan, $moodleCourseId): void {
                    $curso = Curso::create([
                        'nombre'            => $datos['nombre'],
                        'descripcion'       => $datos['descripcion'],
                        'semestre_id'       => $semestre->id,
                        'tipo'              => $datos['tipo'],
                        'id_modulo'         => $modulo->id_modulo,
                        'creditos'          => number_format((float) $datos['creditos'], 2, '.', ''),
                        'horas_semestrales' => (int) $datos['horas_semestrales'],
                        'orden'             => (int) $datos['orden'],
                        'moodle_course_id'  => $moodleCourseId,
                    ]);

                    $curso->planesEstudio()->attach($plan->id);
                });

                $this->importados++;
            } catch (\Throwable $e) {
                $this->registrarError($numeroFila, ['Error al guardar en base de datos: ' . $e->getMessage()]);
            }
        }
    }

    private function registrarError(int $fila, array $mensajes): void
    {
        $this->errores[] = [
            'fila'    => $fila,
            'mensaje' => $mensajes,
        ];
        $this->omitidos++;
    }

    public function importados(): int
    {
        return $this->importados;
    }

    public function omitidos(): int
    {
        return $this->omitidos;
    }

    public function errores(): array
    {
        return $this->errores;
    }

    private function nullable(mixed $valor): ?string
    {
        $valor = trim((string) $valor);
        return $valor !== '' ? $valor : null;
    }
}