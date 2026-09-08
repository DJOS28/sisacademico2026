<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TitulacionRequisito extends Model
{
    use HasFactory;

    protected $table = 'titulacion_requisitos';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'es_obligatorio',
        'activo',
    ];

    protected $casts = [
        'es_obligatorio' => 'boolean',
        'activo' => 'boolean',
    ];

    public function expedienteRequisitos(): HasMany
    {
        return $this->hasMany(TitulacionExpedienteRequisito::class, 'requisito_id');
    }
}