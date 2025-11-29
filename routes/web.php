<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/view/code/{codigo}/game', function (string $codigo): Response {
    $meta = [
        'metaTitle' => 'Juega y gana con RuletaXpress',
        'metaDescription' => 'Ingresa tu código y gira la ruleta para participar y ganar premios al instante.',
        'metaImage' => asset('apple-touch-icon.png'),
        'metaUrl' => request()->fullUrl(),
    ];

    return Inertia::render('game/CodeGame', [
        'code' => $codigo,
    ])->withViewData($meta);
})->name('view.code.game');

require __DIR__.'/settings.php';
