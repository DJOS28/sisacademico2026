<?php

/*
|--------------------------------------------------------------------------
| Agregar dentro del modelo App\Models\PlanEstudio
|--------------------------------------------------------------------------
*/

use Illuminate\Database\Eloquent\Relations\HasMany;

public function modulosFormativos(): HasMany
{
    return $this->hasMany(
        ModuloFormativo::class,
        'id_plan_estudio',
        'id'
    );
}
