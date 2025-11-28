<?php

use Inertia\Testing\AssertableInertia as Assert;

test('game code view renders with provided code', function () {
    $code = 'ABC123';

    $response = $this->get(route('view.code.game', ['codigo' => $code]));

    $response->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('game/CodeGame')
        ->where('code', $code)
    );
});
