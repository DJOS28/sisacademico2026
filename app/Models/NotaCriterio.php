<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotaCriterio extends Model
{
    use HasFactory;

    protected $table = 'notas_criterios';

    protected $primaryKey = 'id';

    public $timestamps = true;

    protected $fillable = [
        'estudiante_id',
        'criterio_id',
        'id_seccion',
        'id_periodo',
        'nota',
    ];

    protected function casts(): array
    {
        return [
            'estudiante_id' => 'integer',
            'criterio_id'   => 'integer',
            'id_seccion'    => 'integer',
            'id_periodo'    => 'integer',
            'nota'          => 'float',
            'created_at'    => 'datetime',
            'updated_at'    => 'datetime',
        ];
    }

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'estudiante_id', 'id_postulante');
    }

    public function criterio(): BelongsTo
    {
        return $this->belongsTo(CriterioSubcomponente::class, 'criterio_id', 'id');
    }

    public function seccion(): BelongsTo
    {
        return $this->belongsTo(Seccion::class, 'id_seccion', 'id');
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class, 'id_periodo', 'id');
    }
}