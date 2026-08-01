<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalificacionTarea extends Model
{
    use HasFactory;

    protected $table = 'calificaciones_tareas';

    protected $fillable = [
        'envio_tarea_id',
        'nota',
        'observacion',
    ];

    protected $casts = [
        'nota' => 'float',
    ];

    // --- RELACIONES ---

    public function envio()
    {
        return $this->belongsTo(EnvioTarea::class, 'envio_tarea_id');
    }
}