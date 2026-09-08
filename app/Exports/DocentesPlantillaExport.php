<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DocentesPlantillaExport implements FromArray, WithHeadings, WithStyles, ShouldAutoSize
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
            'departamento',
            'cargo'
        ];
    }

    public function array(): array
    {
        return [
            [
                '75247551',
                'GISELLA JESUS',
                'ANAYA MEJIA',
                'docente1@instituto.edu.pe',
                '987654321',
                'Av. Las Palmeras 123',
                'Ciencias de la Salud',
                'Docente Titular'
            ],
            [
                '44556677',
                'CARLOS ALBERTO',
                'MENDOZA SILVA',
                'cmendoza@instituto.edu.pe',
                '912345678',
                'Calle Los Pinos 456',
                'Tecnología e Informática',
                'Docente Contratado'
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
                    'size' => 11
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF315D7A'] // Color institucional
                ]
            ]
        ];
    }
}