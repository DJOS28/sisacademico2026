<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EstudiantesPlantillaExport implements FromArray, WithHeadings, ShouldAutoSize, WithStyles
{
    public function headings(): array
    {
        return [
            'dni',
            'nombres',
            'apellidos',
            'email',
            'telefono',
            'direccion',
            'año_egreso'
        ];
    }

    public function array(): array
    {
        return [
            [
                '78451296',
                'JUAN CARLOS',
                'PEREZ GOMEZ',
                'juan.perez@gmail.com',
                '987654321',
                'Jr. Lima 123',
                '2025'
            ]
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['argb' => 'FFFFFFFF'],
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF315D7A'], // Color institucional
                ],
            ],
        ];
    }
}