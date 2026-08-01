<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpcionPreguntaEvaluacion extends Model
{
    use HasFactory;

    protected $table = 'opciones_preguntas_evaluacion';
    protected $primaryKey = 'id_opcion';
    public $timestamps = false;

    protected $fillable = [
        'pregunta_id',
        'opcion',
        'es_correcta',
    ];

    protected $casts = [
        'es_correcta' => 'boolean',
    ];

    /**
     * Relación con la Pregunta padre.
     */
    public function pregunta()
    {
        return $this->belongsTo(PreguntaEvaluacion::class, 'pregunta_id', 'id_pregunta');
    }
}