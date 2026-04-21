<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useCountUp } from '@/composables/useCountUp'
import { useInView } from '@/composables/useInView'

interface Props {
  value: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  separator?: string
}
const props = withDefaults(defineProps<Props>(), {
  decimals: 0,
  duration: 1400,
  prefix: '',
  suffix: '',
  separator: ',',
})

const target = toRef(props, 'value')
const rootEl = ref<HTMLElement | null>(null)
const inView = useInView(rootEl)
const current = useCountUp(target, {
  duration: props.duration,
  decimals: props.decimals,
  trigger: inView,
})

function format(n: number) {
  const [int, dec] = n.toFixed(props.decimals).split('.')
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, props.separator)
  return dec ? `${withSep}.${dec}` : withSep
}

const formatted = computed(() => `${props.prefix}${format(current.value)}${props.suffix}`)
</script>

<template>
  <span ref="rootEl" class="tabular-nums">{{ formatted }}</span>
</template>
