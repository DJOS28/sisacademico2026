<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PatrimonioBien extends Model
{
    use HasFactory;

    protected $table = 'patrimonio_bienes';

    protected $fillable = [
        'codigo_patrimonial',
        'categoria_id',
        'denominacion',
        'marca',
        'modelo',
        'serie',
        'color',
        'dimensiones',
        'estado_conservacion',
        'situacion',
        'valor_adquisicion',
        'fecha_adquisicion',
        'aula_id',
        'area_id',
        'responsable_personal_id',
        'foto',
        'observaciones',
    ];

    protected $casts = [
        'valor_adquisicion' => 'decimal:2',
        'fecha_adquisicion' => 'date',
    ];

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(PatrimonioCategoria::class, 'categoria_id');
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'area_id');
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Personal::class, 'responsable_personal_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(PatrimonioMovimiento::class, 'bien_id');
    }

    public function mantenimientos(): HasMany
    {
        return $this->hasMany(PatrimonioMantenimiento::class, 'bien_id');
    }

    public function baja(): HasOne
    {
        return $this->hasOne(PatrimonioBaja::class, 'bien_id');
    }
}