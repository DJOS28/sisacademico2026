<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeColectaService
{
    protected string $baseUrl;
    protected ?string $token;

    public function __construct()
    {
        $this->baseUrl = config('services.decolecta.base_url');
        $this->token   = config('services.decolecta.token');
    }

    /**
     * Consulta información de DNI en RENIEC.
     */
    public function consultarDni(string $dni): array
    {
        if (empty($this->token)) {
            Log::warning('DeColecta: Token no configurado en .env (DECOLECTA_TOKEN)');
            return [
                'success' => false,
                'message' => 'Token de DeColecta no configurado.',
            ];
        }

        try {
            $url = rtrim($this->baseUrl, '/') . '/reniec/dni';

            $response = Http::withToken($this->token)
                ->withoutVerifying()
                ->timeout(10)
                ->get($url, [
                    'numero' => trim($dni),
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data'    => $response->json(),
                ];
            }

            Log::error("DeColecta HTTP Error DNI {$dni}: " . $response->status() . " - " . $response->body());

            return [
                'success' => false,
                'message' => 'No se encontraron datos para el DNI ingresado.',
            ];
        } catch (\Throwable $e) {
            Log::error('Error DeColecta DNI: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Servicio de consulta de DNI no disponible momentáneamente.',
            ];
        }
    }

    /**
     * Consulta información completa de RUC en SUNAT.
     */
    public function consultarRuc(string $ruc): array
    {
        try {
            $response = Http::withToken($this->token)
                ->timeout(8)
                ->get("{$this->baseUrl}/sunat/ruc/full", [
                    'numero' => $ruc
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data'    => $response->json(),
                ];
            }

            return [
                'success' => false,
                'message' => 'No se encontraron datos para el RUC ingresado.',
            ];
        } catch (\Exception $e) {
            Log::error('Error DeColecta RUC: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Servicio de consulta de RUC no disponible momentáneamente.',
            ];
        }
    }
}