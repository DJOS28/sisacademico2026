<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Convalidacion extends Model
{
    use HasFactory;

    /**
     * Tabla asociada en la base de datos.
     */
    protected $table = 'convalidaciones';

    /**
     * Clave primaria de la tabla.
     */
    protected $primaryKey = 'id';

    /**
     * Indica si la clave es auto-incremental.
     */
    public $incrementing = true;

    /**
     * Tipo de clave primaria.
     */
    protected $keyType = 'int';

    /**
     * Habilitar timestamps creados por Eloquent (created_at, updated_at).
     */
    public $timestamps = true;

    /**
     * Campos asignables masivamente.
     */
    protected $fillable = [
        'estudiante_id',
        'curso_destino_id',
        'curso_origen',
        'institucion_origen',
        'nota_origen',
        'periodo_id',
        'fecha_convalidacion',
        'estado',
        'observaciones',
    ];

    /**
     * Conversión de tipos de atributos.
     */
    protected function casts(): array
    {
        return [
            'id'                  => 'integer',
            'estudiante_id'       => 'integer',
            'curso_destino_id'    => 'integer',
            'periodo_id'          => 'integer',
            'nota_origen'         => 'float',
            'fecha_convalidacion' => 'date:Y-m-d',
            'created_at'          => 'datetime',
            'updated_at'          => 'datetime',
        ];
    }

    /* =========================================================================
     | RELACIONES ELOQUENT (BELONGS TO)
     ========================================================================= */

    /**
     * Estudiante (Postulante) al que pertenece la convalidación.
     */
    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(
            Postulante::class,
            'estudiante_id',
            'id_postulante'
        );
    }

    /**
     * Curso de destino dentro del Plan de Estudios que se convalida.
     */
    public function cursoDestino(): BelongsTo
    {
        return $this->belongsTo(
            Curso::class,
            'curso_destino_id',
            'id'
        );
    }

    /**
     * Periodo académico en el que se ejecuta/registra la convalidación.
     */
    public function periodo(): BelongsTo
    {
        return $this->belongsTo(
            Periodo::class,
            'periodo_id',
            'id'
        );
    }

    /* =========================================================================
     | SCOPES ÚTILES DE CONSULTA
     ========================================================================= */

    /**
     * Scope para filtrar sólo las convalidaciones aprobadas.
     */
    public function scopeAprobadas($query)
    {
        return $query->where('estado', 'Aprobado');
    }

    /**
     * Scope para filtrar convalidaciones pendientes.
     */
    public function scopePendientes($query)
    {
        return $query->where('estado', 'Pendiente');
    }

    /**
     * Scope para filtrar por periodo específico.
     */
    public function scopePorPeriodo($query, int $periodoId)
    {
        return $query->where('periodo_id', $periodoId);
    }
}