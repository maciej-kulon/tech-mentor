export const MacOSKeyBindings = {
  multiSelect: "Meta", // Command key
  // Add other key bindings here as needed
} as const;

export type KeyBindingsConfig = typeof MacOSKeyBindings;
