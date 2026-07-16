<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Curso extends Model
{
    protected $table = 'cursos';

    protected $fillable = [
        'nombre',
        'descripcion',
        'semestre_id',
        'tipo',
        'id_modulo',
        'creditos',
        'horas_semestrales',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'semestre_id' => 'integer',
            'id_modulo' => 'integer',
            'horas_semestrales' => 'integer',
            'orden' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function semestre(): BelongsTo
    {
        return $this->belongsTo(
            Semestre::class,
            'semestre_id',
            'id'
        );
    }

    public function moduloFormativo(): BelongsTo
    {
        return $this->belongsTo(
            ModuloFormativo::class,
            'id_modulo',
            'id_modulo'
        );
    }

    public function planesEstudio(): BelongsToMany
    {
        return $this->belongsToMany(
            PlanEstudio::class,
            'cursos_plan_estudio',
            'curso_id',
            'plan_estudio_id'
        );
    }
}
