/**
 * Barrel export for the shared UI design system.
 *
 * Prefer the named re-exports over deep imports so rename / relocation
 * stays a single-file concern.
 *
 *   import { UiButton, UiModal, useToast } from '@/components/ui'
 */

// Primitives
export { default as UiButton } from './UiButton.vue'
export { default as UiBadge } from './UiBadge.vue'
export { default as UiSpinner } from './UiSpinner.vue'

// Form
export { default as UiFormField } from './UiFormField.vue'
export { default as UiInput } from './UiInput.vue'
export { default as UiTextarea } from './UiTextarea.vue'
export { default as UiSelect } from './UiSelect.vue'
export { default as UiCheckbox } from './UiCheckbox.vue'

// Overlays
export { default as UiModal } from './UiModal.vue'
export { default as UiDrawer } from './UiDrawer.vue'
export { default as UiConfirm } from './UiConfirm.vue'

// Data display
export { default as UiDataTable } from './UiDataTable.vue'
export { default as UiVirtualList } from './UiVirtualList.vue'
export { default as UiPagination } from './UiPagination.vue'
export { default as UiEmptyState } from './UiEmptyState.vue'

// Feedback
export { default as Toaster } from './Toaster.vue'
export { default as ErrorBoundary } from './ErrorBoundary.vue'
export { default as TypingDots } from './TypingDots.vue'
export { default as ThemeToggle } from './ThemeToggle.vue'

// Motion kit (existing)
export { default as Skeleton } from './Skeleton.vue'
export { default as CountUp } from './CountUp.vue'
export { default as ProgressBar } from './ProgressBar.vue'
export { default as GlassCard } from './GlassCard.vue'
export { default as PageTransition } from './PageTransition.vue'
export { default as AnimatedBlob } from './AnimatedBlob.vue'

// Composables + helpers
export { useToast } from '@/composables/useToast'
export { useFocusTrap } from '@/composables/useFocusTrap'
export { useScrollLock } from '@/composables/useScrollLock'
