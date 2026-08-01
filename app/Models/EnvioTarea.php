<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class EnvioTarea extends Model
{
    use HasFactory;

    protected $table = 'envios_tareas';

    protected $fillable = [
        'tarea_id',
        'estudiante_id',
        'archivo',
        'comentario',
        'fecha_envio',
    ];

    protected $casts = [
        'fecha_envio' => 'datetime',
    ];

    // Append para incluir la URL automáticamente en las respuestas JSON/Inertia
    protected $appends = ['archivo_url'];

    // --- ACCESSORS ---

    /**
     * Devuelve la URL pública del archivo adjunto en el storage disk 'public'.
     */
    public function getArchivoUrlAttribute(): ?string
    {
        return $this->archivo ? Storage::url($this->archivo) : null;
    }

    // --- RELACIONES ---

    public function tarea()
    {
        return $this->belongsTo(Tarea::class, 'tarea_id');
    }

    public function estudiante()
    {
        return $this->belongsTo(Postulante::class, 'estudiante_id', 'id_postulante');
    }

    public function calificacion()
    {
        return $this->hasOne(CalificacionTarea::class, 'envio_tarea_id');
    }
}