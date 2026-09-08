<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Supervision extends Model
{
    use HasFactory;

    protected $table = 'supervisiones';

    protected $primaryKey = 'id';

    protected $fillable = [
        'horario_id',
        'sesion_id',
        'fecha',
        'puntaje',
        'estado',
        'tiene_silabo',
        'tiene_asistencia',
        'tiene_archivo',
        'tiene_notas',
        'observaciones',
        'usuario_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha'            => 'date',
            'puntaje'          => 'decimal:2',
            'tiene_silabo'     => 'boolean',
            'tiene_asistencia' => 'boolean',
            'tiene_archivo'    => 'boolean',
            'tiene_notas'      => 'boolean',
            'usuario_id'       => 'integer',
            'horario_id'       => 'integer',
            'sesion_id'        => 'integer',
        ];
    }

    public function horario(): BelongsTo
    {
        return $this->belongsTo(Horario::class, 'horario_id', 'id');
    }

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(Sesion::class, 'sesion_id', 'id_sesion');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }
}