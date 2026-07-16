<?php

namespace App\Imports;

use App\Models\Curso;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CursoImport implements
    ToCollection,
    WithHeadingRow,
    SkipsEmptyRows
{
    private int $importados = 0;
    private int $omitidos = 0;
    private array $errores = [];

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $numeroFila = $index + 2;

            $datos = [
                'nombre' => trim((string) ($row['nombre'] ?? '')),
                'descripcion' => $this->nullable(
                    $row['descripcion'] ?? null
                ),
                'plan_estudio_id' =>
                    $row['plan_estudio_id'] ?? null,
                'semestre_id' =>
                    $row['semestre_id'] ?? null,
                'tipo' => $this->nullable(
                    $row['tipo'] ?? null
                ),
                'id_modulo' =>
                    $row['id_modulo'] ?? null,
                'creditos' =>
                    $row['creditos'] ?? null,
                'horas_semestrales' =>
                    $row['horas_semestrales'] ?? null,
                'orden' =>
                    $row['orden'] ?? null,
            ];

            $validator = Validator::make($datos, [
                'nombre' => [
                    'required',
                    'string',
                    'max:100',
                ],
                'descripcion' => [
                    'nullable',
                    'string',
                ],
                'plan_estudio_id' => [
                    'required',
                    'integer',
                    'exists:planes_estudio,id',
                ],
                'semestre_id' => [
                    'required',
                    'integer',
                    'exists:semestres,id',
                ],
                'tipo' => [
                    'required',
                    'string',
                    'max:20',
                ],
                'id_modulo' => [
                    'required',
                    'integer',
                    'exists:modulos_formativos,id_modulo',
                ],
                'creditos' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:99.99',
                ],
                'horas_semestrales' => [
                    'required',
                    'integer',
                    'min:1',
                ],
                'orden' => [
                    'required',
                    'integer',
                    'min:1',
                ],
            ]);

            if ($validator->fails()) {
                $this->errores[] = [
                    'fila' => $numeroFila,
                    'mensaje' => $validator
                        ->errors()
                        ->all(),
                ];
                $this->omitidos++;
                continue;
            }

            $moduloPerteneceAlPlan = DB::table(
                'modulos_formativos'
            )
                ->where(
                    'id_modulo',
                    $datos['id_modulo']
                )
                ->where(
                    'id_plan_estudio',
                    $datos['plan_estudio_id']
                )
                ->exists();

            if (! $moduloPerteneceAlPlan) {
                $this->errores[] = [
                    'fila' => $numeroFila,
                    'mensaje' => [
                        'El módulo indicado no pertenece al plan de estudio seleccionado.',
                    ],
                ];
                $this->omitidos++;
                continue;
            }

            $duplicado = Curso::query()
                ->where('nombre', $datos['nombre'])
                ->where('semestre_id', $datos['semestre_id'])
                ->where('id_modulo', $datos['id_modulo'])
                ->whereHas(
                    'planesEstudio',
                    fn ($query) => $query->where(
                        'planes_estudio.id',
                        $datos['plan_estudio_id']
                    )
                )
                ->exists();

            if ($duplicado) {
                $this->errores[] = [
                    'fila' => $numeroFila,
                    'mensaje' => [
                        'El curso ya existe para el plan, semestre y módulo indicados.',
                    ],
                ];
                $this->omitidos++;
                continue;
            }

            DB::transaction(function () use ($datos): void {
                $curso = Curso::create([
                    'nombre' => $datos['nombre'],
                    'descripcion' => $datos['descripcion'],
                    'semestre_id' =>
                        (int) $datos['semestre_id'],
                    'tipo' => $datos['tipo'],
                    'id_modulo' =>
                        (int) $datos['id_modulo'],
                    'creditos' => number_format(
                        (float) $datos['creditos'],
                        2,
                        '.',
                        ''
                    ),
                    'horas_semestrales' =>
                        (int) $datos['horas_semestrales'],
                    'orden' =>
                        (int) $datos['orden'],
                ]);

                $curso->planesEstudio()->attach(
                    (int) $datos['plan_estudio_id']
                );
            });

            $this->importados++;
        }
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
