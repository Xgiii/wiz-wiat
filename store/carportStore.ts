import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CarportConfig, CustomPanel, CustomPost, DEFAULT_CONFIG, PanelConfig, RoofType, StorageRoomConfig } from '@/types/carport';
import { getStructuralPosts } from '@/utils/carportUtils';

interface CarportStore {
  config: CarportConfig;
  isHydrated: boolean;
  setConfig: (config: CarportConfig) => void;
  setWidth: (width: number) => void;
  setDepth: (depth: number) => void;
  setHeight: (height: number) => void;
  setColor: (color: string) => void;
  setRoofType: (roofType: RoofType) => void;
  setPanel: (side: 'left' | 'right' | 'back', panel: PanelConfig) => void;
  setStorageRoom: (storageRoom: StorageRoomConfig) => void;
  setGutter: (gutter: import('@/types/carport').GutterConfig) => void;
  addCustomPost: (x: number, z: number) => string;
  updatePostPosition: (id: string, x: number, z: number) => void;
  removeCustomPost: (id: string) => void;
  addCustomPanel: (startPostId: string, endPostId: string, type?: 'slats' | 'solid') => void;
  removeCustomPanel: (id: string) => void;
  addPanelFeature: (panelId: string, type: 'window' | 'door', x: number) => void;
  updatePanelFeaturePosition: (panelId: string, featureId: string, x: number) => void;
  removePanelFeature: (panelId: string, featureId: string) => void;
  getPostById: (id: string) => CustomPost | undefined;
  resetConfig: () => void;
  setHydrated: (hydrated: boolean) => void;
}

let postIdCounter = 0;
let panelIdCounter = 0;
let featureIdCounter = 0;

export const useCarportStore = create<CarportStore>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      isHydrated: false,
  
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  
      setConfig: (config) => set({ config }),
  
  setWidth: (width) => set((state) => ({
    config: { ...state.config, width }
  })),
  
  setDepth: (depth) => set((state) => ({
    config: { ...state.config, depth }
  })),
  
  setHeight: (height) => set((state) => ({
    config: { ...state.config, height }
  })),
  
  setColor: (color) => set((state) => ({
    config: { ...state.config, color }
  })),
  
  setRoofType: (roofType) => set((state) => ({
    config: { ...state.config, roofType }
  })),
  
  setPanel: (side, panel) => set((state) => ({
    config: {
      ...state.config,
      panels: {
        ...state.config.panels,
        [side]: panel
      }
    }
  })),
  
  setStorageRoom: (storageRoom) => set((state) => {
    // Detect if enabled status or position changed
    const wasEnabled = state.config.storageRoom.enabled;
    const oldPosition = state.config.storageRoom.position;
    
    const isEnabled = storageRoom.enabled;
    const newPosition = storageRoom.position;
    
    let newCustomPanels = [...state.config.customPanels];
    const storagePanelIds = ['panel-store-back', 'panel-store-left', 'panel-store-right', 'panel-store-front', 'panel-store-outer', 'panel-store-inner'];

    // If disabled, remove all
    if (!isEnabled) {
       newCustomPanels = newCustomPanels.filter(p => !storagePanelIds.includes(p.id));
    } 
    // If enabled (either new or update)
    else {
      // Remove old ones first to be safe/clean
      newCustomPanels = newCustomPanels.filter(p => !storagePanelIds.includes(p.id));

      let storagePanels: CustomPanel[] = [];
      
      if (newPosition === 'back') {
        // User 'Back' -> System 'Left' (-X)
        storagePanels = [
          // Outer Wall (System Left): static-fl to static-bl
          { id: `panel-store-outer`, startPostId: 'static-fl', endPostId: 'static-bl', type: 'solid', features: [] },
          // Inner Wall (Partition): static-store-fl to static-store-bl
          { id: `panel-store-inner`, startPostId: 'static-store-fl', endPostId: 'static-store-bl', type: 'solid', features: [] },
          // Front End (System Front-Left): static-fl to static-store-fl
          { id: `panel-store-front`, startPostId: 'static-fl', endPostId: 'static-store-fl', type: 'solid', features: [] },
          // Back End (System Back-Left): static-bl to static-store-bl
          { id: `panel-store-back`, startPostId: 'static-bl', endPostId: 'static-store-bl', type: 'solid', features: [] }
        ];
      } else if (newPosition === 'left') {
        // User 'Left' -> System 'Front' (+Z)
        storagePanels = [
          // Outer Wall (System Front): static-fl to static-fr
          { id: `panel-store-outer`, startPostId: 'static-fl', endPostId: 'static-fr', type: 'solid', features: [] },
          // Inner Wall (Partition): static-store-fl to static-store-fr
          { id: `panel-store-inner`, startPostId: 'static-store-fl', endPostId: 'static-store-fr', type: 'solid', features: [] },
           // Left End: static-fl to static-store-fl
          { id: `panel-store-left`, startPostId: 'static-fl', endPostId: 'static-store-fl', type: 'solid', features: [] },
          // Right End: static-fr to static-store-fr
          { id: `panel-store-right`, startPostId: 'static-fr', endPostId: 'static-store-fr', type: 'solid', features: [] }
        ];
      } else if (newPosition === 'right') {
        // User 'Right' -> System 'Back' (-Z) implementation (Classic Back)
        storagePanels = [
           // Outer Wall (System Back): static-bl to static-br
          { id: `panel-store-outer`, startPostId: 'static-bl', endPostId: 'static-br', type: 'solid', features: [] },
          // Inner Wall (Partition): static-store-bl to static-store-br
          { id: `panel-store-inner`, startPostId: 'static-store-bl', endPostId: 'static-store-br', type: 'solid', features: [] },
          // Left End: static-bl to static-store-bl
          { id: `panel-store-left`, startPostId: 'static-bl', endPostId: 'static-store-bl', type: 'solid', features: [] },
          // Right End: static-br to static-store-br
          { id: `panel-store-right`, startPostId: 'static-br', endPostId: 'static-store-br', type: 'solid', features: [] }
        ];
      }

      newCustomPanels = [...newCustomPanels, ...storagePanels];
    }
    
    return {
      config: { 
        ...state.config, 
        storageRoom,
        customPanels: newCustomPanels
      }
    };
  }),

  setGutter: (gutter) => set((state) => ({
    config: { ...state.config, gutter }
  })),
  
  addCustomPost: (x, z) => {
    const id = `post-${++postIdCounter}`;
    set((state) => {
      const newPost: CustomPost = { id, x, z };
      return {
        config: {
          ...state.config,
          customPosts: [...state.config.customPosts, newPost]
        }
      };
    });
    return id;
  },
  
  updatePostPosition: (id, x, z) => set((state) => ({
    config: {
      ...state.config,
      customPosts: state.config.customPosts.map(post =>
        post.id === id ? { ...post, x, z } : post
      )
    }
  })),
  
  removeCustomPost: (id) => set((state) => ({
    config: {
      ...state.config,
      customPosts: state.config.customPosts.filter(p => p.id !== id),
      // Also remove any panels connected to this post
      customPanels: state.config.customPanels.filter(
        panel => panel.startPostId !== id && panel.endPostId !== id
      )
    }
  })),
  
  addCustomPanel: (startPostId, endPostId, type = 'slats') => set((state) => {
    // Check if panel already exists between these posts
    // We allow replacing existing panel if it's a different type? 
    // Or we should remove old one first. 
    // Let's remove any existing panel between these posts first to allow "replacing"
    const existingIndex = state.config.customPanels.findIndex(
      p => (p.startPostId === startPostId && p.endPostId === endPostId) ||
           (p.startPostId === endPostId && p.endPostId === startPostId)
    );
    
    const newPanel: CustomPanel = {
      id: `panel-${++panelIdCounter}`,
      startPostId,
      endPostId,
      type,
      features: []
    };
    
    let nextPanels = [...state.config.customPanels];
    if (existingIndex >= 0) {
      nextPanels[existingIndex] = newPanel; // Replace
    } else {
      nextPanels.push(newPanel); // Add
    }
    
    return {
      config: {
        ...state.config,
        customPanels: nextPanels
      }
    };
  }),
  
  removeCustomPanel: (id) => set((state) => ({
    config: {
      ...state.config,
      customPanels: state.config.customPanels.filter(p => p.id !== id)
    }
  })),

  addPanelFeature: (panelId, type, x) => set((state) => {
    // Check if it's a standard panel
    if (['left', 'right', 'back'].includes(panelId)) {
      const side = panelId as 'left' | 'right' | 'back';
      return {
        config: {
          ...state.config,
          panels: {
            ...state.config.panels,
            [side]: {
              ...state.config.panels[side],
              features: [...state.config.panels[side].features, { id: `feat-${++featureIdCounter}`, type, x }]
            }
          }
        }
      };
    }
    
    // Custom panel
    return {
      config: {
        ...state.config,
        customPanels: state.config.customPanels.map(p => 
          p.id === panelId ? {
            ...p,
            features: [...p.features, { id: `feat-${++featureIdCounter}`, type, x }]
          } : p
        )
      }
    };
  }),

  updatePanelFeaturePosition: (panelId, featureId, x) => set((state) => {
    // Check if it's a standard panel
    if (['left', 'right', 'back'].includes(panelId)) {
      const side = panelId as 'left' | 'right' | 'back';
      return {
        config: {
          ...state.config,
          panels: {
            ...state.config.panels,
            [side]: {
              ...state.config.panels[side],
              features: state.config.panels[side].features.map(f => f.id === featureId ? { ...f, x } : f)
            }
          }
        }
      };
    }
    
    // Custom panel
    return {
      config: {
        ...state.config,
        customPanels: state.config.customPanels.map(p => 
          p.id === panelId ? {
            ...p,
            features: p.features.map(f => f.id === featureId ? { ...f, x } : f)
          } : p
        )
      }
    };
  }),

  removePanelFeature: (panelId, featureId) => set((state) => {
    // Check if it's a standard panel
    if (['left', 'right', 'back'].includes(panelId)) {
      const side = panelId as 'left' | 'right' | 'back';
      return {
        config: {
          ...state.config,
          panels: {
            ...state.config.panels,
            [side]: {
              ...state.config.panels[side],
              features: state.config.panels[side].features.filter(f => f.id !== featureId)
            }
          }
        }
      };
    }
    
    // Custom panel
    return {
      config: {
        ...state.config,
        customPanels: state.config.customPanels.map(p => 
          p.id === panelId ? {
            ...p,
            features: p.features.filter(f => f.id !== featureId)
          } : p
        )
      }
    };
  }),
  
  getPostById: (id) => {
    const config = get().config;
    // Check custom posts first
    const custom = config.customPosts.find(p => p.id === id);
    if (custom) return custom;
    
    // Check structural posts
    const structural = getStructuralPosts(config).find(p => p.id === id);
    return structural;
  },
  
  resetConfig: () => set({ config: DEFAULT_CONFIG })
    }),
    {
      name: 'carport-config',
      partialize: (state) => ({ config: state.config }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
