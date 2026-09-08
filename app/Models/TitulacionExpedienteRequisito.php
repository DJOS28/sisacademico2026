<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TitulacionExpedienteRequisito extends Model
{
    use HasFactory;

    protected $table = 'titulacion_expediente_requisitos';

    public $timestamps = false;

    protected $fillable = [
        'titulacion_id',
        'requisito_id',
        'archivo_adjunto',
        'estado',
        'observacion',
        'fecha_verificacion',
    ];

    protected $casts = [
        'fecha_verificacion' => 'datetime',
    ];

    public function titulacion(): BelongsTo
    {
        return $this->belongsTo(Titulacion::class, 'titulacion_id');
    }

    public function requisito(): BelongsTo
    {
        return $this->belongsTo(TitulacionRequisito::class, 'requisito_id');
    }
}