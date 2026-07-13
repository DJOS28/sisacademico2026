<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    protected $table = 'areas';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'estado',
        'fecha_creacion',
    ];

    protected function casts(): array
    {
        return [
            'fecha_creacion' => 'datetime',
        ];
    }

    public function personal(): HasMany
    {
        return $this->hasMany(
            Personal::class,
            'id_area',
            'id'
        );
    }

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(
            Usuario::class,
            'usuario_areas',
            'area_id',
            'usuario_id'
        )
            ->withPivot('activo')
            ->withTimestamps();
    }
}