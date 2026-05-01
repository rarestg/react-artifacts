export type KeyboardShortcutHint = {
  modifier: 'command' | 'control';
  key: string;
  text: string;
  label: string;
};

const applePlatformPattern = /Mac|iPhone|iPad|iPod/i;

export function getPlatformShortcutHint(key: string, platform = getCurrentPlatform()): KeyboardShortcutHint {
  return applePlatformPattern.test(platform)
    ? { modifier: 'command', key, text: `Command ${key}`, label: `Command ${key}` }
    : { modifier: 'control', key, text: `Ctrl ${key}`, label: `Control ${key}` };
}

function getCurrentPlatform() {
  return typeof navigator === 'undefined' ? '' : navigator.platform;
}
