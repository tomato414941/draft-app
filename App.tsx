import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useShareIntent } from "expo-share-intent";
import { HomeScreen } from "./src/screens/HomeScreen";

export default function App() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <HomeScreen
        shareIntent={hasShareIntent ? shareIntent : null}
        onShareIntentProcessed={resetShareIntent}
      />
    </SafeAreaProvider>
  );
}
