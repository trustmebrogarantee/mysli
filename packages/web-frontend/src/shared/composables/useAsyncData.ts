import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';

// Define the return type of useAsyncData
interface AsyncData<T> {
  data: Ref<T | null>;
  pending: Ref<boolean>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
  status: ComputedRef<'idle' | 'pending' | 'success' | 'error'>;
}

// Define the options for useAsyncData
interface UseAsyncDataOptions<T> {
  lazy?: boolean;
  default?: () => T;
  transform?: (data: T) => T;
  watch?: Ref<any>[];
}

export function useAsyncData<T>(
  _key: string,
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions<Awaited<T>> = {}
): AsyncData<Awaited<T>> {
  // Extract options with defaults
  const { lazy = false, default: defaultData, transform, watch: watchDeps } = options;

  // Resolve the type of T to Awaited<T> for the data
  type ResolvedT = Awaited<T>;

  // Reactive state
  // Explicitly type the ref to avoid UnwrapRef issues
  
  const data = ref<ResolvedT | null>(defaultData !== undefined ? defaultData() : null) as Ref<ResolvedT | null>;
  const error = ref<Error | null>(null);
  const pending = ref(false);

  // Compute status based on current state
  const status = computed(() => {
    if (pending.value) return 'pending';
    if (error.value) return 'error';
    if (data.value !== null) return 'success';
    return 'idle';
  });

  // Fetch logic
  const execute = async () => {
    pending.value = true;
    error.value = null;

    try {
      const result = await fetcher();
      if (transform) {
        data.value = transform(result);
      } else {
        data.value = result;
      }
    } catch (err) {
      error.value = err as Error;
    } finally {
      pending.value = false;
    }
  };

  // Execute fetch immediately if not lazy
  if (!lazy) {
    execute();
  }

  // Watch dependencies for auto-refetch
  if (watchDeps) {
    watchDeps.forEach((dep) => {
      watch(dep, () => {
        execute();
      }, { deep: true });
    });
  }

  // Return the reactive data and utilities
  return {
    data,
    pending,
    error,
    refresh: execute,
    status,
  };
}