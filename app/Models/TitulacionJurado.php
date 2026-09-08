<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TitulacionJurado extends Model
{
    use HasFactory;

    protected $table = 'titulacion_jurados';

    public $timestamps = false;

    protected $fillable = [
        'titulacion_id',
        'docente_id',
        'cargo',
    ];

    public function titulacion(): BelongsTo
    {
        return $this->belongsTo(Titulacion::class, 'titulacion_id');
    }

    public function docente(): BelongsTo
    {
        return $this->belongsTo(Docente::class, 'docente_id');
    }
}