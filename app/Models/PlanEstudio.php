<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
}