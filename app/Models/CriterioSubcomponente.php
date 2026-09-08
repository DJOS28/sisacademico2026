<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CriterioSubcomponente extends Model
{
    use HasFactory;

    protected $table = 'criterios_subcomponente';

    protected $primaryKey = 'id';

    public $timestamps = true;

    protected $fillable = [
        'subcomponente_id',
        'codigo',
        'nombre',
        'peso',
        'orden',
    ];

    protected function casts(): array
    {
        return [
            'subcomponente_id' => 'integer',
            'peso'             => 'float',
            'orden'            => 'integer',
            'created_at'       => 'datetime',
            'updated_at'       => 'datetime',
        ];
    }

    public function subcomponente(): BelongsTo
    {
        return $this->belongsTo(SubcomponenteLogro::class, 'subcomponente_id', 'id');
    }

    public function notas(): HasMany
    {
        return $this->hasMany(NotaCriterio::class, 'criterio_id', 'id');
    }
}