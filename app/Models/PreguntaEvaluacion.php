<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PreguntaEvaluacion extends Model
{
    use HasFactory;

    protected $table = 'preguntas_evaluacion';
    protected $primaryKey = 'id_pregunta';
    public $timestamps = false; // Se gestiona mediante 'fecha_creacion'

    protected $fillable = [
        'evaluacion_id',
        'pregunta',
        'tipo',
        'puntaje',
        'imagen',
    ];

    protected $casts = [
        'puntaje' => 'float',
    ];

    /**
     * Relación con la Evaluación padre.
     */
    public function evaluacion()
    {
        return $this->belongsTo(Evaluacion::class, 'evaluacion_id', 'id_evaluacion');
    }

    /**
     * Relación con las Opciones de la pregunta.
     */
    public function opciones()
    {
        return $this->hasMany(OpcionPreguntaEvaluacion::class, 'pregunta_id', 'id_pregunta');
    }
}