<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModuloFormativo extends Model
{
    protected $table = 'modulos_formativos';

    protected $primaryKey = 'id_modulo';

    protected $fillable = [
        'id_plan_estudio',
        'nombre',
        'num_modulo',
        'horas',
        'creditos',
    ];

    protected function casts(): array
    {
        return [
            'id_modulo' => 'integer',
            'id_plan_estudio' => 'integer',
            'num_modulo' => 'integer',
            'horas' => 'integer',
            'creditos' => 'decimal:2',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(
            PlanEstudio::class,
            'id_plan_estudio',
            'id'
        );
    }
}
