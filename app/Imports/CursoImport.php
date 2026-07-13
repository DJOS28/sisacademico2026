<?php

namespace App\Imports;

use App\Models\Curso;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
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
                'semestre_id' => $row['semestre_id'] ?? null,
                'tipo' => $this->nullable(
                    $row['tipo'] ?? null
                ),
                'id_modulo' => $row['id_modulo'] ?? null,
                'creditos' => $row['creditos'] ?? null,
                'horas_semestrales' =>
                    $row['horas_semestrales'] ?? null,
                'orden' => $row['orden'] ?? null,
            ];

            $validator = Validator::make(
                $datos,
                [
                    'nombre' => [
                        'required',
                        'string',
                        'max:100',
                    ],
                    'descripcion' => [
                        'nullable',
                        'string',
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
                        'max:10000',
                    ],
                    'orden' => [
                        'required',
                        'integer',
                        'min:1',
                        'max:1000',
                    ],
                ],
                [],
                [
                    'semestre_id' => 'semestre',
                    'id_modulo' => 'módulo formativo',
                    'horas_semestrales' => 'horas semestrales',
                ]
            );

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

            $duplicado = Curso::query()
                ->where('nombre', $datos['nombre'])
                ->where('semestre_id', $datos['semestre_id'])
                ->where('id_modulo', $datos['id_modulo'])
                ->exists();

            if ($duplicado) {
                $this->errores[] = [
                    'fila' => $numeroFila,
                    'mensaje' => [
                        'El curso ya existe para el semestre y módulo indicados.',
                    ],
                ];

                $this->omitidos++;

                continue;
            }

            Curso::create([
                'nombre' => $datos['nombre'],
                'descripcion' => $datos['descripcion'],
                'semestre_id' => (int) $datos['semestre_id'],
                'tipo' => $datos['tipo'],
                'id_modulo' => (int) $datos['id_modulo'],
                'creditos' => number_format(
                    (float) $datos['creditos'],
                    2,
                    '.',
                    ''
                ),
                'horas_semestrales' =>
                    (int) $datos['horas_semestrales'],
                'orden' => (int) $datos['orden'],
            ]);

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
