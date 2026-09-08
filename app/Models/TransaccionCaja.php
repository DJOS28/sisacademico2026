<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TransaccionCaja extends Model
{
    protected $table = 'transacciones_caja';
    protected $primaryKey = 'id_transaccion';

    protected $fillable = [
        'caja_id',
        'tipo',        // 'ingreso' o 'egreso'
        'monto',
        'fecha',
        'concepto_id',
        'observacion',
        'estado',      // 'aceptado' o 'anulado'
        'dni',
        'nombres',
        'apellidos',
    ];

    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_id', 'id_caja');
    }

    public function concepto(): BelongsTo
    {
        return $this->belongsTo(Concepto::class, 'concepto_id', 'id_concepto');
    }

    public function anulacion(): HasOne
    {
        return $this->hasOne(AnulacionTransaccion::class, 'id_transaccion', 'id_transaccion');
    }
}