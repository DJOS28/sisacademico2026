<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RepositorioAutor extends Model
{
    use HasFactory;

    protected $table = 'repositorio_autores';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'email',
        'biografia',
        'estudiante_id',
        'activo',
        'creado_en',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'creado_en' => 'datetime',
    ];

    /**
     * Recursos publicados por este autor.
     */
    public function recursos(): BelongsToMany
    {
        return $this->belongsToMany(
            RepositorioRecurso::class,
            'repositorio_recurso_autores',
            'autor_id',
            'recurso_id'
        );
    }

    /**
     * Vinculación con el estudiante/postulante en el sistema institucional.
     */
    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'estudiante_id', 'id_postulante');
    }
}