<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Administrador extends Model
{
    protected $table = 'administradores';

    protected $fillable = [
        'usuario_id',
        'dni',
        'nombre',
        'apellido',
        'email',
        'telefono',
        'direccion',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(
            Usuario::class,
            'usuario_id',
            'id'
        );
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim(
            implode(' ', array_filter([
                $this->nombre,
                $this->apellido,
            ]))
        );
    }
}