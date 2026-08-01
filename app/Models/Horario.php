<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Horario extends Model
{
    protected $table = 'horarios';

    protected $fillable = [
        'id_docente',
        'id_curso',
        'hora_inicio',
        'hora_fin',
        'dia',
        'tipo_aula',
        'numero_aula',
        'id_aula',
        'id_periodo',
        'frecuencia',
        'capacidad',
        'id_plan_estudio',
        'id_seccion',
        'moodle_group_id',
        'id_turno',
    ];

    protected function casts(): array
    {
        return [
            'id_docente' => 'integer',
            'id_curso' => 'integer',
            'id_aula' => 'integer',
            'id_periodo' => 'integer',
            'capacidad' => 'integer',
            'id_plan_estudio' => 'integer',
            'id_seccion' => 'integer',
            'moodle_group_id' => 'integer',
            'id_turno' => 'integer',
        ];
    }

    /* =========================================================================
     | RELACIONES HAS MANY
     ========================================================================= */

    /**
     * Sesiones de clase programadas para este horario/sección.
     */
    public function sesiones(): HasMany
    {
        return $this->hasMany(
            Sesion::class,
            'horario_id', // Llave foránea en la tabla sesiones
            'id'         // Llave primaria en la tabla horarios
        );
    }

    /**
     * Alumnos matriculados en este horario específico a través de los cursos.
     */
    public function matriculaCursos(): HasMany
    {
        return $this->hasMany(
            MatriculaCurso::class,
            'horario_id', // Llave foránea en la tabla matricula_cursos
            'id'          // Llave primaria en la tabla horarios
        );
    }

    /* =========================================================================
     | RELACIONES BELONGS TO
     ========================================================================= */

    public function docente(): BelongsTo
    {
        return $this->belongsTo(Docente::class, 'id_docente', 'id');
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'id_curso', 'id');
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'id_aula', 'id');
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class, 'id_periodo', 'id');
    }

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class, 'id_plan_estudio', 'id');
    }

    public function seccion(): BelongsTo
    {
        return $this->belongsTo(Seccion::class, 'id_seccion', 'id');
    }

    public function turno(): BelongsTo
    {
        return $this->belongsTo(Turno::class, 'id_turno', 'id');
    }
}