<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { ref, toRef } from 'vue';

const props = defineProps<{
    code: string;
}>();

const code = toRef(props, 'code');
const copied = ref(false);

const copyCode = async (): Promise<void> => {
    await navigator.clipboard.writeText(code.value);
    copied.value = true;
    window.setTimeout(() => {
        copied.value = false;
    }, 1500);
};
</script>

<template>
    <Head title="Código de juego" />

    <div
        class="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0d1b2a] via-[#0b1320] to-[#0f172a] px-6 py-10 text-white"
    >
        <div
            class="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        >
            <p
                class="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/60"
            >
                Código recibido
            </p>
            <h1 class="text-3xl font-semibold leading-tight">
                Prepara tu juego
            </h1>
            <p class="mt-2 text-base text-white/70">
                Usa este código para iniciar la partida y compartirlo con tu
                equipo.
            </p>

            <div
                class="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-5 py-4"
            >
                <span class="text-2xl font-mono tracking-wide text-white">
                    {{ code }}
                </span>
                <button
                    type="button"
                    class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all duration-200 hover:shadow-[0_12px_34px_rgba(0,0,0,0.25)]"
                    :disabled="copied"
                    @click="copyCode"
                >
                    {{ copied ? 'Copiado' : 'Copiar' }}
                </button>
            </div>

            <div class="mt-6 grid gap-2 text-sm text-white/70">
                <p>
                    Si el código no coincide, solicita uno nuevo desde el panel
                    de control.
                </p>
                <p class="text-white/50">
                    Ruta:
                    <span class="font-mono text-white/80">
                        /view/code/{{ code }}/game
                    </span>
                </p>
            </div>
        </div>
    </div>
</template>
