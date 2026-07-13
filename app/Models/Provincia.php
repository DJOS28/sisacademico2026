<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provincia extends Model
{
    protected $table = 'provincias';

    protected $primaryKey = 'idProv';

    public $timestamps = false;

    protected $fillable = [
        'Provincia',
        'idDepa',
    ];

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(
            Departamento::class,
            'idDepa',
            'idDepa'
        );
    }

    public function distritos(): HasMany
    {
        return $this->hasMany(
            Distrito::class,
            'idProv',
            'idProv'
        );
    }
}