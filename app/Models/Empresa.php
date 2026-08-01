<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empresa extends Model
{
    use HasFactory;

    protected $table = 'empresas';
    protected $primaryKey = 'id_empresa';

    protected $fillable = [
        'usuario_id',
        'nombre_empresa',
        'ruc',
        'logo_empresa',
        'direccion_empresa',
        'telefono_empresa',
        'email_contacto',
        'nombre_contacto',
        'estado',
    ];

    /**
     * Usuario de acceso al sistema (si la empresa inicia sesión)
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }

    /**
     * Ofertas laborales publicadas por esta empresa
     */
    public function ofertas(): HasMany
    {
        return $this->hasMany(OfertaLaboral::class, 'id_empresa', 'id_empresa');
    }
}