// stores/loadingStore.js
import { ref } from "vue";

const loadingStates = ref(new Map());

export const useLoadingStore = () => {
  const setLoading = (key, value) => {
    loadingStates.value.set(key, value);
  };

  const isLoading = (key) => {
    return loadingStates.value.get(key) || false;
  };

  const isAnyLoading = () => {
    return Array.from(loadingStates.value.values()).some((v) => v);
  };

  return {
    setLoading,
    isLoading,
    isAnyLoading,
  };
};
