<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Aula extends Model
{
    protected $table = 'aulas';

    protected $fillable = [
        'nombre',
        'numero_aula',
        'capacidad',
        'id_pabellon',
        'tipo',
    ];

    protected function casts(): array
    {
        return [
            'capacidad' => 'integer',
            'id_pabellon' => 'integer',
        ];
    }

    public function pabellon(): BelongsTo
    {
        return $this->belongsTo(
            Pabellon::class,
            'id_pabellon',
            'id'
        );
    }
}