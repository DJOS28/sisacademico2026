<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Requisito extends Model
{
    use HasFactory;

    protected $table = 'requisitos';
    protected $primaryKey = 'id_requisito';

    protected $fillable = ['nombre', 'descripcion', 'activo'];

    protected function casts(): array
    {
        return [
            'id_requisito' => 'integer',
            'activo' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function admisiones(): BelongsToMany
    {
        return $this->belongsToMany(Admision::class, 'admisiones_requisitos', 'id_requisito', 'id_admision');
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}