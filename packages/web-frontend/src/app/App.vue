<script setup lang="ts">
// @ts-nocheck
import { useTemplateRef, onMounted, ref } from 'vue';

import DashboardAroundCanvas from '~/modules/tree/DashboardAroundCanvas.vue';
import DocumentTree from '~/modules/tree/DocumentTree.vue';
import DocumentCreationWindow from '~/modules/tree/DocumentCreationWindow.vue';
import LoaderBase from '~/modules/tree/LoaderBase.vue';

import { thoughtApi } from '~/modules/canvas/api'
import type { Mysli } from '~/types/Mysli';

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas-ref');
const creationWindow = ref()
const isAwaited = ref(false);

const thoughtApplication = thoughtApi()

let activeRenderable: Mysli.Renderable | null = null
thoughtApplication.on('document:creationstart', (renderable) => {
  activeRenderable = renderable as Mysli.Renderable;
  creationWindow.value.call()
})
const createDocument = (text: string) => {
  if (text.trim().length > 0) {
    thoughtApplication.commit('document:creationend', text, activeRenderable)
    creationWindow.value.dismiss();
  }
}

onMounted(() => {
  setTimeout(() => {
    thoughtApplication.loadCanvasApplication(canvasRef as Ref<HTMLCanvasElement>);
    isAwaited.value = true;
  }, 2000);
});

</script>

<template>
  <DocumentCreationWindow ref="creationWindow" @create="createDocument" />
  <DashboardAroundCanvas>
    <template #sidebar>
      <DocumentTree />
    </template>
    <template #main>
      <main class="canvas-container">
        <LoaderBase v-show="!isAwaited" class="loader1" />
        <canvas v-show="isAwaited" ref="canvas-ref" />
      </main>
    </template>
  </DashboardAroundCanvas>
</template>

<style lang="scss" scoped>
.canvas-container {
  background-color: #f5f5f5;
  position: relative;
  overflow: hidden;
  display: flex;
  height: 100%;
  flex-grow: 1;
  flex-shrink: 1;
}

.loader1 {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>