import { BlackHanSans_400Regular } from "@expo-google-fonts/black-han-sans";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Snackbar } from "@/components/snackbar";
import { migrate } from "@/db/migrations";
import { StoreProvider } from "@/store/store";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ BlackHanSans_400Regular });

  // 폰트가 로드되면 StoreProvider가 DB를 불러온 뒤 스플래시를 내린다. 폰트 오류일 때만 여기서 내린다.
  useEffect(() => {
    if (error) SplashScreen.hideAsync();
  }, [error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="hurry-eat.db" onInit={migrate}>
        <StoreProvider>
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="camera" options={{ animation: "slide_from_bottom" }} />
            </Stack>
            <Snackbar />
          </View>
        </StoreProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
