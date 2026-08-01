<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotaFinalEvaluacion extends Model
{
    use HasFactory;

    protected $table = 'notas_finales_evaluacion';
    protected $primaryKey = 'id_nota';
    public $timestamps = false; // Se gestiona con fecha_evaluacion

    protected $fillable = [
        'estudiante_id',
        'evaluacion_id',
        'nota_final',
        'fecha_evaluacion',
    ];

    protected $casts = [
        'nota_final' => 'float',
    ];

    /**
     * Relación con la Evaluación rendida.
     */
    public function evaluacion()
    {
        return $this->belongsTo(Evaluacion::class, 'evaluacion_id', 'id_evaluacion');
    }

    /**
     * Relación con el Estudiante (ajustar modelo si aplica).
     */
    public function estudiante()
    {
        return $this->belongsTo(Estudiante::class, 'estudiante_id', 'id');
    }
}