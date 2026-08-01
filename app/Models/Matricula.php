<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Matricula extends Model
{
    use HasFactory;

    protected $table = 'matriculas';

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'postulante_id' => 'integer',
            'plan_estudio_id' => 'integer',
            'periodo_id' => 'integer',
            'semestre_id' => 'integer',
            'fecha_matricula' => 'date:Y-m-d',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Estudiante matriculado.
     */
    public function postulante(): BelongsTo
    {
        return $this->belongsTo(
            Postulante::class,
            'postulante_id',
            'id_postulante'
        );
    }

    /**
     * Plan de estudios asignado.
     */
    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(
            PlanEstudio::class,
            'plan_estudio_id',
            'id'
        );
    }

    /**
     * Periodo académico (ej. 2026-I).
     */
    public function periodo(): BelongsTo
    {
        return $this->belongsTo(
            Periodo::class,
            'periodo_id',
            'id'
        );
    }

    /**
     * Semestre académico lectivo.
     */
    public function semestre(): BelongsTo
    {
        return $this->belongsTo(
            Semestre::class,
            'semestre_id',
            'id'
        );
    }

    /**
     * Acceso directo al detalle / filas de la tabla pivote intermedia.
     */
    public function cursosMatriculados(): HasMany
    {
        return $this->hasMany(
            MatriculaCurso::class,
            'matricula_id',
            'id'
        );
    }

    /**
     * Relación directa Muchos a Muchos con los Cursos.
     * Mapea con precisión quirúrgica tu tabla intermedia fisica 'matricula_cursos'.
     */
    public function cursos(): BelongsToMany
    {
        return $this->belongsToMany(
            Curso::class,
            'matricula_cursos',
            'matricula_id',
            'curso_id'
        )->withTimestamps()
         ->withPivot(['id', 'horario_id', 'estado', 'fecha_matricula']);
    }
}