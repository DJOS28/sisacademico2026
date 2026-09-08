<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Anuncio extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla asociada en la base de datos.
     */
    protected $table = 'anuncios';

    /**
     * Llave primaria personalizada de la tabla.
     */
    protected $primaryKey = 'id_anuncio';

    /**
     * Atributos asignables en masa.
     */
    protected $fillable = [
        'titulo',
        'contenido',
        'plan_estudio_id',
        'activo',
    ];

    /**
     * Casteo nativo de atributos.
     */
    protected function casts(): array
    {
        return [
            'activo'     => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Relación: Un anuncio pertenece a un Plan de Estudio.
     */
    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class, 'plan_estudio_id', 'id');
    }

    /**
     * Scope local para filtrar únicamente avisos vigentes.
     */
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}