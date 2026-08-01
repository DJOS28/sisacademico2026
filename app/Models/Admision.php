<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Admision extends Model
{
    use HasFactory;

    protected $table = 'admisiones';
    protected $primaryKey = 'id_admision';

    protected $fillable = [
        'id_periodo',
        'id_tipo_admision',
        'nombre',
        'inicio_proceso',
        'fin_proceso',
        'inicio_inscripciones',
        'fin_inscripciones',
        'inicio_extemporaneo',
        'fin_extemporaneo',
        'fecha_examen',
        'direccion',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'id_admision' => 'integer',
            'id_periodo' => 'integer',
            'id_tipo_admision' => 'integer',
            'inicio_proceso' => 'date:Y-m-d',
            'fin_proceso' => 'date:Y-m-d',
            'inicio_inscripciones' => 'date:Y-m-d',
            'fin_inscripciones' => 'date:Y-m-d',
            'inicio_extemporaneo' => 'date:Y-m-d',
            'fin_extemporaneo' => 'date:Y-m-d',
            'fecha_examen' => 'date:Y-m-d',
            'activo' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class, 'id_periodo', 'id');
    }

    public function tipoAdmision(): BelongsTo
    {
        return $this->belongsTo(TipoAdmision::class, 'id_tipo_admision', 'id_tipo_admision');
    }

    public function inscripciones(): HasMany
    {
        return $this->hasMany(Inscripcion::class, 'id_admision', 'id_admision');
    }

    public function resultados(): HasMany
    {
        return $this->hasMany(ResultadoAdmision::class, 'id_proceso', 'id_admision');
    }

    public function requisitos(): BelongsToMany
    {
        return $this->belongsToMany(
            Requisito::class,
            'admisiones_requisitos',
            'id_admision',
            'id_requisito'
        );
    }

    public function tiposPago(): BelongsToMany
    {
        return $this->belongsToMany(
            TipoPago::class,
            'admisiones_tipo_pago',
            'id_admision',
            'id_tipo_pago'
        );
    }

    public function scopeActivas($query)
    {
        return $query->where('activo', true);
    }

    public function scopeBuscar($query, ?string $buscar)
    {
        $buscar = trim((string) $buscar);

        return $buscar === ''
            ? $query
            : $query->where('nombre', 'like', "%{$buscar}%");
    }
}
