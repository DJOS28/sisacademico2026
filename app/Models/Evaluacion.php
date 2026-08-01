<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluacion extends Model
{
    use HasFactory;

    protected $table = 'evaluaciones';
    protected $primaryKey = 'id_evaluacion';
    public $timestamps = false; // Se gestiona mediante 'fecha_registro'

    protected $fillable = [
        'curso_id',
        'seccion_id',
        'periodo_id',
        'nombre',
        'fecha_inicio',
        'hora_inicio',
        'fecha_fin',
        'hora_fin',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin'    => 'date',
    ];

    /**
     * Relación con el Curso al que pertenece la evaluación.
     */
    public function curso()
    {
        return $this->belongsTo(Curso::class, 'curso_id', 'id');
    }

    /**
     * Relación con la Sección a la que pertenece la evaluación.
     */
    public function seccion()
    {
        return $this->belongsTo(Seccion::class, 'seccion_id', 'id');
    }

    /**
     * Relación con el Periodo académico al que pertenece la evaluación.
     */
    public function periodo()
    {
        return $this->belongsTo(Periodo::class, 'periodo_id', 'id');
    }

    /**
     * Relación con las Preguntas de la evaluación.
     */
    public function preguntas()
    {
        return $this->hasMany(PreguntaEvaluacion::class, 'evaluacion_id', 'id_evaluacion');
    }
}