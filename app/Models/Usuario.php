<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Usuario extends Authenticatable
{
    use HasFactory;

    protected $table = 'usuarios';

    protected $primaryKey = 'id';

    protected $fillable = [
        'moodle_user_id',
        'username',
        'password_hash',
        'status',
        'img',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'moodle_user_id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Laravel validará la contraseña contra usuarios.password_hash.
     */
    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Rol::class,
            'usuario_roles',
            'usuario_id',
            'rol_id'
        )->withTimestamps();
    }

    public function areas(): BelongsToMany
    {
        return $this->belongsToMany(
            Area::class,
            'usuario_areas',
            'usuario_id',
            'area_id'
        )
            ->withPivot('activo')
            ->withTimestamps();
    }

    public function administrador(): HasOne
    {
        return $this->hasOne(
            Administrador::class,
            'usuario_id',
            'id'
        );
    }

    public function docente(): HasOne
    {
        return $this->hasOne(
            Docente::class,
            'usuario_id',
            'id'
        );
    }

    public function cajero(): HasOne
    {
        return $this->hasOne(
            Cajero::class,
            'usuario_id',
            'id'
        );
    }

    public function personal(): HasOne
    {
        return $this->hasOne(
            Personal::class,
            'usuario_id',
            'id'
        );
    }

    public function postulante(): HasOne
    {
        return $this->hasOne(
            Postulante::class,
            'usuario_id',
            'id'
        );
    }

    /**
     * Obtiene el perfil asociado al usuario.
     */
    public function perfil(): ?Model
    {
        return $this->administrador
            ?? $this->docente
            ?? $this->cajero
            ?? $this->personal
            ?? $this->postulante;
    }

    /**
     * Nombre completo del usuario según su perfil asociado.
     */
    protected function nombreCompleto(): Attribute
    {
        return Attribute::get(function (): string {
            $perfil = $this->perfil();

            if (! $perfil) {
                return $this->username;
            }

            /*
             * Los perfiles administrativos usan:
             * nombre y apellido.
             *
             * Postulantes usa:
             * nombres y apellidos.
             */
            $nombres = $perfil->nombre
                ?? $perfil->nombres
                ?? null;

            $apellidos = $perfil->apellido
                ?? $perfil->apellidos
                ?? null;

            $nombreCompleto = trim(
                implode(' ', array_filter([
                    $nombres,
                    $apellidos,
                ]))
            );

            return $nombreCompleto !== ''
                ? $nombreCompleto
                : $this->username;
        });
    }

    protected function rolPrincipal(): Attribute
    {
        return Attribute::get(
            fn (): ?string => $this->roles->first()?->nombre
        );
    }

    public function tieneRol(string $rol): bool
    {
        return $this->roles->contains(
            fn (Rol $item): bool =>
                mb_strtolower(trim($item->nombre), 'UTF-8')
                === mb_strtolower(trim($rol), 'UTF-8')
        );
    }

    public function estaActivo(): bool
    {
        return $this->status === 'Activo';
    }

    /**
     * Se conserva por compatibilidad con código anterior.
     */
    public function estaDisponible(): bool
    {
        return $this->estaActivo();
    }

    
}