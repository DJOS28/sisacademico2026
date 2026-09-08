<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SolicitudTramite extends Model
{
    use HasFactory;

    protected $table = 'solicitudes_tramites';

    protected $fillable = [
        'tipo_solicitante',
        'postulante_id',
        'solicitante_externo_id',
        'solicitante_personal_id',
        'tramite_id',
        'area_id',
        'responsable_id',
        'estado',
        'fecha_solicitud',
        'fecha_resolucion',
        'motivo_rechazo',
        'prioridad',
        'archivo',
        'codigo_seguimiento',
    ];

    protected $casts = [
        'fecha_solicitud'  => 'datetime',
        'fecha_resolucion' => 'datetime',
    ];

    /**
     * Genera automáticamente un código de seguimiento único al crear la solicitud.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function (SolicitudTramite $solicitud) {
            if (empty($solicitud->codigo_seguimiento)) {
                $solicitud->codigo_seguimiento = 'TRM-' . strtoupper(Str::random(8));
            }
        });
    }

    /* -----------------------------------------------------------
     |  Relaciones Eloquent
     | -----------------------------------------------------------
     */

    public function tramite(): BelongsTo
    {
        return $this->belongsTo(Tramite::class, 'tramite_id');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'area_id');
    }

    /**
     * Usuario/Personal actualmente responsable de atender la solicitud.
     */
    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'responsable_id');
    }

    /**
     * Solicitante cuando es un postulante/estudiante registrado.
     */
    public function postulante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'postulante_id', 'id_postulante');
    }

    /**
     * Solicitante cuando es una persona o empresa externa (sin usuario).
     */
    public function externo(): BelongsTo
    {
        return $this->belongsTo(SolicitanteExterno::class, 'solicitante_externo_id');
    }

    /**
     * Alias de 'externo' para evitar el error "Call to undefined relationship [solicitanteExterno]".
     */
    public function solicitanteExterno(): BelongsTo
    {
        return $this->belongsTo(SolicitanteExterno::class, 'solicitante_externo_id');
    }

    /**
     * Solicitante cuando es un trabajador interno (tabla personal).
     */
    public function personal(): BelongsTo
    {
        return $this->belongsTo(Personal::class, 'solicitante_personal_id');
    }

    /**
     * Alias de 'personal' para compatibilidad con el controlador.
     */
    public function solicitantePersonal(): BelongsTo
    {
        return $this->belongsTo(Personal::class, 'solicitante_personal_id');
    }

    /**
     * Historial de derivaciones registradas para el expediente.
     */
    public function historialDerivaciones(): HasMany
    {
        return $this->hasMany(HistorialDerivacion::class, 'solicitud_id')
            ->orderBy('fecha_derivacion');
    }

    /**
     * Múltiples archivos independientes adjuntados por cada requisito del trámite.
     */
    public function archivosRequisitos(): HasMany
    {
        return $this->hasMany(SolicitudRequisitoArchivo::class, 'solicitud_id', 'id');
    }

    /* -----------------------------------------------------------
     |  Accessors
     | -----------------------------------------------------------
     */

    /**
     * Obtiene el nombre completo del solicitante dinámicamente según el tipo.
     * Uso: $solicitud->solicitante_nombre
     */
    public function getSolicitanteNombreAttribute(): ?string
    {
        return match ($this->tipo_solicitante) {
            'postulante' => $this->postulante
                ? trim($this->postulante->nombres . ' ' . $this->postulante->apellidos)
                : null,
            'externo'  => $this->externo?->nombre_razon_social ?? $this->solicitanteExterno?->nombre_razon_social,
            'personal' => $this->personal
                ? trim($this->personal->nombre . ' ' . $this->personal->apellido)
                : null,
            default    => null,
        };
    }

    /* -----------------------------------------------------------
     |  Scopes
     | -----------------------------------------------------------
     */

    public function scopeDeResponsable($query, int $usuarioId)
    {
        return $query->where('responsable_id', $usuarioId);
    }

    public function scopePorAreas($query, array $areaIds)
    {
        return $query->whereIn('area_id', $areaIds);
    }

    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopeSinAsignar($query)
    {
        return $query->whereNull('responsable_id');
    }
}