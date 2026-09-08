<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class RepositorioRecurso extends Model
{
    use HasFactory;

    protected $table = 'repositorio_recursos';

    public $timestamps = false;

    protected $fillable = [
        'titulo',
        'descripcion',
        'archivo',
        'tipo_archivo',
        'autor_id',
        'categoria_id',
        'plan_estudio_id',
        'asesor_id',
        'anio_publicacion',
        'palabras_clave',
        'activo',
        'visitas',
        'descargas',
        'creado_en',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'visitas' => 'integer',
        'descargas' => 'integer',
        'creado_en' => 'datetime',
    ];

    /**
     * Autores vinculados mediante tabla pivote (N:M).
     */
    public function autores(): BelongsToMany
    {
        return $this->belongsToMany(
            RepositorioAutor::class,
            'repositorio_recurso_autores',
            'recurso_id',
            'autor_id'
        );
    }

    /**
     * Categorías vinculadas mediante tabla pivote (N:M).
     */
    public function categorias(): BelongsToMany
    {
        return $this->belongsToMany(
            RepositorioCategoria::class,
            'repositorio_recurso_categorias',
            'recurso_id',
            'categoria_id'
        );
    }

    /**
     * Autor principal (si se mantiene la columna directa).
     */
    public function autorPrincipal(): BelongsTo
    {
        return $this->belongsTo(RepositorioAutor::class, 'autor_id');
    }

    /**
     * Categoría principal (si se mantiene la columna directa).
     */
    public function categoriaPrincipal(): BelongsTo
    {
        return $this->belongsTo(RepositorioCategoria::class, 'categoria_id');
    }

    /**
     * Plan de estudios / Carrera asociada.
     */
    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class, 'plan_estudio_id');
    }

    /**
     * Docente asesor del proyecto o tesis.
     */
    public function asesor(): BelongsTo
    {
        return $this->belongsTo(Docente::class, 'asesor_id');
    }
}