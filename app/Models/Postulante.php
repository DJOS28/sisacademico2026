<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Postulante extends Model
{
    use HasFactory;

    protected $table = 'postulantes';

    protected $primaryKey = 'id_postulante';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = true;

    protected $fillable = [
        'codigo_postulante',
        'nombres',
        'apellidos',
        'dni',
        'email',
        'telefono',
        'genero',
        'fecha_nacimiento',
        'lengua_materna',
        'foto_postulante',
        'direccion',
        'usuario_id',
        'id_colegio',
        'año_egreso',
        'discapacidad',
        'nombre_discapacidad',
        'fecha_registro',
        'certificado_estudios',
        'partida_nacimiento',
        'comprobante_pago',
        'copia_dni',
        'id_medio_pago',
        'fuente_inscripcion',
        'curriculum_archivo',
        'grado',
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'fecha_registro' => 'datetime',
        'discapacidad' => 'integer',
        'usuario_id' => 'integer',
        'id_colegio' => 'integer',
        'id_medio_pago' => 'integer',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(
            Usuario::class,
            'usuario_id',
            'id'
        );
    }

    public function colegio(): BelongsTo
    {
        return $this->belongsTo(
            Colegio::class,
            'id_colegio',
            'id_colegio'
        );
    }

    public function tipoPago(): BelongsTo
    {
        return $this->belongsTo(
            TipoPago::class,
            'id_medio_pago',
            'id_tipo_pago'
        );
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim(
            ($this->nombres ?? '') . ' ' . ($this->apellidos ?? '')
        );
    }
}