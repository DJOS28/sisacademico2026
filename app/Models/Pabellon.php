<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pabellon extends Model
{
    protected $table = 'pabellones';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function aulas(): HasMany
    {
        return $this->hasMany(
            Aula::class,
            'id_pabellon',
            'id'
        );
    }
}