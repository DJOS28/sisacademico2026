<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class SubcomponenteLogro extends Model
{
    use HasFactory;

    // Nombre exacto de la tabla en tu base de datos
    protected $table = 'subcomponentes_logro';

    // Desactivar timestamps si la tabla no tiene created_at / updated_at
    public $timestamps = false;

    protected $fillable = [
        'logro_curso_id',
        'nombre',
        'descripcion',
        'peso',
    ];

    protected $casts = [
        'peso' => 'float',
    ];

    /**
     * Relación inversa con el Logro de Curso.
     */
    public function logro()
    {
        return $this->belongsTo(LogroCurso::class, 'logro_curso_id');
    }

    public function notas(): HasMany
    {
        return $this->hasMany(NotaSubcomponente::class, 'subcomponente_id', 'id');
    }

    public function criterios(): HasMany
    {
        return $this->hasMany(CriterioSubcomponente::class, 'subcomponente_id', 'id')->orderBy('orden', 'asc');
    }
}