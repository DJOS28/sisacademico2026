<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TitulacionModalidad extends Model
{
    use HasFactory;

    protected $table = 'titulacion_modalidades';

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function titulaciones(): HasMany
    {
        return $this->hasMany(Titulacion::class, 'modalidad_id');
    }
}