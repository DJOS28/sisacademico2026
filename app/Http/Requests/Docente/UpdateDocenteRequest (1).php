<?php

namespace App\Http\Requests\Docente;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocenteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $docente = $this->route('docente');
        $usuarioId = $docente?->usuario_id;

        return [
            'nombre' => ['required', 'string', 'max:100'],
            'apellido' => ['required', 'string', 'max:100'],
            'dni' => [
                'required',
                'digits:8',
                Rule::unique('docentes', 'dni')->ignore($docente?->id),
            ],
            'email' => ['nullable', 'email', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:15'],
            'direccion' => ['nullable', 'string', 'max:100'],
            'departamento' => ['nullable', 'string', 'max:50'],
            'cargo' => ['nullable', 'string', 'max:50'],

            'username' => [
                'required',
                'string',
                'max:50',
                'alpha_dash',
                Rule::unique('usuarios', 'username')->ignore($usuarioId),
            ],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'status' => [
                'required',
                Rule::in(['Disponible', 'No disponible']),
            ],
            'moodle_user_id' => ['nullable', 'integer', 'min:1'],
            'img' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_img' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'dni.digits' => 'El DNI debe contener exactamente 8 dígitos.',
            'dni.unique' => 'Ya existe un docente registrado con este DNI.',
            'username.unique' => 'El nombre de usuario ya está registrado.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
            'img.max' => 'La imagen no debe superar los 2 MB.',
        ];
    }
}
