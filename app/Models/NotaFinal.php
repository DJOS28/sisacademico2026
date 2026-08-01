<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotaFinal extends Model
{
    use HasFactory;

    protected $table = 'nota_final';

    protected $fillable = [
        'estudiante_id',
        'curso_id',
        'id_seccion',
        'id_periodo',
        'promedio',
        'usuario',
    ];

    protected $casts = [
        'promedio' => 'float',
    ];
}