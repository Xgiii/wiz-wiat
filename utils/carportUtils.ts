import { CarportConfig, CustomPost } from '@/types/carport';

export const getStructuralPosts = (config: CarportConfig): CustomPost[] => {
  const { width, depth, storageRoom } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const postOffset = 0.05;

  const posts: CustomPost[] = [];

  // Base Corner Posts (Always present, but their positions might shift if they become inner posts?)
  // Actually, let's define them based on the bounding box of the whole carport first.
  
  // 1. Front Left (Outer)
  posts.push({ id: 'static-fl', x: -halfWidth + postOffset, z: halfDepth - postOffset });
  
  // 2. Front Right (Outer)
  posts.push({ id: 'static-fr', x: halfWidth - postOffset, z: halfDepth - postOffset });
  
  // 3. Back Left (Outer)
  posts.push({ id: 'static-bl', x: -halfWidth + postOffset, z: -halfDepth + postOffset });
  
  // 4. Back Right (Outer)
  posts.push({ id: 'static-br', x: halfWidth - postOffset, z: -halfDepth + postOffset });

  // Add middle posts for wider carports (width >= 5m)
  if (width >= 5) {
    // Front Middle post
    posts.push({ id: 'static-fm', x: 0, z: halfDepth - postOffset });
    // Back Middle post
    posts.push({ id: 'static-bm', x: 0, z: -halfDepth + postOffset });
  }

  if (!storageRoom.enabled) {
     return posts;
  }

  // Handle Storage Room Posts modifications/additions
  const { position, depth: storeSize } = storageRoom;

  if (position === 'back') {
    // User 'Back' -> System 'Left' (-X)
    // Spans full Z-depth ? Or Main Depth? usually full depth.
    // Outer Wall: static-bl to static-fl (System Left side).
    // Inner Wall: shifted right by storeSize.
    
    // Add inner posts (shifted right from left edge)
    posts.push({ 
      id: 'static-store-fl', 
      x: -halfWidth + storeSize + postOffset, 
      z: halfDepth - postOffset 
    });
    posts.push({ 
      id: 'static-store-bl', 
      x: -halfWidth + storeSize + postOffset, 
      z: -halfDepth + postOffset 
    });

  } else if (position === 'left') {
    // User 'Left' -> System 'Front' (+Z) because Entry is +X (Right). 
    // Standing at +X facing -X: Left is +Z.
    // So 'System Front' storage.
    // Existing FL/FR become Outer corners.
    // Need Inner posts shifted back (negative Z direction) by storeSize.
    
    // Modify main FL/FR to be inner? Or add new inner?
    // Let's add inner posts.
    posts.push({ 
      id: 'static-store-fl', 
      x: -halfWidth + postOffset, 
      z: halfDepth - storeSize - postOffset 
    });
    posts.push({ 
      id: 'static-store-fr', 
      x: halfWidth - postOffset, 
      z: halfDepth - storeSize - postOffset 
    });

  } else if (position === 'right') {
     // User 'Right' -> System 'Back' (-Z) because Entry is +X (Right).
     // Standing at +X facing -X: Right is -Z.
     // So 'System Back' storage (Classic back).
     
     // Update main BL/BR to be inner posts? Or just add inner?
     // Let's add inner posts (Front of storage).
     posts.push({ 
      id: 'static-store-bl', // Inner-left (back)
      x: -halfWidth + postOffset, 
      z: -halfDepth + storeSize + postOffset 
    });
    posts.push({ 
      id: 'static-store-br', // Inner-right (back)
      x: halfWidth - postOffset, 
      z: -halfDepth + storeSize + postOffset 
    });
  }

  return posts;
};
