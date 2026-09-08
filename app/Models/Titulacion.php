<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Titulacion extends Model
{
    use HasFactory;

    protected $table = 'titulaciones';

    protected $fillable = [
        'codigo_expediente',
        'estudiante_id',
        'plan_estudio_id',
        'modalidad_id',
        'asesor_id',
        'titulo_proyecto',
        'archivo_proyecto',
        'estado',
        'fecha_solicitud',
    ];

    protected $casts = [
        'fecha_solicitud' => 'date',
    ];

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(Postulante::class, 'estudiante_id', 'id_postulante');
    }

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class, 'plan_estudio_id');
    }

    public function modalidad(): BelongsTo
    {
        return $this->belongsTo(TitulacionModalidad::class, 'modalidad_id');
    }

    public function asesor(): BelongsTo
    {
        return $this->belongsTo(Docente::class, 'asesor_id');
    }

    public function requisitosExpediente(): HasMany
    {
        return $this->hasMany(TitulacionExpedienteRequisito::class, 'titulacion_id');
    }

    public function jurados(): HasMany
    {
        return $this->hasMany(TitulacionJurado::class, 'titulacion_id');
    }

    public function acta(): HasOne
    {
        return $this->hasOne(TitulacionActa::class, 'titulacion_id');
    }
}