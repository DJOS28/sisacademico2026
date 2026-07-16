<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanEstudio extends Model
{
    protected $table = 'planes_estudio';

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
        'moodle_category_id',
        'codigo',
        'resolucion',
        'tipo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'moodle_category_id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function periodos(): BelongsToMany
    {
        return $this->belongsToMany(
            Periodo::class,
            'planes_estudio_periodos',
            'plan_estudio_id',
            'periodo_id'
        )->withTimestamps();
    }

    public function modulosFormativos(): HasMany
    {
        return $this->hasMany(
            ModuloFormativo::class,
            'id_plan_estudio',
            'id'
        );
    }

    public function cursos(): BelongsToMany
    {
        return $this->belongsToMany(
            Curso::class,
            'cursos_plan_estudio',
            'plan_estudio_id',
            'curso_id'
        );
    }
}