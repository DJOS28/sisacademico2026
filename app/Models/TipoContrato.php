<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoContrato extends Model
{
    use HasFactory;

    protected $table = 'tipos_contrato';
    protected $primaryKey = 'id_tipo_contrato';

    protected $fillable = [
        'nombre_tipo_contrato',
        'estado',
    ];

    /**
     * Ofertas asociadas a este tipo de contrato
     */
    public function ofertas(): HasMany
    {
        return $this->hasMany(OfertaLaboral::class, 'id_tipo_contrato', 'id_tipo_contrato');
    }
}