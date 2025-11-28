<script setup lang="ts">
import { computed, defineEmits, defineProps, reactive, watch } from 'vue'

type Field = {
  key: string
  label: string
  type: string
  placeholder?: string
  required: boolean
  helper?: string
}

const props = defineProps<{
  fields: Field[]
  ctaLabel: string
  theme?: 'light' | 'dark'
  loading?: boolean
  submitting?: boolean
  message?: string | null
}>()

const emits = defineEmits<{
  (event: 'submit', payload: Record<string, string>): void
}>()

const formState = reactive<Record<string, string>>({})

watch(
  () => props.fields,
  (fields) => {
    const next: Record<string, string> = {}
    fields.forEach((field) => {
      next[field.key] = formState[field.key] ?? ''
    })
    Object.keys(formState).forEach((key) => {
      if (!(key in next)) {
        delete formState[key]
      }
    })
    Object.assign(formState, next)
  },
  { immediate: true },
)

const themeClasses = computed(() => ({
  primary: props.theme === 'light' ? 'text-slate-700' : 'text-white',
  secondary: props.theme === 'light' ? 'text-slate-500' : 'text-white/70',
  muted: props.theme === 'light' ? 'text-slate-500' : 'text-white/60',
  label: props.theme === 'light' ? 'text-slate-600' : 'text-white/60',
  input:
    props.theme === 'light'
      ? 'border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-400/40'
      : 'border border-white/20 bg-white/5 text-white focus:ring-1 focus:ring-amber-400/60',
}))

const handleSubmit = () => {
  emits('submit', { ...formState })
}
</script>

<template>
  <div>
    <div class="space-y-2">
      <h2 class="text-3xl font-bold text-amber-500">Gana premios al instante</h2>
      <p class="text-sm text-slate-500">
        Ingresa tus datos para girar la ruleta y reclamar recompensas.
      </p>
    </div>
    <form @submit.prevent="handleSubmit" class="mt-6 space-y-4">
      <div
        v-if="props.loading"
        :class="[
          'rounded-2xl border p-4 text-sm',
          themeClasses.muted,
          props.theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5',
        ]"
      >
        Esperando la configuración de la campaña...
      </div>
      <div
        v-else-if="!props.fields.length"
        :class="[
          'rounded-2xl border p-4 text-sm',
          themeClasses.muted,
          props.theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5',
        ]"
      >
        El formulario aún no tiene campos configurados.
      </div>
      <div v-for="field in props.fields" :key="field.key" class="space-y-2">
        <label
          :class="['text-xs font-semibold uppercase tracking-[0.3em]', themeClasses.label]"
          :for="field.key"
        >
          {{ field.label }}
        </label>
        <template v-if="field.type.toLowerCase() === 'textarea'">
          <textarea
            :id="field.key"
            v-model="formState[field.key]"
            :placeholder="field.placeholder ?? ''"
            :required="field.required"
            :class="['h-28 w-full rounded-2xl px-4 py-3 text-sm outline-none transition', themeClasses.input]"
          ></textarea>
        </template>
        <template v-else>
          <input
            :id="field.key"
            v-model="formState[field.key]"
            :type="field.type.toLowerCase()"
            :placeholder="field.placeholder ?? ''"
            :required="field.required"
            :class="['w-full rounded-2xl px-4 py-3 text-sm outline-none transition', themeClasses.input]"
          />
        </template>
        <p v-if="field.helper" :class="['text-xs', themeClasses.secondary]">
          {{ field.helper }}
        </p>
      </div>
      <button
        type="submit"
        :class="[
          'w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
          'bg-amber-400 text-black hover:bg-amber-300',
        ]"
        :disabled="props.submitting || !props.fields.length"
      >
        {{ props.submitting ? 'Enviando...' : props.ctaLabel }}
      </button>
      <p v-if="props.message" :class="['text-xs', themeClasses.muted]">
        {{ props.message }}
      </p>
      <p v-else :class="['text-xs', themeClasses.secondary]">
        El formulario aún está en modo de prueba hasta integrar el backend real.
      </p>
      <p class="mt-3 text-xs tracking-[0.3em]" :class="themeClasses.secondary">
        POWER BY RULETAXPRESS
      </p>
    </form>
  </div>
</template>
