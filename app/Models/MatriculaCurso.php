<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class MatriculaCurso extends Model
{
    use HasFactory;

    protected $table = 'matricula_cursos';

    protected $primaryKey = 'id';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'id'              => 'integer',
            'matricula_id'    => 'integer',
            'curso_id'        => 'integer',
            'horario_id'      => 'integer',
            'fecha_matricula' => 'datetime',
            'created_at'      => 'datetime',
            'updated_at'      => 'datetime',
        ];
    }

    /* =========================================================================
     | RELACIONES BELONGS TO / THROUGH
     ========================================================================= */

    /**
     * Matrícula a la que pertenece este detalle.
     */
    public function matricula(): BelongsTo
    {
        return $this->belongsTo(
            Matricula::class,
            'matricula_id',
            'id'
        );
    }

    /**
     * Acceso directo al Postulante/Estudiante a través de la Matrícula.
     */
    public function estudiante(): HasOneThrough
    {
        return $this->hasOneThrough(
            Postulante::class,
            Matricula::class,
            'id',            // Clave primaria en matriculas
            'id_postulante', // Clave primaria en postulantes
            'matricula_id',  // Clave foránea en matricula_cursos
            'postulante_id'  // Clave foránea en matriculas
        );
    }

    /**
     * Alias compatible si utilizas el nombre alumno().
     */
    public function alumno(): HasOneThrough
    {
        return $this->estudiante();
    }

    /**
     * Curso asignado.
     */
    public function curso(): BelongsTo
    {
        return $this->belongsTo(
            Curso::class,
            'curso_id',
            'id'
        );
    }

    /**
     * Horario asignado al curso en esta matrícula.
     */
    public function horario(): BelongsTo
    {
        return $this->belongsTo(
            Horario::class,
            'horario_id',
            'id'
        );
    }

    /* =========================================================================
     | RELACIONES HAS MANY
     ========================================================================= */

    /**
     * Historial de asistencias de esta matrícula/alumno en el curso.
     */
    public function asistencias(): HasMany
    {
        return $this->hasMany(Asistencia::class, 'matricula_curso_id', 'id');
    }
}