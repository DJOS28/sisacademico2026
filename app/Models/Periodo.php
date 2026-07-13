<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Model;

class Periodo extends Model
{
    protected $table = 'periodos';

    protected $fillable = [
        'nombre',
        'descripcion',
        'fecha_inicio',
        'fecha_fin',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
            'fecha_fin' => 'date',
            'activo' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function planesEstudio(): BelongsToMany
{
    return $this->belongsToMany(
        PlanEstudio::class,
        'planes_estudio_periodos',
        'periodo_id',
        'plan_estudio_id'
    )->withTimestamps();
}
}
