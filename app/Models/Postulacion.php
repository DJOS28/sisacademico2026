<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Postulacion extends Model
{
    use HasFactory;

    protected $table = 'postulaciones';
    protected $primaryKey = 'id_postulacion';

    protected $fillable = [
        'id_postulante',
        'id_oferta',
        'fecha_postulacion',
        'estado',
        'cv_adjunto',
        'mensaje_presentacion',
    ];

    protected $casts = [
        'fecha_postulacion' => 'datetime',
    ];

    /**
     * Estudiante / Postulante que aplica
     */
    public function postulante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'id_postulante', 'id_postulante');
    }

    /**
     * Convocatoria a la que se postula
     */
    public function oferta(): BelongsTo
    {
        return $this->belongsTo(OfertaLaboral::class, 'id_oferta', 'id_oferta');
    }
}