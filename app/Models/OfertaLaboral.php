<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OfertaLaboral extends Model
{
    use HasFactory;

    protected $table = 'ofertas_laborales';
    protected $primaryKey = 'id_oferta';

    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'titulo',
        'descripcion',
        'fecha_publicacion',
        'fecha_limite',
        'id_tipo_contrato',
        'id_empresa',
        'id_plan_estudio',
        'lugar',
        'modalidad',
        'tipo_oferta',
        'remuneracion',
        'vacantes',
        'experiencia',
        'pasos_postular',
        'estado',
        'archivo_pdf',
    ];

    protected $casts = [
        'fecha_publicacion' => 'date:Y-m-d',
        'fecha_limite'      => 'date:Y-m-d',
        'remuneracion'      => 'decimal:2',
        'vacantes'          => 'integer',
    ];

    /**
     * Empresa que emite la oferta
     */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'id_empresa', 'id_empresa');
    }

    /**
     * Tipo de contrato asignado
     */
    public function tipoContrato(): BelongsTo
    {
        return $this->belongsTo(TipoContrato::class, 'id_tipo_contrato', 'id_tipo_contrato');
    }

    /**
     * Carrera o Programa Académico vinculado
     */
    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class, 'id_plan_estudio', 'id');
    }

    /**
     * Postulaciones registradas para esta oferta
     */
    public function postulaciones(): HasMany
    {
        return $this->hasMany(Postulacion::class, 'id_oferta', 'id_oferta');
    }
}