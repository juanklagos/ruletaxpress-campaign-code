<script setup lang="ts">
import axios from 'axios';
import { Head } from '@inertiajs/vue3';
import { onMounted, ref, toRef } from 'vue';

const props = defineProps<{
    code: string;
}>();

const code = toRef(props, 'code');
const copied = ref(false);
const loading = ref(true);
const error = ref<string | null>(null);
const campaign = ref<Record<string, unknown> | null>(null);

const copyCode = async (): Promise<void> => {
    await navigator.clipboard.writeText(code.value);
    copied.value = true;
    window.setTimeout(() => {
        copied.value = false;
    }, 1500);
};

const fetchCampaign = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    campaign.value = null;

    try {
        const response = await axios.get(
            `https://ruletaxpress.pro/api/campaigns/code/${encodeURIComponent(code.value)}`,
        );

        campaign.value = response.data as Record<string, unknown>;
    } catch (err) {
        error.value = axios.isAxiosError(err)
            ? (err.response?.data as { message?: string })?.message ??
                err.message
            : 'No se pudo obtener la campaña. Intenta nuevamente.';
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    void fetchCampaign();
});
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
                    class="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all duration-200 hover:shadow-[0_12px_34px_rgba(0,0,0,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
                    :disabled="copied"
                    @click="copyCode"
                >
                    {{ copied ? 'Copiado' : 'Copiar' }}
                </button>
            </div>

            <div
                class="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5"
            >
                <div class="flex items-center justify-between gap-3">
                    <div>
                        <p class="text-sm font-semibold text-white/80">
                            Detalles de la campaña
                        </p>
                        <p class="text-xs text-white/60">
                            Consultando el código en la API externa.
                        </p>
                    </div>
                    <button
                        type="button"
                        class="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="loading"
                        @click="fetchCampaign"
                    >
                        {{ loading ? 'Actualizando…' : 'Reintentar' }}
                    </button>
                </div>

                <div class="mt-4 min-h-[120px] rounded-xl bg-black/30 p-4">
                    <template v-if="loading">
                        <p class="text-sm text-white/70">Consultando campaña…</p>
                    </template>
                    <template v-else-if="error">
                        <p class="text-sm text-red-200">
                            {{ error }}
                        </p>
                    </template>
                    <template v-else-if="campaign">
                        <pre
                            class="whitespace-pre-wrap text-sm text-white/90"
                        >{{ campaign }}</pre>
                    </template>
                    <template v-else>
                        <p class="text-sm text-white/70">
                            No hay datos disponibles para este código todavía.
                        </p>
                    </template>
                </div>
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
