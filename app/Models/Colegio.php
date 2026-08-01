<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Colegio extends Model
{
    use HasFactory;

    protected $table = 'colegios';

    protected $primaryKey = 'id_colegio';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = true;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'id_colegio' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Postulantes procedentes del colegio.
     */
    public function postulantes(): HasMany
    {
        return $this->hasMany(
            Postulante::class,
            'id_colegio',
            'id_colegio'
        );
    }
}