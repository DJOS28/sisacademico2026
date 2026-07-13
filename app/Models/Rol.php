<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Rol extends Model
{
    protected $table = 'roles';

    protected $fillable = [
        'nombre',
        'descripcion',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'estado' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(
            Usuario::class,
            'usuario_roles',
            'rol_id',
            'usuario_id'
        )->withTimestamps();
    }

    public function modulos(): BelongsToMany
    {
        return $this->belongsToMany(
            Modulo::class,
            'modulo_roles',
            'rol_id',
            'modulo_id'
        )->withTimestamps();
    }
}
