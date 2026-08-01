<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClaseEnVivo extends Model
{
    use HasFactory;

    protected $table = 'clases_en_vivo';

    protected $fillable = [
        'curso_id',
        'id_seccion',
        'id_periodo',
        'sesion_id',
        'titulo',
        'room_name',
        'estado',
        'fecha_inicio',
        'fecha_fin',
    ];

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'curso_id', 'id');
    }

    public function seccion(): BelongsTo
    {
        return $this->belongsTo(Seccion::class, 'id_seccion', 'id');
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class, 'id_periodo', 'id');
    }

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(Sesion::class, 'sesion_id', 'id_sesion');
    }
}