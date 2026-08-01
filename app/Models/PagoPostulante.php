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

    public const ESTADO_ACEPTADO = 'aceptado';
    public const ESTADO_ANULADO = 'anulado';

    protected $fillable = [
        'postulante_id',
        'concepto_id',
        'caja_id',
        'monto',
        'fecha',
        'observacion',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'id_pagos' => 'integer',
            'postulante_id' => 'integer',
            'concepto_id' => 'integer',
            'caja_id' => 'integer',
            'monto' => 'decimal:2',
            'fecha' => 'date:Y-m-d',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function postulante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'postulante_id', 'id_postulante');
    }

    public function concepto(): BelongsTo
    {
        return $this->belongsTo(Concepto::class, 'concepto_id', 'id_concepto');
    }

    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_id', 'id_caja');
    }

    public function scopeAceptados($query)
    {
        return $query->where('estado', self::ESTADO_ACEPTADO);
    }
}
