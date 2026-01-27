import { CarportConfig, CustomPost } from '@/types/carport';

export const getStructuralPosts = (config: CarportConfig): CustomPost[] => {
  const { width, depth, storageRoom } = config;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const postOffset = 0.05;

  const posts: CustomPost[] = [];

  // Base Corner Posts (Always present)
  // 1. Front Left (Outer)
  posts.push({ id: 'static-fl', x: -halfWidth + postOffset, z: halfDepth - postOffset });
  
  // 2. Front Right (Outer)
  posts.push({ id: 'static-fr', x: halfWidth - postOffset, z: halfDepth - postOffset });
  
  // 3. Back Left (Outer)
  posts.push({ id: 'static-bl', x: -halfWidth + postOffset, z: -halfDepth + postOffset });
  
  // 4. Back Right (Outer)
  posts.push({ id: 'static-br', x: halfWidth - postOffset, z: -halfDepth + postOffset });

  // For depth 5m - 5.99m: Add 1 post per side (USER LEFT and USER RIGHT)
  // User perspective: standing at +X looking at -X
  if (depth >= 5 && depth < 6) {
    // USER LEFT side (+Z = System Front) - 1 post in the middle
    posts.push({ 
      id: 'static-lm1', 
      x: 0, 
      z: halfDepth - postOffset 
    });
    
    // USER RIGHT side (-Z = System Back) - 1 post in the middle
    posts.push({ 
      id: 'static-rm1', 
      x: 0, 
      z: -halfDepth + postOffset 
    });
  }

  // For depth >= 6m: Add 2 posts per side + 1 back post
  if (depth >= 6) {
    const thirdWidth = width / 3;
    
    // USER LEFT side (+Z = System Front) - 2 additional posts along X axis
    posts.push({ 
      id: 'static-lm1', 
      x: -halfWidth + thirdWidth + postOffset, 
      z: halfDepth - postOffset 
    });
    posts.push({ 
      id: 'static-lm2', 
      x: halfWidth - thirdWidth - postOffset, 
      z: halfDepth - postOffset 
    });
    
    // USER RIGHT side (-Z = System Back) - 2 additional posts along X axis
    posts.push({ 
      id: 'static-rm1', 
      x: -halfWidth + thirdWidth + postOffset, 
      z: -halfDepth + postOffset 
    });
    posts.push({ 
      id: 'static-rm2', 
      x: halfWidth - thirdWidth - postOffset, 
      z: -halfDepth + postOffset 
    });
    
    // USER BACK middle post (-X = System Left, center of depth)
    // Only add if no storage room is enabled (storage room replaces back wall)
    if (!storageRoom.enabled) {
      posts.push({ 
        id: 'static-back-mid', 
        x: -halfWidth + postOffset, 
        z: 0 
      });
    }
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
