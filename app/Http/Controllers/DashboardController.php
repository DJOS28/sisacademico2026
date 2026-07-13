<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $usuario = $request->user();

        if ($usuario->tieneRol('Estudiante')) {
            return Inertia::render('Dashboard/EstudianteDashboard', [
                'dashboardType' => 'estudiante',
            ]);
        }

        if ($usuario->tieneRol('Docente')) {
            return Inertia::render('Dashboard/DocenteDashboard', [
                'dashboardType' => 'docente',
            ]);
        }

        return Inertia::render('Dashboard/AdminDashboard', [
            'dashboardType' => 'administrativo',
        ]);
    }
}