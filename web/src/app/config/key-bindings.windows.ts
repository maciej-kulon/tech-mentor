export const WindowsKeyBindings = {
  multiSelect: 'Control', // Ctrl key
  // Add other key bindings here as needed
} as const;

export type KeyBindingsConfig = typeof WindowsKeyBindings;
