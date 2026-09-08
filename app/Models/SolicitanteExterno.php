<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SolicitanteExterno extends Model
{
    use HasFactory;

    protected $table = 'solicitantes_externos';

    protected $fillable = [
        'tipo_documento',
        'numero_documento',
        'nombre_razon_social',
        'rep_legal_dni',
        'rep_legal_nombres',
        'rep_legal_cargo',
        'email',
        'telefono',
        'direccion',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'identificacion_completa',
        'es_empresa',
    ];

    /**
     * Verifica si el solicitante registrado es una persona jurídica.
     */
    public function getEsEmpresaAttribute(): bool
    {
        return strtoupper($this->tipo_documento) === 'RUC';
    }

    /**
     * Formato de identificación amigable.
     */
    public function getIdentificacionCompletaAttribute(): string
    {
        if ($this->es_empresa && $this->rep_legal_nombres) {
            return "RUC {$this->numero_documento} - {$this->nombre_razon_social} (Rep: {$this->rep_legal_nombres})";
        }

        return "{$this->tipo_documento}: {$this->numero_documento} - {$this->nombre_razon_social}";
    }

    public function solicitudes(): HasMany
    {
        return $this->hasMany(SolicitudTramite::class, 'solicitante_externo_id');
    }
}