<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudRequisitoArchivo extends Model
{
    use HasFactory;

    protected $table = 'solicitud_requisitos_archivos';

    protected $fillable = [
        'solicitud_id',
        'requisito_id',
        'archivo_ruta',
        'nombre_original',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /* -----------------------------------------------------------
     |  Relaciones Eloquent
     | -----------------------------------------------------------
     */

    /**
     * Solicitud de trámite a la que pertenece este archivo.
     */
    public function solicitud(): BelongsTo
    {
        return $this->belongsTo(SolicitudTramite::class, 'solicitud_id', 'id');
    }

    /**
     * Requisito específico que cumple este archivo (de la tabla requisitos_tramite).
     */
    public function requisito(): BelongsTo
    {
        return $this->belongsTo(RequisitoTramite::class, 'requisito_id', 'id');
    }
}