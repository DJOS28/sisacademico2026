<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlanEstudio extends Model
{
    use HasFactory;

    protected $table = 'planes_estudio';

    protected $primaryKey = 'id';

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
            'id'                 => 'integer',
            'activo'             => 'boolean',
            'moodle_category_id' => 'integer',
            'created_at'         => 'datetime',
            'updated_at'         => 'datetime',
        ];
    }

    /**
     * Periodos académicos en los que está habilitado el plan.
     */
    public function periodos(): BelongsToMany
    {
        return $this->belongsToMany(
            Periodo::class,
            'planes_estudio_periodos',
            'plan_estudio_id',
            'periodo_id'
        )->withTimestamps();
    }

    /**
     * Inscripciones efectuadas en este plan de estudio.
     */
    public function inscripciones(): HasMany
    {
        return $this->hasMany(
            Inscripcion::class,
            'id_plan', // <-- CORREGIDO: coincide con id_plan en la tabla 'inscripcion'
            'id'
        );
    }

    /**
     * Resultados de admisión asociados con el plan.
     */
    public function resultadosAdmision(): HasMany
    {
        return $this->hasMany(
            ResultadoAdmision::class,
            'id_plan', // <-- CORREGIDO: coincide con id_plan
            'id'
        );
    }

    /**
     * Módulos formativos pertenecientes al plan.
     */
    public function modulosFormativos(): HasMany
    {
        return $this->hasMany(
            ModuloFormativo::class,
            'id_plan_estudio',
            'id'
        );
    }

    /**
     * Cursos pertenecientes al plan de estudio.
     */
    public function cursos(): BelongsToMany
    {
        return $this->belongsToMany(
            Curso::class,
            'cursos_plan_estudio',
            'plan_estudio_id',
            'curso_id'
        );
    }

    /**
     * Ofertas laborales dirigidas a este plan o carrera.
     */
    public function ofertasLaborales(): HasMany
    {
        return $this->hasMany(
            OfertaLaboral::class,
            'id_plan_estudio',
            'id'
        );
    }

    /**
     * Filtra los planes de estudio activos.
     */
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Busca planes por nombre, código, resolución o tipo.
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
                ->orWhere('codigo', 'like', "%{$buscar}%")
                ->orWhere('resolucion', 'like', "%{$buscar}%")
                ->orWhere('tipo', 'like', "%{$buscar}%");
        });
    }

    /**
     * Filtra los planes disponibles para un periodo determinado.
     */
    public function scopeDelPeriodo($query, int $periodoId)
    {
        return $query->whereHas('periodos', function ($subquery) use ($periodoId) {
            $subquery->where('periodos.id', $periodoId);
        });
    }
}