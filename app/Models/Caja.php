<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Caja extends Model
{
    protected $table = 'caja';
    protected $primaryKey = 'id_caja';

    protected $fillable = [
        'apertura',
        'saldo',
        'fecha_apertura',
        'fecha_cierre',
        'nombre',
        'saldo_final',
        'observacion',
    ];

    /**
     * Transacciones operativas de caja (ingresos/egresos generales)
     */
    public function transacciones(): HasMany
    {
        return $this->hasMany(TransaccionCaja::class, 'caja_id', 'id_caja');
    }

    /**
     * Pagos específicos realizados por estudiantes/postulantes
     */
    public function pagosPostulantes(): HasMany
    {
        return $this->hasMany(PagoPostulante::class, 'caja_id', 'id_caja');
    }

    /**
     * Histórico de eventos de apertura y cierre de la caja
     */
    public function historial(): HasMany
    {
        return $this->hasMany(CajaHistorial::class, 'caja_id', 'id_caja');
    }
}