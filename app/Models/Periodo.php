<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
class Periodo extends Model
{
    use HasFactory;

    protected $table = 'periodos';

    protected $primaryKey = 'id';

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
            'id' => 'integer',
            'fecha_inicio' => 'date:Y-m-d',
            'fecha_fin' => 'date:Y-m-d',
            'activo' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Procesos de admisión asociados al periodo.
     */
    public function admisiones(): HasMany
    {
        return $this->hasMany(
            Admision::class,
            'id_periodo',
            'id'
        );
    }

    /**
     * Planes de estudio habilitados durante el periodo.
     */
    public function planesEstudio(): BelongsToMany
    {
        return $this->belongsToMany(
            PlanEstudio::class,
            'planes_estudio_periodos',
            'periodo_id',
            'plan_estudio_id'
        )->withTimestamps();
    }

    /**
     * Filtra los periodos activos.
     */
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Filtra periodos vigentes según la fecha actual.
     */
    public function scopeVigente($query)
    {
        return $query
            ->where('activo', true)
            ->whereDate('fecha_inicio', '<=', now())
            ->whereDate('fecha_fin', '>=', now());
    }

    /**
     * Permite buscar por nombre o descripción.
     */
    public function scopeBuscar($query, ?string $buscar)
    {
        $buscar = trim((string) $buscar);

        if ($buscar === '') {
            return $query;
        }

        return $query->where(function ($subquery) use ($buscar) {
            $subquery
                ->where('nombre', 'like', "%{$buscar}%")
                ->orWhere('descripcion', 'like', "%{$buscar}%");
        });
    }
}