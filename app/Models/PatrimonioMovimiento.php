<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatrimonioMovimiento extends Model
{
    use HasFactory;

    protected $table = 'patrimonio_movimientos';

    public $timestamps = false;

    protected $fillable = [
        'bien_id',
        'aula_origen_id',
        'aula_destino_id',
        'area_origen_id',
        'area_destino_id',
        'personal_origen_id',
        'personal_destino_id',
        'tipo_movimiento',
        'motivo',
        'fecha_movimiento',
        'created_at',
    ];

    protected $casts = [
        'fecha_movimiento' => 'datetime',
        'created_at'       => 'datetime',
    ];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(PatrimonioBien::class, 'bien_id');
    }

    public function aulaOrigen(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_origen_id');
    }

    public function aulaDestino(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_destino_id');
    }

    public function areaOrigen(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'area_origen_id');
    }

    public function areaDestino(): BelongsTo
    {
        return $this->belongsTo(Area::class, 'area_destino_id');
    }

    public function personalOrigen(): BelongsTo
    {
        return $this->belongsTo(Personal::class, 'personal_origen_id');
    }

    public function personalDestino(): BelongsTo
    {
        return $this->belongsTo(Personal::class, 'personal_destino_id');
    }
}