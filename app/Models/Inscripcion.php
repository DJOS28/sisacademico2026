<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Inscripcion extends Model
{
    use HasFactory;

    protected $table = 'inscripcion';
    protected $primaryKey = 'id_inscripcion';

    public const ESTADOS = [
        'inscrito',
        'observado',
        'subsanado',
        'aceptado',
        'matriculado',
    ];

    protected $fillable = [
        'id_admision',
        'id_postulante',
        'id_plan',
        'segunda_opcion',
        'fecha_registro',
        'estado',
        'observacion',
    ];

    protected function casts(): array
    {
        return [
            'id_inscripcion' => 'integer',
            'id_admision' => 'integer',
            'id_postulante' => 'integer',
            'id_plan' => 'integer',
            'fecha_registro' => 'datetime',
        ];
    }

    public function admision(): BelongsTo
    {
        return $this->belongsTo(Admision::class, 'id_admision', 'id_admision');
    }

    public function postulante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'id_postulante', 'id_postulante');
    }

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class, 'id_plan', 'id');
    }

    public function scopePorEstado($query, ?string $estado)
    {
        return $estado ? $query->where('estado', $estado) : $query;
    }

    public function scopePorAdmision($query, $admisionId)
    {
        return $admisionId ? $query->where('id_admision', $admisionId) : $query;
    }
}
