<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PagoPostulante extends Model
{
    use HasFactory;

    protected $table = 'pagos_postulantes';
    protected $primaryKey = 'id_pagos';

    // Constantes de estado para evitar "magic strings"
    public const ESTADO_ACEPTADO = 'aceptado';
    public const ESTADO_ANULADO  = 'anulado';

    protected $fillable = [
        'postulante_id',
        'concepto_id',
        'caja_id',
        'monto',
        'fecha',
        'observacion',
        'estado',
    ];

    /**
     * Casts de atributos para tipado estricto en Laravel
     */
    protected function casts(): array
    {
        return [
            'id_pagos'      => 'integer',
            'postulante_id' => 'integer',
            'concepto_id'   => 'integer',
            'caja_id'       => 'integer',
            'monto'         => 'decimal:2',
            'fecha'         => 'date:Y-m-d',
            'created_at'    => 'datetime',
            'updated_at'    => 'datetime',
        ];
    }

    /**
     * Relación con el estudiante/postulante que realiza el pago.
     */
    public function postulante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'postulante_id', 'id_postulante');
    }

    /**
     * Relación con el tarifario o concepto cobrado.
     */
    public function concepto(): BelongsTo
    {
        return $this->belongsTo(Concepto::class, 'concepto_id', 'id_concepto');
    }

    /**
     * Relación con la caja donde fue registrado el cobro.
     */
    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_id', 'id_caja');
    }

    /**
     * Scope para filtrar únicamente los pagos en estado Aceptado.
     */
    public function scopeAceptados($query)
    {
        return $query->where('estado', self::ESTADO_ACEPTADO);
    }

    /**
     * Scope para filtrar únicamente los pagos Anulados.
     */
    public function scopeAnulados($query)
    {
        return $query->where('estado', self::ESTADO_ANULADO);
    }

    /**
     * Helper para verificar si el pago se encuentra válido/aceptado.
     */
    public function isAceptado(): bool
    {
        return $this->estado === self::ESTADO_ACEPTADO;
    }
}