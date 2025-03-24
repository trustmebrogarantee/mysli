// @ts-nocheck
import EventEmitter from "eventemitter3";
import type { Mysli } from "~/types/Mysli";
import { renderable } from "./renderable";
import { createSharedComposable } from "@vueuse/core";
import { document } from "./document";
import * as R from 'ramda'
import { computed, watch, ref } from "vue";
import axios from "axios";

type ServerDataContract = { data: Mysli.Document | null, error: Error | null }
type DocumentResponse = { success: boolean, document: Mysli.Document  }

export const useCommunicationClient = createSharedComposable(() => {
  const events = new EventEmitter<{ 
    'node:moved': (args: { nodeId: string, newParentId: string | null }) => void,
    'document:created': (document: Mysli.Document) => void 
  }>();

  const data: Ref<Mysli.Renderable[]> = ref([])
  const nonReactiveData: Mysli.Renderable[] = []

  const refresh = async () => {
    const response: Mysli.Document[] = await axios.get('/api/documents');
    data.value = response.data.map(renderable.fromDocument)
  }
  refresh()
  
  
  const appendToData = (renderable: Mysli.Renderable) => {
    data.value = [...data.value, renderable]
  }

  watch(data, newData => {
    nonReactiveData.splice(0, nonReactiveData.length)
    for (const renderable of newData) {
      if (renderable.isRoot) continue;
      nonReactiveData.push(renderable);
    }
  })

  async function moveNode(nodeId: string, newParentId: string | null, { skipRefresh } = { skipRefresh: false }): Promise<ServerDataContract> {
    return axios.put('/api/relations', { nodeId, newParentId })
      .then(() => {
        events.emit('node:moved', { nodeId, newParentId })
        if (!skipRefresh) refresh()
        return { data: null, error: null }
      }).catch((error) => {
        console.error('Ошибка перемещения:', error);
        return { data: null, error }
      })
  }
  
  async function createDocument (title: string, parent?: Mysli.Renderable, { skipRefresh } = { skipRefresh: false }): Promise<ServerDataContract> {
    if (!title) return { data: null, error: new Error('Не предоставлен заголовок') }
    const doc = document.fromTitleAndParent(title, parent)
    return axios.post('/api/documents', R.omit(['id'], doc))
      .then((response: DocumentResponse) => {
        if (!skipRefresh) refresh()
        return { data: response.data.document, error: null }
      }).catch((error) => {
        console.error('Ошибка создания документа:', error);
        return { data: null, error }
      })
  }

  async function patchDocument(id: string, documentPatch: Partial<Mysli.Document>) {
    return axios.patch(`/api/documents/${id}`, documentPatch).then((response: DocumentResponse) => {
      return { data: response.data.document, error: null }
    }).catch((error) => {
      console.error('Ошибка изменения документа:', error);
      return { data: null, error }
    })
  }

  async function deleteDocument(renderable: Mysli.Renderable) {
    return axios.delete(`/api/documents/${renderable.id}`)
      .then(() => {
        if (renderable.parent?.content) {
          renderable.parent.content = renderable.parent.content.filter(r => r.id !== renderable.id)
        }
        data.value = data.value.filter(r => r.id !== renderable.id)
        return { data: null, error: null }
      }).catch((error) => {
        console.error('Ошибка удаления документа:', error);
        return { data: null, error }
      })
  }
  
  const rootDocuments = computed(() => data.value.filter((d) => !d.parentId));

  return {
    data,
    nonReactiveData,
    rootDocuments,
    moveNode,
    createDocument,
    patchDocument,
    deleteDocument,
    appendToData,
    refresh,
    events
  };
})