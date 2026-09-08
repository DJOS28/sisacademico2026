<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ArchivoCurso;

class Sesion extends Model
{
    use HasFactory;

    protected $table = 'sesiones';
    protected $primaryKey = 'id_sesion';

    public $timestamps = true;

    protected $fillable = [
        'curso_id',
        'horario_id',
        'moodle_section_id', // 👈 Campo de enlace con el Aula Virtual
        'fecha',
        'fecha_fin',
        'nombre',
        'archivo',
        'activo',
    ];

    /* =========================================================================
     | RELACIONES BELONGS TO
     ========================================================================= */

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'curso_id', 'id');
    }

    public function horario(): BelongsTo
    {
        return $this->belongsTo(Horario::class, 'horario_id', 'id');
    }

    /* =========================================================================
     | RELACIONES HAS MANY
     ========================================================================= */

    /**
     * Registro de asistencias generadas en esta sesión.
     */
    public function asistencias(): HasMany
    {
        return $this->hasMany(Asistencia::class, 'sesion_id', 'id_sesion');
    }

    /**
     * Archivos y recursos multimedia asociados a esta sesión.
     */
    public function archivos(): HasMany
    {
        return $this->hasMany(ArchivoCurso::class, 'sesion_id', 'id_sesion');
    }
}