<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Postulante extends Model
{
    use HasFactory;

    protected $table = 'postulantes';

    protected $primaryKey = 'id_postulante';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = true;

    protected $fillable = [
        'codigo_postulante',
        'nombres',
        'apellidos',
        'dni',
        'email',
        'telefono',
        'genero',
        'fecha_nacimiento',
        'lengua_materna',
        'foto_postulante',
        'direccion',
        'usuario_id',
        'id_colegio',
        'año_egreso',
        'discapacidad',
        'nombre_discapacidad',
        'fecha_registro',
        'certificado_estudios',
        'partida_nacimiento',
        'comprobante_pago',
        'copia_dni',
        'id_medio_pago',
        'fuente_inscripcion',
        'curriculum_archivo',
        'grado',
    ];

    protected $appends = [
        'nombre_completo',
    ];

    protected function casts(): array
    {
        return [
            'id_postulante' => 'integer',
            'fecha_nacimiento' => 'date:Y-m-d',
            'fecha_registro' => 'datetime',
            'discapacidad' => 'boolean',
            'usuario_id' => 'integer',
            'id_colegio' => 'integer',
            'id_medio_pago' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Nombre completo del postulante o estudiante.
     */
    protected function nombreCompleto(): Attribute
{
    return Attribute::make(
        get: function () {
            $apellidos = trim($this->apellidos ?? $this->apellido ?? '');
            $nombres   = trim($this->nombres ?? $this->nombre ?? '');

            if ($apellidos !== '' && $nombres !== '') {
                return "{$apellidos}, {$nombres}";
            }

            return $apellidos ?: $nombres ?: 'Sin Nombre';
        }
    );
}

    /**
     * Usuario vinculado al postulante.
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id');
    }

    /**
     * Colegio de procedencia.
     */
    public function colegio(): BelongsTo
    {
        return $this->belongsTo(Colegio::class, 'id_colegio', 'id_colegio');
    }

    /**
     * Medio o tipo de pago registrado.
     *
     * Se conserva el nombre medioPago porque el controlador utiliza esa relación.
     */
    public function medioPago(): BelongsTo
    {
        return $this->belongsTo(TipoPago::class, 'id_medio_pago', 'id_tipo_pago');
    }

    /**
     * Alias compatible con código anterior.
     */
    public function tipoPago(): BelongsTo
    {
        return $this->medioPago();
    }

    

    /**
     * Inscripciones realizadas.
     */
    public function inscripciones(): HasMany
    {
        return $this->hasMany(Inscripcion::class, 'id_postulante', 'id_postulante');
    }

    /**
     * Matrículas académicas.
     */
    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class, 'postulante_id', 'id_postulante');
    }

    /**
     * Pagos realizados por el postulante.
     */
    public function pagosPostulantes(): HasMany
    {
        return $this->hasMany(PagoPostulante::class, 'postulante_id', 'id_postulante');
    }

    /**
     * Resultados de admisión.
     */
    public function resultadosAdmision(): HasMany
    {
        return $this->hasMany(ResultadoAdmision::class, 'postulante_id', 'id_postulante');
    }

    /**
     * Prácticas profesionales.
     */
    public function practicasProfesionales(): HasMany
    {
        return $this->hasMany(PracticaProfesional::class, 'postulante_id', 'id_postulante');
    }

    /**
     * Solicitudes de trámites.
     */
    public function solicitudesTramites(): HasMany
    {
        return $this->hasMany(SolicitudTramite::class, 'postulante_id', 'id_postulante');
    }

    /**
     * Permite buscar por código, DNI, nombres, apellidos, correo o teléfono.
     */
    public function scopeBuscar($query, ?string $buscar)
    {
        $buscar = trim((string) $buscar);

        if ($buscar === '') {
            return $query;
        }

        return $query->where(function ($subquery) use ($buscar) {
            $subquery->where('codigo_postulante', 'like', "%{$buscar}%")
                ->orWhere('dni', 'like', "%{$buscar}%")
                ->orWhere('nombres', 'like', "%{$buscar}%")
                ->orWhere('apellidos', 'like', "%{$buscar}%")
                ->orWhere('email', 'like', "%{$buscar}%")
                ->orWhere('telefono', 'like', "%{$buscar}%");
        });
    }

    /**
     * Filtra únicamente postulantes con usuario.
     */
    public function scopeConUsuario($query)
    {
        return $query->whereNotNull('usuario_id');
    }

    /**
     * Filtra únicamente postulantes sin usuario.
     */
    public function scopeSinUsuario($query)
    {
        return $query->whereNull('usuario_id');
    }

    /**
     * Filtra personas registradas como estudiantes.
     */
    public function scopeEstudiantes($query)
    {
        return $query->where('grado', 'Estudiante');
    }

    /**
     * Filtra personas con discapacidad registrada.
     */
    public function scopeConDiscapacidad($query)
    {
        return $query->where('discapacidad', true);
    }

    /**
     * Postulaciones realizadas por el estudiante.
     */
    public function postulaciones(): HasMany
    {
        return $this->hasMany(Postulacion::class, 'id_postulante', 'id_postulante');
    }

    public function notasCriterios(): HasMany
    {
        return $this->hasMany(NotaCriterio::class, 'estudiante_id', 'id_postulante');
    }
}