<script setup lang="ts">
import { ref } from 'vue';
import { useCommunicationClient } from '~/modules/canvas/api'
import TreeNode from './TreeNode.vue';

const { data: documents, rootDocuments, moveNode, createDocument } = useCommunicationClient();
const newDocTitle = ref('');

function addNewDocument() {
  createDocument(newDocTitle.value);
  newDocTitle.value = '';
}
</script>

<template>
  <div class="tree-container">
    <div class="controls">
      <input v-model="newDocTitle" placeholder="Название, описание" @keyup.enter="addNewDocument" />
      <button v-if="false" @click="addNewDocument" :disabled="!newDocTitle">Добавить</button>
    </div>
    <div v-if="documents?.length" class="tree-list">
      <TreeNode
        v-for="doc in rootDocuments"
        :key="doc.id"
        :doc="doc"
        :documents="documents"
        :move-node="moveNode"
        :level="0"
      />
    </div>
    <div v-else class="no-data">Нет документов</div>
  </div>
</template>

<style scoped>
.tree-container {
  padding: 8px 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
input {
  flex-grow: 1;
  padding: 8px 16px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 16px;
  color: #333;
}

button {
  padding: 6px 12px;
  background: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}
button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}
button:hover:not(:disabled) {
  background: #005ea2;
}
.tree-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.loading,
.no-data {
  text-align: center;
  color: #888;
  font-size: 12px;
}
</style>