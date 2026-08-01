<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
class Docente extends Model
{
    protected $table = 'docentes';

    protected $fillable = [
        'usuario_id',
        'nombre',
        'apellido',
        'dni',
        'email',
        'telefono',
        'direccion',
        'departamento',
        'cargo',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombre} {$this->apellido}");
    }
    public function cursos(): BelongsToMany
    {
        return $this->belongsToMany(
            Curso::class,
            'cursos_docentes',
            'docente_id',
            'curso_id'
        )->withTimestamps();
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(
            Horario::class,
            'id_docente',
            'id'
        );
    }

    // En app/Models/User.php (o app/Models/Docente.php)

/**
 * Obtener los cursos que dicta el docente filtrados por Periodo y Semestre.
 */
public function obtenerCursosDictados($periodoId = null, $semestreId = null)
{
    // ID del docente asociado al usuario autenticado
    $docenteId = $this->docente?->id ?? $this->id;

    return \App\Models\Horario::with(['curso', 'seccion', 'turno', 'semestre', 'periodo'])
        ->where('docente_id', $docenteId)
        ->when($periodoId, function ($query) use ($periodoId) {
            $query->where('periodo_id', $periodoId);
        })
        ->when($semestreId, function ($query) use ($semestreId) {
            $query->where('semestre_id', $semestreId);
        })
        ->get();
}
}
