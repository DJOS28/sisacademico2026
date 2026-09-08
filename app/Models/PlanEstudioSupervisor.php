<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlanEstudioSupervisor extends Model
{
    use HasFactory;

    protected $table = 'plan_estudio_supervisor';

    protected $primaryKey = 'id';

    public $timestamps = true;

    protected $fillable = [
        'plan_estudio_id',
        'usuario_id',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'plan_estudio_id' => 'integer',
            'usuario_id'      => 'integer',
            'activo'          => 'boolean',
            'created_at'      => 'datetime',
            'updated_at'      => 'datetime',
        ];
    }

    public function planEstudio(): BelongsTo
    {
        return $this->belongsTo(PlanEstudio::class, 'plan_estudio_id', 'id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }
}