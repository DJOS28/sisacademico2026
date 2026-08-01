<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResultadoAdmision extends Model
{
    use HasFactory;

    protected $table = 'resultados_admision';
    protected $primaryKey = 'id';

    protected $fillable = [
        'postulante_id',
        'plan_estudio_id',
        'nota',
        'estado',
        'fecha_creacion',
        'id_proceso',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'postulante_id' => 'integer',
            'plan_estudio_id' => 'integer',
            'nota' => 'decimal:2',
            'fecha_creacion' => 'datetime',
            'id_proceso' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function postulante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'postulante_id', 'id_postulante');
    }

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class, 'plan_estudio_id', 'id');
    }

    public function admision(): BelongsTo
    {
        return $this->belongsTo(Admision::class, 'id_proceso', 'id_admision');
    }

    public function scopePorEstado($query, ?string $estado)
    {
        return $estado ? $query->where('estado', $estado) : $query;
    }
}
