<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RepositorioCategoria extends Model
{
    use HasFactory;

    protected $table = 'repositorio_categorias';

    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
        'creado_en',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'creado_en' => 'datetime',
    ];

    /**
     * Recursos asociados a esta categoría o línea de investigación.
     */
    public function recursos(): BelongsToMany
    {
        return $this->belongsToMany(
            RepositorioRecurso::class,
            'repositorio_recurso_categorias',
            'categoria_id',
            'recurso_id'
        );
    }
}