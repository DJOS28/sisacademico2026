<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoAdmision extends Model
{
    use HasFactory;

    protected $table = 'tipo_admision';
    protected $primaryKey = 'id_tipo_admision';

    protected $fillable = [
        'nombre',
        'monto',
        'monto_extemporaneo',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'id_tipo_admision' => 'integer',
            'monto' => 'decimal:2',
            'monto_extemporaneo' => 'decimal:2',
            'activo' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function admisiones(): HasMany
    {
        return $this->hasMany(Admision::class, 'id_tipo_admision', 'id_tipo_admision');
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}
    