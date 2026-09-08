<?php

namespace App\Http\Controllers;

use App\Services\MoodleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MoodleSsoController extends Controller
{
    protected MoodleService $moodleService;

    public function __construct(MoodleService $moodleService)
    {
        $this->moodleService = $moodleService;
    }

    public function ingresar(Request $request): RedirectResponse
    {
        $usuario = Auth::user();

        if (!$usuario) {
            return redirect()->route('login');
        }

        $loginUrl = $this->moodleService->generarLoginUrl($usuario->username);

        if ($loginUrl) {
            return redirect()->away($loginUrl);
        }

        // Redirección de respaldo si no genera URL
        $urlMoodle = config('services.moodle.url') ?? env('MOODLE_URL');
        $baseUrl = str_replace('/webservice/rest/server.php', '', $urlMoodle);

        return redirect()->away($baseUrl);
    }
}