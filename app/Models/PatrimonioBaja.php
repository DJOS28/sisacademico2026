<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatrimonioBaja extends Model
{
    use HasFactory;

    protected $table = 'patrimonio_bajas';

    public $timestamps = false;

    protected $fillable = [
        'bien_id',
        'causal',
        'resolucion_director',
        'informe_tecnico',
        'fecha_baja',
        'created_at',
    ];

    protected $casts = [
        'fecha_baja' => 'date',
        'created_at' => 'datetime',
    ];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(PatrimonioBien::class, 'bien_id');
    }
}