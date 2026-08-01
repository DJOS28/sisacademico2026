<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asistencia extends Model
{
    use HasFactory;

    protected $table = 'asistencias';

    protected $fillable = [
        'sesion_id',
        'matricula_curso_id',
        'fecha',
        'estado', // 'presente', 'falta', 'tardanza', 'justificado'
        'observaciones',
    ];

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(Sesion::class, 'sesion_id', 'id_sesion');
    }

    public function matriculaCurso(): BelongsTo
    {
        return $this->belongsTo(MatriculaCurso::class, 'matricula_curso_id', 'id');
    }
}