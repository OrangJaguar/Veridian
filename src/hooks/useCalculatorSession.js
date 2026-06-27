import { create } from 'zustand';

export const useCalculatorSession = create((set) => ({
  viewport: null,
  selection: null,
  selectedExpressionId: null,
  trace: null,
  pinnedMarker: null,
  analysisMarkers: [],
  isPanning: false,
  keyboardVisible: false,
  editingId: null,
  tableHighlight: null,

  setViewport: (viewport) => set({ viewport }),
  setSelection: (selection) => set({ selection }),
  setSelectedExpressionId: (id) => set({ selectedExpressionId: id }),
  setTrace: (trace) => set({ trace }),
  setPinnedMarker: (pinnedMarker) => set({ pinnedMarker }),
  setAnalysisMarkers: (analysisMarkers) => set({ analysisMarkers }),
  setIsPanning: (isPanning) => set({ isPanning }),
  setKeyboardVisible: (keyboardVisible) => set({ keyboardVisible }),
  setEditingId: (editingId) => set({ editingId }),
  setTableHighlight: (tableHighlight) => set({ tableHighlight }),
  resetTransient: () => set({
    trace: null,
    pinnedMarker: null,
    isPanning: false,
    tableHighlight: null,
  }),
}));
