<?php

namespace App\Jobs;

use App\Imports\EstudiantesImport;
use App\Services\MoodleService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ProcesarImportacionEstudiantesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600; // 10 minutos máximo de ejecución
    public int $tries = 2;

    protected string $rutaArchivo;

    public function __construct(string $rutaArchivo)
    {
        $this->rutaArchivo = $rutaArchivo;
    }

    public function handle(MoodleService $moodleService): void
    {
        $rutaCompleta = storage_path('app/' . $this->rutaArchivo);

        if (!file_exists($rutaCompleta)) {
            Log::error("Archivo de importación no encontrado: {$rutaCompleta}");
            return;
        }

        try {
            $importador = new EstudiantesImport($moodleService);
            Excel::import($importador, $rutaCompleta);

            Log::info("Importación masiva completada en segundo plano:", [
                'procesados' => $importador->procesados,
                'omitidos'   => $importador->omitidos,
                'errores'    => $importador->errores,
            ]);
        } catch (\Throwable $e) {
            Log::error("Fallo crítico en Job de importación masiva: " . $e->getMessage());
        } finally {
            // Eliminar archivo temporal una vez finalizado el proceso
            if (Storage::exists($this->rutaArchivo)) {
                Storage::delete($this->rutaArchivo);
            }
        }
    }
}