<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class NotificacionService
{
    /**
     * Notificar a todos los estudiantes matriculados en un curso y sección
     */
    public static function notificarEstudiantesDeCurso($cursoId, $seccionId = null, $periodoId = null, $mensaje = '', $tipo = 'academico', $url = null)
    {
        // 1. Obtener los usuario_id de los estudiantes con matrícula activa en este curso
        $query = DB::table('matricula_cursos as mc')
            ->join('matriculas as m', 'm.id', '=', 'mc.matricula_id')
            ->join('postulantes as p', 'p.id_postulante', '=', 'm.postulante_id')
            ->join('usuarios as u', 'u.id', '=', 'p.usuario_id')
            ->where('mc.curso_id', $cursoId)
            ->whereIn('m.estado', ['Matriculado', 'matriculado', 'MATRICULADO']);

        if ($periodoId) {
            $query->where('m.periodo_id', $periodoId);
        }

        // Si se define sección, validar a través del horario
        if ($seccionId) {
            $query->join('horarios as h', 'h.id', '=', 'mc.horario_id')
                  ->where('h.id_seccion', $seccionId);
        }

        $usuariosEstudiantes = $query->distinct()->pluck('u.id');

        if ($usuariosEstudiantes->isEmpty()) {
            return;
        }

        // 2. Insertar una notificación por cada estudiante destinatario
        $inserts = [];
        $ahora = now();

        foreach ($usuariosEstudiantes as $destinatarioId) {
            $inserts[] = [
                'usuario_id' => $destinatarioId, // ID del estudiante que recibe el aviso
                'mensaje'    => $mensaje,
                'tipo'       => $tipo,
                'url'        => $url,
                'leido'      => 0,
                'fecha'      => $ahora,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ];
        }

        DB::table('notificaciones')->insert($inserts);
    }

    /**
     * Notificar a un solo estudiante
     */
    public static function notificarEstudiante($postulanteId, $mensaje, $tipo = 'notas', $url = null)
    {
        $usuarioId = DB::table('postulantes')->where('id_postulante', $postulanteId)->value('usuario_id');
        if (!$usuarioId) return;

        DB::table('notificaciones')->insert([
            'usuario_id' => $usuarioId,
            'mensaje'    => $mensaje,
            'tipo'       => $tipo,
            'url'        => $url,
            'leido'      => 0,
            'fecha'      => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}