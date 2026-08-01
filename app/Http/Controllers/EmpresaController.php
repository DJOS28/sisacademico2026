<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmpresaController extends Controller
{
    /**
     * Muestra el listado de empresas registradas.
     */
    public function index(Request $request)
    {
        $buscar = $request->input('buscar');

        $empresas = Empresa::with('usuario:id,username,status')
            ->when($buscar, function ($query, $buscar) {
                $query->where('nombre_empresa', 'like', "%{$buscar}%")
                    ->orWhere('ruc', 'like', "%{$buscar}%")
                    ->orWhere('nombre_contacto', 'like', "%{$buscar}%");
            })
            ->orderBy('id_empresa', 'desc')
            ->paginate(10)
            ->withQueryString();

        // Responder JSON directo si es una búsqueda AJAX limpia con Axios
        if ($request->boolean('ajax_search')) {
            return response()->json($empresas);
        }

        return Inertia::render('Empresas/Index', [
            'empresas' => $empresas,
            'filters'  => ['buscar' => $buscar],
        ]);
    }

    /**
     * Almacena una nueva empresa en la base de datos (con opción de crear usuario).
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre_empresa'    => 'required|string|max:255',
            'ruc'               => 'nullable|string|size:11|unique:empresas,ruc',
            'direccion_empresa' => 'nullable|string|max:255',
            'telefono_empresa'  => 'nullable|string|max:15',
            'email_contacto'    => 'nullable|email|max:100',
            'nombre_contacto'   => 'nullable|string|max:100',
            'logo'              => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'crear_usuario'     => 'boolean',
            'username'          => 'nullable|required_if:crear_usuario,true|string|max:50|unique:usuarios,username',
            'password'          => 'nullable|required_if:crear_usuario,true|string|min:6',
        ]);

        DB::transaction(function () use ($request) {
            $usuarioId = null;

            if ($request->boolean('crear_usuario')) {
                $usuario = Usuario::create([
                    'username'      => trim($request->username),
                    'password_hash' => Hash::make($request->password),
                    'status'        => 'Disponible',
                ]);

                $rolEmpresa = Rol::where('nombre', 'Empresa')->first();
                if ($rolEmpresa) {
                    $usuario->roles()->attach($rolEmpresa->id);
                }

                $usuarioId = $usuario->id;
            }

            $logoPath = null;
            if ($request->hasFile('logo')) {
                $logoPath = $request->file('logo')->store('empresas', 'public');
            }

            Empresa::create([
                'usuario_id'        => $usuarioId,
                'nombre_empresa'    => $request->nombre_empresa,
                'ruc'               => $request->ruc,
                'logo_empresa'      => $logoPath,
                'direccion_empresa' => $request->direccion_empresa,
                'telefono_empresa'  => $request->telefono_empresa,
                'email_contacto'    => $request->email_contacto,
                'nombre_contacto'   => $request->nombre_contacto,
                'estado'            => 'Activo',
            ]);
        });

        return redirect()->back()->with('success', 'Empresa registrada correctamente.');
    }

    /**
     * Actualiza la información de una empresa existente.
     */
    public function update(Request $request, $id)
    {
        $empresa = Empresa::findOrFail($id);

        $request->validate([
            'nombre_empresa'    => 'required|string|max:255',
            'ruc'               => 'nullable|string|size:11|unique:empresas,ruc,' . $id . ',id_empresa',
            'direccion_empresa' => 'nullable|string|max:255',
            'telefono_empresa'  => 'nullable|string|max:15',
            'email_contacto'    => 'nullable|email|max:100',
            'nombre_contacto'   => 'nullable|string|max:100',
            'estado'            => 'required|in:Activo,Inactivo',
            'logo'              => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        DB::transaction(function () use ($request, $empresa) {
            if ($request->hasFile('logo')) {
                if ($empresa->logo_empresa && Storage::disk('public')->exists($empresa->logo_empresa)) {
                    Storage::disk('public')->delete($empresa->logo_empresa);
                }
                $empresa->logo_empresa = $request->file('logo')->store('empresas', 'public');
            }

            $empresa->update([
                'nombre_empresa'    => $request->nombre_empresa,
                'ruc'               => $request->ruc,
                'direccion_empresa' => $request->direccion_empresa,
                'telefono_empresa'  => $request->telefono_empresa,
                'email_contacto'    => $request->email_contacto,
                'nombre_contacto'   => $request->nombre_contacto,
                'estado'            => $request->estado,
            ]);

            if ($empresa->usuario) {
                $empresa->usuario->update([
                    'status' => $request->estado === 'Activo' ? 'Disponible' : 'Inactivo',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Datos de la empresa actualizados.');
    }

    /**
     * Elimina una empresa.
     */
    public function destroy($id)
    {
        $empresa = Empresa::findOrFail($id);

        DB::transaction(function () use ($empresa) {
            if ($empresa->logo_empresa && Storage::disk('public')->exists($empresa->logo_empresa)) {
                Storage::disk('public')->delete($empresa->logo_empresa);
            }

            $usuario = $empresa->usuario;

            $empresa->delete();

            if ($usuario) {
                $usuario->roles()->detach();
                $usuario->delete();
            }
        });

        return redirect()->back()->with('success', 'Empresa eliminada correctamente.');
    }
}