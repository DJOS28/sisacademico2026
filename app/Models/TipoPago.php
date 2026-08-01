<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TipoPago extends Model
{
    use HasFactory;

    protected $table = 'tipo_pago';
    protected $primaryKey = 'id_tipo_pago';

    protected $fillable = [
        'nombre',
        'banco_o_entidad',
        'numero_cuenta',
        'cci',
        'nombre_titular',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'id_tipo_pago' => 'integer',
            'activo' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Procesos de admisión asociados a este medio de pago.
     */
    public function admisiones(): BelongsToMany
    {
        return $this->belongsToMany(
            Admision::class,
            'admisiones_tipo_pago',
            'id_tipo_pago',
            'id_admision'
        );
    }

    /**
     * Scope para filtrar únicamente registros activos.
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', 1);
    }
}