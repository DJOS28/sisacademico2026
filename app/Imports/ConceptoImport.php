<?php

namespace App\Imports;

use App\Models\Concepto;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ConceptoImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        if (empty($row['nombre'])) {
            return null;
        }

        return Concepto::updateOrCreate(
            ['nombre' => trim($row['nombre'])],
            [
                'precio'        => floatval($row['precio'] ?? 0),
                'tipo_concepto' => $row['tipo_concepto'] ?? $row['tipo'] ?? 'General',
                'activo'        => isset($row['activo']) ? intval($row['activo']) : 1,
            ]
        );
    }
}