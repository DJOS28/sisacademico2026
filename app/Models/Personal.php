<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Personal extends Model
{
    protected $table = 'personal';

    public $timestamps = false;

    protected $fillable = [
        'usuario_id',
        'dni',
        'nombre',
        'apellido',
        'direccion',
        'telefono',
        'email',
        'puesto',
        'id_area',
        'fecha_creacion',
    ];

    protected function casts(): array
    {
        return [
            'fecha_creacion' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(
            Usuario::class,
            'usuario_id',
            'id'
        );
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(
            Area::class,
            'id_area',
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