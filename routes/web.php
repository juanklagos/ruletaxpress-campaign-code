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
    return Inertia::render('game/CodeGame', [
        'code' => $codigo,
    ]);
})->name('view.code.game');

require __DIR__.'/settings.php';
