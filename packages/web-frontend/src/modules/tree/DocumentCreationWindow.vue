<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits(['create'])

const inputRef = ref()
const isVisible = ref(false)
const text = ref('')

defineExpose({
  call: () => {
    isVisible.value = true
    inputRef.value.focus()
  },
  dismiss: () => {
    isVisible.value = false
    text.value = ''
  }
})
</script>

<template>
  <form @submit.prevent="emit('create', text)" class="wrapper" v-show="isVisible">
    <div class="input-wrapper">
      <input ref="inputRef" placeholder="Краткое описание мысли" v-model="text" class="input" type="text">
      <button type="submit" class="button">Создать</button>
    </div>
  </form>
</template>

<style lang="scss" scoped>
.wrapper {
  background-color: #ffffffc7;
  position: fixed;
  top: 0;
  left: 380px;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.input-wrapper {
  padding: 32px;
  background-color: #fff;
  display: flex;
  max-width: 480px;
  gap: 4px;
}

.input {
  display: flex;
  font-size: 32px;
  padding: 8px;
}

.button {
  font-size: 24px;
}
</style>