import { useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/theme";

const THRESHOLD = 110;

/** 한 방향(왼쪽) 스와이프로 처리 (FR-09) */
export function SwipeRow({ children, onSwipe }: { children: ReactNode; onSwipe: () => void }) {
  const [x] = useState(() => new Animated.Value(0));
  // 제스처 핸들러는 한 번만 만들고, 밀어낸 횟수가 바뀌면 최신 onSwipe를 부른다.
  const [swipes, setSwipes] = useState(0);
  const fireSwipe = useEffectEvent(onSwipe);
  useEffect(() => {
    if (swipes > 0) fireSwipe();
  }, [swipes]);

  const [responder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => x.setValue(Math.min(0, g.dx)),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -THRESHOLD) {
          Animated.timing(x, { toValue: -500, duration: 160, useNativeDriver: true }).start(() => {
            setSwipes((n) => n + 1);
            x.setValue(0);
          });
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
    }),
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.behind}>
        <Text style={styles.behindText}>처리했어</Text>
      </View>
      <Animated.View
        {...responder.panHandlers}
        accessibilityActions={[{ name: "dispose", label: "처리했어" }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === "dispose" && onSwipe()}
        style={{ transform: [{ translateX: x }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 12, overflow: "hidden", backgroundColor: colors.ink },
  behind: {
    ...StyleSheet.absoluteFill,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 20,
  },
  behindText: { fontFamily: fonts.display, fontSize: 16, color: colors.brand },
});
