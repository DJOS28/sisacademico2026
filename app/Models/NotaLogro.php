<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotaLogro extends Model
{
    use HasFactory;

    protected $table = 'notas_logros';

    protected $fillable = [
        'estudiante_id',
        'curso_id',
        'id_seccion',
        'id_periodo',
        'logro_curso_id',
        'nota',
    ];

    protected $casts = [
        'nota' => 'float',
    ];

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'estudiante_id', 'id_postulante');
    }

    public function logro(): BelongsTo
    {
        return $this->belongsTo(LogroCurso::class, 'logro_curso_id', 'id');
    }
}