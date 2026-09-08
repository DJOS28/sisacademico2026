<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TitulacionActa extends Model
{
    use HasFactory;

    protected $table = 'titulacion_actas';

    public $timestamps = false;

    protected $fillable = [
        'titulacion_id',
        'numero_acta',
        'fecha_sustentacion',
        'lugar_aula',
        'nota_promedio',
        'resultado',
        'resolucion_director',
        'numero_diploma',
        'libro',
        'folio',
        'codigo_registro_minedu',
        'observaciones',
        'created_at',
    ];

    protected $casts = [
        'fecha_sustentacion' => 'datetime',
        'nota_promedio' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function titulacion(): BelongsTo
    {
        return $this->belongsTo(Titulacion::class, 'titulacion_id');
    }
}