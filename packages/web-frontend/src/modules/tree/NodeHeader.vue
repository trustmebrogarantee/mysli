<template>
  <div
    class="node-header"
    :class="{ 'drop-target': isDropTarget, 'invalid-drop-target': isInvalidDrop }"
    @dragover.prevent="handleDragOver"
    @drop="handleDrop(doc.id, $event)"
  >
    <span
      class="node-title"
      :draggable="!doc.isRoot"
      @dragstart="handleDragStart(doc.id, $event)"
      @dragend="handleDragEnd"
    >
      {{ doc.title }}
    </span>
    <span v-if="doc.content?.length" class="chevron" @click="$emit('toggle')">
      <svg :class="{ expanded: isExpanded }" width="10" height="10" viewBox="0 0 10 10">
        <path d="M2 2 L5 5 L8 2" stroke="#666" stroke-width="1.5" fill="none" />
      </svg>
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Mysli } from '~/types/Mysli';

const props = defineProps<{
  doc: Mysli.Renderable;
  documents: Mysli.Renderable[];
  moveNode: (nodeId: string, newParentId: string | null) => Promise<Mysli.ServerDataContract>;
  isExpanded: boolean;
}>();

defineEmits<{
  (e: 'toggle'): void;
}>();

const isDropTarget = ref(false);
const isInvalidDrop = ref(false);
const isDragging = ref(false);

function handleDragStart(id: string, event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  }
  isDragging.value = true;
  console.log(`Drag started: ${id}`);
}

function handleDragEnd() {
  isDragging.value = false;
  isDropTarget.value = false;
  isInvalidDrop.value = false;
  console.log('Drag ended');
}

function handleDragOver(event: DragEvent) {
  if (event.dataTransfer && event.dataTransfer.types.includes('text/plain')) {
    const draggedId = event.dataTransfer.getData('text/plain');
    if (draggedId !== props.doc.id) {
      isDropTarget.value = true;
      isInvalidDrop.value = isAncestor(draggedId, props.doc.id);
      event.preventDefault();
      console.log(`Drag over: ${props.doc.id}, draggedId: ${draggedId}, invalid: ${isInvalidDrop.value}`);
    }
  }
}

function isAncestor(nodeId: string, potentialAncestorId: string): boolean {
  let current: Mysli.Renderable | undefined = props.documents.find((d) => d.id === potentialAncestorId);
  while (current?.parentId) {
    if (current.parentId === nodeId) return true;
    current = props.documents.find((d) => d.id === current?.parentId);
  }
  return false;
}


async function handleDrop(newParentId: string, event: DragEvent) {
  event.preventDefault();
  const draggedId = event.dataTransfer?.getData('text/plain') || null;
  console.log(`Drop on: ${newParentId}, draggedId: ${draggedId}`);

  if (draggedId && draggedId !== newParentId) {
    // const draggedDoc = props.documents.find((d) => d.id === draggedId);
    // const newParentDoc = props.documents.find((d) => d.id === newParentId);
    if (isAncestor(draggedId, newParentId)) {
    } else {
      const success = await props.moveNode(draggedId, newParentId);
      if (!success) {
        alert('Перемещение невозможно: ошибка сервера или циклическая зависимость.');
      } else {
        console.log('Перемещение отменено');
      }
    }
  }
  isDropTarget.value = false;
  isInvalidDrop.value = false;
}
</script>

<style scoped>
.node-header {
  display: flex;
  align-items: center;
  padding: 4px 16px;
  border-radius: 4px;
}
.node-header:hover {
  background: #f5f5f5;
}
.node-title {
  flex-grow: 1;
  font-size: 16px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(420px - 40px - 16px);
  cursor: default;
}
.node-title[draggable="true"] {
  cursor: move;
}
.chevron {
  width: 16px;
  height: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}
.chevron svg {
  transition: transform 0.2s;
}
.chevron svg.expanded {
  transform: rotate(90deg);
}
.drop-target {
  background: #e6f0fa;
  border: 1px dashed #0078d4;
}
.invalid-drop-target {
  border: 1px dashed #ff4444;
}
</style>