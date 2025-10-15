<template>
  <dialog
    ref="dialogRef"
    class="dialog-view"
    v-bind="$attrs"
    @close="handleDialogClose"
  >
    <div v-if="showTitleBar" class="dialog-title-bar">
      <span class="dialog-title">
        <slot name="title"></slot>
      </span>
      <a
        v-if="showCloseButton"
        href="javascript:void(0)"
        role="button"
        aria-label="Close the dialog"
        class="dialog-close-button"
        @click.prevent="closeDialog"
      >×</a>
    </div>
    <div class="dialog-content">
      <slot></slot>
    </div>
  </dialog>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  showTitleBar: {
    type: Boolean,
    default: true
  },
  showCloseButton: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Refs
const dialogRef = ref(null)

// Methods
const openDialog = () => {
  if (dialogRef.value && !dialogRef.value.open) {
    dialogRef.value.showModal()
  }
}

const closeDialog = () => {
  if (dialogRef.value && dialogRef.value.open) {
    dialogRef.value.close()
  }
}

const handleDialogClose = () => {
  if (props.modelValue) {
    emit('update:modelValue', false)
  }
}

// Watch for modelValue changes
watch(() => props.modelValue, async (newValue) => {
  await nextTick() // Wait for DOM update
  
  if (newValue) {
    // If new value is true, open dialog if not already open
    if (dialogRef.value && !dialogRef.value.open) {
      dialogRef.value.showModal()
    }
  } else {
    // If new value is false, close dialog if open
    if (dialogRef.value && dialogRef.value.open) {
      dialogRef.value.close()
    }
  }
})

// Expose methods if needed
defineExpose({
  open: openDialog,
  close: closeDialog,
})
</script>

<style scoped>
.dialog-view {
  padding: 20px;
  border-radius: 5px;
  border: 1px solid gray;
  outline: 0 !important;
}

.dialog-view[open] {
  display: flex;
  flex-direction: column;
  position: fixed;
  margin: auto;
  max-width: 90vw;
  max-height: 90vh;
}

.dialog-view::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.dialog-title-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 0.5em;
  min-height: 24px;
}

.dialog-title {
  flex: 1;
  text-align: center;
  font-weight: bold;
  font-size: 1.1em;
}

.dialog-close-button {
  margin-left: 0.5em;
  text-decoration: none;
  color: #666;
  font-size: 1.5em;
  line-height: 1;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  background: none;
}

.dialog-close-button:hover {
  color: #333;
  background-color: #f0f0f0;
  border-radius: 3px;
}

.dialog-content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>