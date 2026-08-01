<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchivoCurso extends Model
{
    use HasFactory;

    protected $table = 'archivos_curso';

    public $timestamps = true; // Habilitado por tener created_at y updated_at en la tabla SQL

    protected $fillable = [
        'curso_id',
        'id_seccion',   // 👈 Para aislar por sección
        'id_periodo',   // 👈 Para aislar por periodo
        'sesion_id',
        'tipo',         // 'archivo' | 'video'
        'nombre',
        'ruta',
        'fecha_subida',
    ];

    /* =========================================================================
     | RELACIONES BELONGS TO
     ========================================================================= */

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'curso_id', 'id');
    }

    public function seccion(): BelongsTo
    {
        return $this->belongsTo(Seccion::class, 'id_seccion', 'id');
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class, 'id_periodo', 'id');
    }

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(Sesion::class, 'sesion_id', 'id_sesion');
    }
}