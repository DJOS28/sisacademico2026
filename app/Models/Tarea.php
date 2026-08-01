<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tarea extends Model
{
    use HasFactory;

    protected $table = 'tareas';

    protected $fillable = [
        'nombre',
        'descripcion',
        'subcomponente_id',
        'fecha',
        'fecha_fin',
        'hora_inicio',
        'hora_fin',
        'archivo',
        'sesion_id',
        'curso_id',
        'id_seccion',
        'id_periodo',
    ];

    protected $casts = [
        'fecha' => 'date:Y-m-d',
        'fecha_fin' => 'date:Y-m-d',
    ];

    // --- RELACIONES ---

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'curso_id', 'id');
    }

    public function seccion()
    {
        return $this->belongsTo(Seccion::class, 'id_seccion', 'id');
    }

    public function periodo()
    {
        return $this->belongsTo(Periodo::class, 'id_periodo', 'id');
    }

    public function sesion()
    {
        // 👈 La clave primaria de 'sesiones' es 'id_sesion'
        return $this->belongsTo(Sesion::class, 'sesion_id', 'id_sesion');
    }

    public function subcomponente()
    {
        return $this->belongsTo(SubcomponenteLogro::class, 'subcomponente_id', 'id');
    }

    public function envios()
    {
        return $this->hasMany(EnvioTarea::class, 'tarea_id', 'id');
    }

    // --- SCOPES ---

    public function scopeSeccionActual($query, $cursoId, $seccionId, $periodoId)
    {
        if ($cursoId) {
            $query->where('curso_id', $cursoId);
        }
        if ($seccionId) {
            $query->where('id_seccion', $seccionId);
        }
        if ($periodoId) {
            $query->where('id_periodo', $periodoId);
        }

        return $query;
    }
}