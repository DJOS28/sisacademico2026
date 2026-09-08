<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tramite extends Model
{
    use HasFactory;

    protected $table = 'tramites';

    protected $fillable = [
        'nombre',
        'descripcion',
        'estado',
        'costo',
        'tiempo',
    ];

    protected $casts = [
        'costo' => 'decimal:2',
    ];

    /**
     * Requisitos que exige este trámite (N:M vía tramite_requisitos)
     */
    public function requisitos()
    {
        return $this->belongsToMany(
            RequisitoTramite::class,
            'tramite_requisitos',
            'tramite_id',
            'requisito_id'
        )->withTimestamps();
    }

    /**
     * Solicitudes hechas para este trámite
     */
    public function solicitudes()
    {
        return $this->hasMany(SolicitudTramite::class, 'tramite_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('estado', 'Activo');
    }
}