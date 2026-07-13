<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UsuarioArea extends Model
{
    protected $table = 'usuario_areas';

    protected $fillable = [
        'usuario_id',
        'area_id',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

   public function area(): BelongsTo
{
    return $this->belongsTo(
        Area::class,
        'area_id',
        'id'
    );
}
}
