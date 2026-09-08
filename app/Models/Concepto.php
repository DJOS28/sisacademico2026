<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Concepto extends Model
{
    protected $table = 'conceptos';
    protected $primaryKey = 'id_concepto';

    protected $fillable = [
        'nombre',
        'precio',
        'fecha_registro',
        'activo',
        'tipo_concepto',
    ];

    public function pagosPostulantes(): HasMany
    {
        return $this->hasMany(PagoPostulante::class, 'concepto_id', 'id_concepto');
    }

    public function transaccionesCaja(): HasMany
    {
        return $this->hasMany(TransaccionCaja::class, 'concepto_id', 'id_concepto');
    }
}