<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RespuestaEstudianteEvaluacion extends Model
{
    use HasFactory;

    protected $table = 'respuestas_estudiante_evaluacion';
    protected $primaryKey = 'id_respuesta';
    public $timestamps = false;

    protected $fillable = [
        'estudiante_id',
        'evaluacion_id',
        'pregunta_id',
        'opcion_id',
        'respuesta_texto',
        'es_correcta',
        'puntaje_obtenido',
    ];

    protected $casts = [
        'es_correcta'      => 'boolean',
        'puntaje_obtenido' => 'float',
    ];

    public function pregunta()
    {
        return $this->belongsTo(PreguntaEvaluacion::class, 'pregunta_id', 'id_pregunta');
    }

    public function opcion()
    {
        return $this->belongsTo(OpcionPreguntaEvaluacion::class, 'opcion_id', 'id_opcion');
    }
}