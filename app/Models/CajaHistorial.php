<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CajaHistorial extends Model
{
    protected $table = 'caja_historial';
    protected $primaryKey = 'id_historial';

    protected $fillable = [
        'caja_id',
        'tipo',        // 'apertura' o 'cierre'
        'monto',
        'fecha',
        'observacion',
    ];

    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_id', 'id_caja');
    }
}