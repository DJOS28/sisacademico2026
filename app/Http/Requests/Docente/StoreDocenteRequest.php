<?php

namespace App\Http\Requests\Docente;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocenteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'nombre' => [
                'required',
                'string',
                'max:100',
            ],

            'apellido' => [
                'required',
                'string',
                'max:100',
            ],

            'dni' => [
                'required',
                'digits:8',
                Rule::unique('docentes', 'dni'),
            ],

            'email' => [
                'nullable',
                'email',
                'max:100',
                Rule::unique('docentes', 'email'),
            ],

            'telefono' => [
                'nullable',
                'string',
                'max:15',
            ],

            'direccion' => [
                'nullable',
                'string',
                'max:100',
            ],

            'departamento' => [
                'nullable',
                'string',
                'max:50',
            ],

            'cargo' => [
                'nullable',
                'string',
                'max:50',
            ],

            'username' => [
                'required',
                'string',
                'max:50',
                'alpha_dash',
                Rule::unique('usuarios', 'username'),
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'status' => [
                'required',
                Rule::in([
                    'Activo',
                    'No disponible',
                ]),
            ],

            'moodle_user_id' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'img' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' =>
                'Los nombres son obligatorios.',

            'apellido.required' =>
                'Los apellidos son obligatorios.',

            'dni.required' =>
                'El DNI es obligatorio.',

            'dni.digits' =>
                'El DNI debe contener exactamente 8 dígitos.',

            'dni.unique' =>
                'Ya existe un docente registrado con este DNI.',

            'email.email' =>
                'El correo electrónico no tiene un formato válido.',

            'email.unique' =>
                'Ya existe un docente registrado con este correo electrónico.',

            'username.required' =>
                'El nombre de usuario es obligatorio.',

            'username.unique' =>
                'El nombre de usuario ya está registrado.',

            'username.alpha_dash' =>
                'El usuario solo puede contener letras, números, guiones y guion bajo.',

            'password.required' =>
                'La contraseña es obligatoria.',

            'password.min' =>
                'La contraseña debe tener al menos 8 caracteres.',

            'password.confirmed' =>
                'La confirmación de contraseña no coincide.',

            'status.required' =>
                'El estado es obligatorio.',

            'status.in' =>
                'El estado seleccionado no es válido.',

            'img.image' =>
                'El archivo debe ser una imagen.',

            'img.max' =>
                'La imagen no debe superar los 2 MB.',
        ];
    }
}