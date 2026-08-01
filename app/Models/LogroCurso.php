<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class LogroCurso extends Model
{
    protected $table = 'logros_curso';

    public $timestamps = false;

    protected $fillable = [
        'curso_id',
        'id_seccion',
        'id_periodo',
        'id_docente',
        'nombre',
        'descripcion',
    ];

    // Relación con sus subcomponentes
    public function subcomponentes(): HasMany
    {
        return $this->hasMany(SubcomponenteLogro::class, 'logro_curso_id');
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class, 'curso_id', 'id');
    }

    public function notasLogros(): HasMany
    {
        return $this->hasMany(NotaLogro::class, 'logro_curso_id', 'id');
    }
}