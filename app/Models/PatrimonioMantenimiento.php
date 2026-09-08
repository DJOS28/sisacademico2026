<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatrimonioMantenimiento extends Model
{
    use HasFactory;

    protected $table = 'patrimonio_mantenimientos';

    public $timestamps = false;

    protected $fillable = [
        'bien_id',
        'tipo',
        'diagnostico',
        'acciones_realizadas',
        'costo',
        'proveedor_tecnico',
        'fecha_ingreso',
        'fecha_salida',
        'estado',
        'created_at',
    ];

    protected $casts = [
        'costo'         => 'decimal:2',
        'fecha_ingreso' => 'date',
        'fecha_salida'  => 'date',
        'created_at'    => 'datetime',
    ];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(PatrimonioBien::class, 'bien_id');
    }
}