<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnulacionTransaccion extends Model
{
    protected $table = 'anulaciones_transacciones';
    protected $primaryKey = 'id_anulacion';

    protected $fillable = [
        'id_transaccion',
        'usuario_id',
        'motivo',
        'fecha_anulacion',
    ];

    public function transaccion(): BelongsTo
    {
        return $this->belongsTo(TransaccionCaja::class, 'id_transaccion', 'id_transaccion');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }
}