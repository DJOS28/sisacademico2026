<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Instituto extends Model
{
    protected $table = 'instituto';

    protected $fillable = [
        'nombre',
        'direccion',
        'telefono',
        'logo',
        'codigo_modular',
        'dre',
        'idDist',
    ];

    public function distrito(): BelongsTo
    {
        return $this->belongsTo(
            Distrito::class,
            'idDist',
            'idDist'
        );
    }
}