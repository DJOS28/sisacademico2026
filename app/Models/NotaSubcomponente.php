<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotaSubcomponente extends Model
{
    use HasFactory;

    protected $table = 'notas_subcomponentes';

    protected $fillable = [
        'estudiante_id',
        'subcomponente_id',
        'id_seccion',
        'id_periodo',
        'nota',
    ];

    protected $casts = [
        'nota' => 'float',
    ];

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'estudiante_id', 'id_postulante');
    }

    public function subcomponente(): BelongsTo
    {
        return $this->belongsTo(SubcomponenteLogro::class, 'subcomponente_id', 'id');
    }
}