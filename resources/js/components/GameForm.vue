<script setup lang="ts">
import type { CampaignData } from '@/types/campaign-response';
import { Dialog, DialogPanel, DialogTitle, Switch } from '@headlessui/vue';
import { computed, defineEmits, defineProps, reactive, ref, watch } from 'vue';

const props = defineProps<{
    campaign: CampaignData | null;
}>();

const emits = defineEmits<{
    (event: 'submit', payload: Record<string, string>): void;
    (event: 'ready', isReady: boolean): void;
}>();

const formState = reactive<Record<string, any>>({});

const fields = computed(() => {
    const form = props.campaign?.campaign_game?.config.form;
    if (!form) {
        return [] as any[];
    }

    return Object.entries(form).map(([key, field]: [string, any]) => ({
        key,
        label: field.data.label ?? field.data.key ?? 'Campo sin nombre',
        type: field.type.toLowerCase(),
        placeholder: field.data.placeholder,
        required: Boolean(field.data.required),
        helper: field.data.helper,
        options: field.data.options ?? [],
        // bring the checked flag for checkbox fields
        checked: field.data.checked ?? false,
    }));
});

// error messages per field (null = no error)
const errors = reactive<Record<string, string | null>>({});

// initialize errors keys when fields change
watch(
    fields,
    (value) => {
        value.forEach((field) => {
            if (!(field.key in errors)) {
                errors[field.key] = null;
            }
        });
    },
    { immediate: true },
);

// validate a single field and set an inline error message (returns true if valid)
const validateField = (field: any): boolean => {
    const val = formState[field.key];
    let msg: string | null = null;

    // required checks
    if (field.required) {
        if (field.type === 'checkbox') {
            if (!Boolean(val)) {
                msg = 'Este campo es obligatorio.';
            }
        } else if (String(val ?? '').trim().length === 0) {
            msg = 'Este campo es obligatorio.';
        }
    }

    // type specific checks (only if not already failing required)
    if (!msg && String(val ?? '').trim().length) {
        if (field.type === 'email') {
            if (!/\S+@\S+\.\S+/.test(String(val))) {
                msg = 'Introduce un correo válido.';
            }
        }
        if (field.type === 'number') {
            if (isNaN(Number(val))) {
                msg = 'Introduce un número válido.';
            }
        }
        if (field.type === 'date') {
            const parsed = Date.parse(String(val));
            if (Number.isNaN(parsed)) {
                msg = 'Introduce una fecha válida.';
            }
        }
    }

    errors[field.key] = msg;
    return msg === null;
};

// validate all fields when the form state changes
watch(
    formState,
    () => {
        fields.value.forEach((f: any) => validateField(f));
    },
    { deep: true },
);

watch(
    fields,
    (value) => {
        const next: Record<string, any> = {};
        value.forEach((field) => {
            if (field.type === 'checkbox') {
                // for checkboxes use the provided checked default (boolean)
                next[field.key] =
                    formState[field.key] ??
                    Boolean((field as any).checked ?? false);
            } else {
                next[field.key] = formState[field.key] ?? '';
            }
        });
        Object.keys(formState).forEach((key) => {
            if (!(key in next)) {
                delete formState[key];
            }
        });
        Object.assign(formState, next);
    },
    { immediate: true },
);

const themeClasses = computed(() => {
    const theme = props.campaign?.campaign_game?.config.form_theme;
    const isLight = theme === 'light';
    return {
        primary: isLight ? 'text-slate-700' : 'text-white',
        secondary: isLight ? 'text-slate-500' : 'text-white/70',
        muted: isLight ? 'text-slate-500' : 'text-white/60',
        label: isLight ? 'text-slate-600' : 'text-white/60',
        input: isLight
            ? 'border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-400/40'
            : 'border border-white/20 bg-white/5 text-white focus:ring-1 focus:ring-amber-400/60',
    };
});

const ctaLabel = computed(
    () => props.campaign?.campaign_game?.config.cta_button?.label ?? 'Spin it',
);
const header = computed(() => ({
    title:
        props.campaign?.campaign_game?.config.form_header?.title ??
        'Gana premios al instante',
    description:
        props.campaign?.campaign_game?.config.form_header?.description ??
        '<p>Ingresa tus datos para girar la ruleta y reclamar recompensas.</p>',
}));
const formMessage = ref<string | null>(null);
const submitting = ref(false);
const isHovering = ref(false);
const showTerms = ref(false);

const adjustColor = (hex: string, amount: number): string => {
    const normalized = hex.replace('#', '');
    const num = parseInt(normalized, 16);
    const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const ctaButton = computed(
    () => props.campaign?.campaign_game?.config.cta_button,
);
const buttonClasses = computed(() => [
    'w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
    ctaButton.value?.full_width ? 'w-full' : '',
]);

const buttonStyle = computed(() => ({
    background: ctaButton.value?.bg_color ?? '#f97316',
    color: ctaButton.value?.text_color ?? '#111827',
}));

const hoverBackground = computed(() =>
    adjustColor(buttonStyle.value.background, 12),
);
const activeBackground = computed(() =>
    isHovering.value ? hoverBackground.value : buttonStyle.value.background,
);

const alignClass = computed(() => {
    const align = ctaButton.value?.align;
    if (align === 'center') {
        return 'justify-center';
    }
    if (align === 'right') {
        return 'justify-end';
    }
    return 'justify-start';
});

const handleSubmit = () => {
    submitting.value = true;

    // validate all fields before submit
    fields.value.forEach((f: any) => validateField(f));
    if (!isValid.value) {
        formMessage.value = 'Por favor, corrige los campos marcados.';
        submitting.value = false;
        return;
    }

    // normalize values: booleans -> '1'|'0', others -> string
    const payload: Record<string, string> = {};
    Object.entries(formState).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
            payload[key] = value ? '1' : '0';
        } else if (value === null || value === undefined) {
            payload[key] = '';
        } else {
            payload[key] = String(value);
        }
    });

    emits('submit', payload);
    formMessage.value = '¡Todo listo para registrar tu participación!';
    submitting.value = false;
};

// Validity is derived from `errors` object. A field is valid when its error is null.
const isValid = computed(() => {
    if (!fields.value || !fields.value.length) return false;
    return fields.value.every((f: any) => errors[f.key] === null);
});

watch(
    isValid,
    (next) => {
        emits('ready', next);
    },
    { immediate: true },
);

function setIsOpen(value: boolean) {
    showTerms.value = value;
}
</script>

<template>
    <div>
        <div class="space-y-2">
            <h2 class="text-3xl font-bold text-amber-500">
                {{ header.title }}
            </h2>
            <p class="text-sm text-slate-500" v-html="header.description"></p>
        </div>
        <form @submit.prevent="handleSubmit" class="mt-6 space-y-4">
            <div
                v-if="!props.campaign"
                :class="[
                    'rounded-2xl border p-4 text-sm',
                    themeClasses.muted,
                    themeClasses.primary === 'text-slate-700'
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-white/10 bg-white/5',
                ]"
            >
                Esperando la configuración de la campaña...
            </div>
            <div
                v-else-if="!fields.length"
                :class="[
                    'rounded-2xl border p-4 text-sm',
                    themeClasses.muted,
                    themeClasses.primary === 'text-slate-700'
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-white/10 bg-white/5',
                ]"
            >
                El formulario aún no tiene campos configurados.
            </div>
            <div v-for="field in fields" :key="field.key" class="space-y-2">
                <label
                    :class="[
                        'text-xs font-semibold tracking-[0.3em] uppercase',
                        themeClasses.label,
                    ]"
                    :for="field.key"
                >
                    {{ field.label }}
                </label>
                <template v-if="field.type === 'textarea'">
                    <textarea
                        :id="field.key"
                        v-model="formState[field.key]"
                        :placeholder="field.placeholder ?? ''"
                        :required="field.required"
                        :class="[
                            'h-28 w-full rounded-2xl px-4 py-3 text-sm transition outline-none',
                            themeClasses.input,
                        ]"
                    ></textarea>
                </template>
                <template v-else-if="field.type === 'select'">
                    <select
                        :id="field.key"
                        v-model="formState[field.key]"
                        :required="field.required"
                        :class="[
                            'w-full rounded-2xl px-4 py-3 text-sm transition outline-none',
                            themeClasses.input,
                        ]"
                    >
                        <option value="" disabled selected>
                            Selecciona...
                        </option>
                        <option
                            v-for="option in field.options"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </select>
                </template>
                <template v-else-if="field.type === 'checkbox'">
                    <Switch
                        :id="field.key"
                        v-model="formState[field.key]"
                        as="button"
                        :class="[
                            'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm transition',
                            themeClasses.input,
                        ]"
                        @click="formState[field.key] = !formState[field.key]"
                    >
                        <span :class="themeClasses.primary">{{
                            field.label
                        }}</span>
                        <span class="text-xs text-slate-400">
                            {{ formState[field.key] ? 'Sí' : 'No' }}
                        </span>
                    </Switch>
                </template>
                <template v-else>
                    <input
                        :id="field.key"
                        v-model="formState[field.key]"
                        :type="field.type"
                        :placeholder="field.placeholder ?? ''"
                        :required="field.required"
                        :class="[
                            'w-full rounded-2xl px-4 py-3 text-sm transition outline-none',
                            themeClasses.input,
                        ]"
                    />
                </template>
                <p v-if="errors[field.key]" :class="['text-xs text-red-500']">
                    {{ errors[field.key] }}
                </p>
                <p
                    v-if="field.helper"
                    :class="['text-xs', themeClasses.secondary]"
                >
                    {{ field.helper }}
                </p>
            </div>
            <div :class="['flex', alignClass]">
                <button
                    type="submit"
                    :class="[...buttonClasses, 'cursor-pointer']"
                    :style="[
                        { background: activeBackground },
                        { color: buttonStyle.color },
                    ]"
                    :disabled="submitting || !fields.length || !isValid"
                    @mouseenter="isHovering = true"
                    @mouseleave="isHovering = false"
                >
                    {{ submitting ? 'Enviando...' : ctaLabel }}
                </button>
            </div>

            <p v-if="formMessage" :class="['text-xs', themeClasses.muted]">
                {{ formMessage }}
            </p>
            <p v-else :class="['text-xs', themeClasses.secondary]">
                El formulario aún está en modo de prueba hasta integrar el
                backend real.
            </p>
        </form>
        <div class="mt-2 text-sm">
            <button
                type="button"
                class="cursor-pointer text-xs text-slate-400 underline"
                @click="setIsOpen(true)"
            >
                Ver términos y condiciones
            </button>
        </div>
    </div>
    <!-- Terms modal -->
    <Dialog v-model:open="showTerms" as="div" class="relative z-10">
        <div class="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
        <div class="fixed inset-0 overflow-y-auto">
            <div class="flex min-h-full items-center justify-center p-4 text-center">
                <DialogPanel class="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                    <DialogTitle class="text-lg font-semibold text-slate-900">Términos y condiciones</DialogTitle>
                    <div class="mt-4 max-h-[60vh] overflow-auto text-sm text-slate-700" v-html="props.campaign?.terms"></div>
                    <div class="mt-4 text-right">
                        <button @click="setIsOpen(false)" type="button" class="inline-flex justify-center rounded-md border border-transparent bg-amber-500 px-4 py-2 text-sm font-medium text-white">Cerrar</button>
                    </div>
                </DialogPanel>
            </div>
        </div>
    </Dialog>
</template>
