<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequisitoTramite extends Model
{
    use HasFactory;

    protected $table = 'requisitos_tramite';

    protected $fillable = [
        'descripcion',
        'estado',
    ];

    /**
     * Trámites que exigen este requisito
     */
    public function tramites()
    {
        return $this->belongsToMany(
            Tramite::class,
            'tramite_requisitos',
            'requisito_id',
            'tramite_id'
        )->withTimestamps();
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'Activo');
    }
}