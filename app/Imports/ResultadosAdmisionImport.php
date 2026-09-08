<?php

namespace App\Imports;

use App\Models\PlanEstudio;
use App\Models\Postulante;
use App\Models\ResultadoAdmision;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ResultadosAdmisionImport implements ToCollection, WithHeadingRow
{
    protected int $idProceso;
    protected int $filasProcesadas = 0;

    public function __construct(int $idProceso)
    {
        $this->idProceso = $idProceso;
    }

    public function collection(Collection $filas)
    {
        $errores = [];

        foreach ($filas as $index => $fila) {
            $numFila = $index + 2; // Compensar encabezado

            $dni = trim((string) ($fila['dni'] ?? ''));
            $codigoCarrera = trim((string) ($fila['codigo_carrera'] ?? ''));
            $nota = $fila['nota'] ?? null;
            $estado = strtolower(trim((string) ($fila['estado'] ?? '')));

            // Omitir filas totalmente vacías
            if ($dni === '' && $codigoCarrera === '') {
                continue;
            }

            // Validar existencia del postulante
            $postulante = Postulante::where('dni', $dni)->first();
            if (! $postulante) {
                $errores[] = "Fila {$numFila}: El DNI {$dni} no corresponde a ningún postulante registrado.";
                continue;
            }

            // Validar existencia del plan de estudio
            $plan = PlanEstudio::where('codigo', $codigoCarrera)->first();
            if (! $plan) {
                $errores[] = "Fila {$numFila}: La carrera con código '{$codigoCarrera}' no existe.";
                continue;
            }

            // Validar nota
            if (! is_numeric($nota) || $nota < 0 || $nota > 20) {
                $errores[] = "Fila {$numFila}: La nota ({$nota}) debe ser un número entre 0 y 20.";
                continue;
            }

            // Validar estado permitido
            $estadosValidos = ['con_vacante', 'sin_vacante', 'ausente', 'anulado'];
            if (! in_array($estado, $estadosValidos, true)) {
                $errores[] = "Fila {$numFila}: Estado '{$estado}' inválido. Use: con_vacante, sin_vacante, ausente o anulado.";
                continue;
            }

            // Guardar o actualizar resultado
            ResultadoAdmision::updateOrCreate(
                [
                    'id_proceso' => $this->idProceso,
                    'postulante_id' => $postulante->id_postulante,
                ],
                [
                    'plan_estudio_id' => $plan->id,
                    'nota' => (float) $nota,
                    'estado' => $estado,
                    'fecha_creacion' => now(),
                ]
            );

            $this->filasProcesadas++;
        }

        if (! empty($errores)) {
            throw ValidationException::withMessages([
                'archivo_excel' => $errores,
            ]);
        }
    }

    public function getFilasProcesadas(): int
    {
        return $this->filasProcesadas;
    }
}