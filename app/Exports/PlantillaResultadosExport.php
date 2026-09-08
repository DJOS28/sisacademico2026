<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PlantillaResultadosExport implements FromArray, WithHeadings, ShouldAutoSize, WithStyles
{
    public function headings(): array
    {
        return [
            'dni',
            'codigo_carrera',
            'nota',
            'estado',
        ];
    }

    public function array(): array
    {
        return [
            ['70000001', 'AP-01', '17.50', 'con_vacante'],
            ['70000002', 'ENF-01', '10.00', 'sin_vacante'],
            ['70000003', 'CONT-01', '0.00', 'ausente'],
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Pone la fila de encabezados en negrita
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}