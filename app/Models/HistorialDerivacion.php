<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistorialDerivacion extends Model
{
    use HasFactory;

    protected $table = 'historial_derivaciones';

    protected $fillable = [
        'solicitud_id',
        'area_origen_id',
        'area_destino_id',
        'responsable_origen_id',
        'responsable_destino_id',
        'fecha_derivacion',
        'estado_en_origen',
        'estado_en_destino',
        'observacion',
        'usuario_id',
        'fecha_aceptacion',
        'comentarios',
        'archivo_derivacion',
    ];

    protected $casts = [
        'fecha_derivacion'  => 'datetime',
        'fecha_aceptacion'  => 'datetime',
    ];

    public function solicitud()
    {
        return $this->belongsTo(SolicitudTramite::class, 'solicitud_id');
    }

    public function areaOrigen()
    {
        return $this->belongsTo(Area::class, 'area_origen_id');
    }

    public function areaDestino()
    {
        return $this->belongsTo(Area::class, 'area_destino_id');
    }

    /**
     * Quién realizó la derivación (usuario del área origen)
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Responsable puntual que tenía la solicitud en el área origen
     * al momento de derivar (trazabilidad de "quién la traía")
     */
    public function responsableOrigen()
    {
        return $this->belongsTo(Usuario::class, 'responsable_origen_id');
    }

    /**
     * A quién específicamente se derivó dentro del área destino
     * (aparece en su dashboard como "trámite derivado a mí")
     */
    public function responsableDestino()
    {
        return $this->belongsTo(Usuario::class, 'responsable_destino_id');
    }

    public function scopePendientesDeAceptar($query)
    {
        return $query->whereNull('fecha_aceptacion');
    }

    /**
     * Derivaciones dirigidas a un responsable puntual, aún sin aceptar
     */
    public function scopeParaResponsable($query, int $usuarioId)
    {
        return $query->where('responsable_destino_id', $usuarioId);
    }
}