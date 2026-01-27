export type RoofType = 'metal' | 'glass' | 'polycarbonate';
export type PanelType = 'slats' | 'solid' | 'none';

export interface PanelConfig {
  type: PanelType;
  features: PanelFeature[];
}

export interface StorageRoomConfig {
  enabled: boolean;
  position: 'back' | 'left' | 'right';
  depth: number;
}

export interface GutterConfig {
  enabled: boolean;
  side: 'front' | 'back';
  drain: 'left' | 'right';
}

// Custom placed elements
export interface CustomPost {
  id: string;
  x: number;
  z: number;
}

export interface PanelFeature {
  id: string;
  type: 'window' | 'door';
  x: number; // Position offset from center
}

export interface CustomPanel {
  id: string;
  startPostId: string;  // Reference to first post
  endPostId: string;    // Reference to second post
  type: 'slats' | 'solid';
  features: PanelFeature[];
}

export interface CarportConfig {
  // Dimensions in meters
  width: number;
  depth: number;
  height: number;
  
  // Color (hex)
  color: string;
  
  // Roof
  roofType: RoofType;
  
  // Side panels
  panels: {
    left: PanelConfig;
    right: PanelConfig;
    back: PanelConfig;
  };
  
  // Storage room at the back
  storageRoom: StorageRoomConfig;
  
  // Gutter
  gutter: GutterConfig;
  
  // Custom placed elements (drag & drop)
  customPosts: CustomPost[];
  customPanels: CustomPanel[];
}

// Available colors (RAL colors) - lightened for better visibility
export const AVAILABLE_COLORS = [
  { name: 'Antracyt', hex: '#6A7578', ral: '7016' },
  { name: 'Czarny', hex: '#5A5A5A', ral: '9005' },
  { name: 'Szary', hex: '#7C7F7E', ral: '7037' },
  { name: 'Brązowy', hex: '#5A3D31', ral: '8028' },
  { name: 'Biały', hex: '#FFFFFF', ral: '9016' },
] as const;

// Draggable element types
export type DraggableElementType = 'post' | 'panel-slats' | 'panel-solid' | 'feature-window' | 'feature-door';

// Default configuration
export const DEFAULT_CONFIG: CarportConfig = {
  width: 4,
  depth: 6,
  height: 2.5,
  color: '#7C7F7E', // Szary
  roofType: 'metal',
  panels: {
    left: { type: 'none', features: [] },
    right: { type: 'none', features: [] },
    back: { type: 'none', features: [] },
  },
  storageRoom: {
    enabled: false,
    position: 'back',
    depth: 1.5,
  },
  gutter: {
    enabled: true,
    side: 'back',
    drain: 'right',
  },
  customPosts: [],
  customPanels: [],
};
