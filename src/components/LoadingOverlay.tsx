import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface Props {
  message?: string;
}

export function LoadingOverlay({ message = "読み込み中..." }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    gap: 16,
  },
  message: {
    fontSize: 16,
    color: "#333",
  },
});
