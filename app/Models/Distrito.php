<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Distrito extends Model
{
    protected $table = 'distritos';

    protected $primaryKey = 'idDist';

    public $timestamps = false;

    protected $fillable = [
        'Distrito',
        'idProv',
    ];

    public function provincia(): BelongsTo
    {
        return $this->belongsTo(
            Provincia::class,
            'idProv',
            'idProv'
        );
    }

    public function institutos(): HasMany
    {
        return $this->hasMany(
            Instituto::class,
            'idDist',
            'idDist'
        );
    }
}