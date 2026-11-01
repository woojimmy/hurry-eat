import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "sf-symbols-typescript";

import { colors } from "@/theme";

const ICONS = {
  back: { ios: "chevron.left", android: "arrow_back" },
  close: { ios: "xmark", android: "close" },
  settings: { ios: "gearshape", android: "settings" },
  add: { ios: "plus", android: "add" },
  drag: { ios: "line.3.horizontal", android: "drag_indicator" },
  chevron: { ios: "chevron.right", android: "chevron_right" },
  check: { ios: "checkmark", android: "check" },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 24, color = colors.ink }: { name: IconName; size?: number; color?: string }) {
  const { ios, android } = ICONS[name];
  return (
    <SymbolView
      name={{ ios: ios as SFSymbol, android, web: android }}
      size={size}
      tintColor={color}
      accessible={false}
    />
  );
}
