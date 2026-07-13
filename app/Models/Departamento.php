<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departamento extends Model
{
    protected $table = 'departamentos';

    protected $primaryKey = 'idDepa';

    public $timestamps = false;

    protected $fillable = [
        'Departamento',
    ];

    public function provincias(): HasMany
    {
        return $this->hasMany(
            Provincia::class,
            'idDepa',
            'idDepa'
        );
    }
}