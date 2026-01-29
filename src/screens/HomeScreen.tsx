import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { ShareIntent } from "expo-share-intent";
import { Draft } from "../types";
import { createDraft, deleteDraft, getDrafts } from "../api/client";
import { DraftItem } from "../components/DraftItem";
import { LoadingOverlay } from "../components/LoadingOverlay";

interface Props {
  shareIntent: ShareIntent | null;
  onShareIntentProcessed: () => void;
}

export function HomeScreen({ shareIntent, onShareIntentProcessed }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDrafts = useCallback(async () => {
    try {
      const data = await getDrafts();
      setDrafts(data);
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  // Handle share intent from other apps
  const processingRef = useRef(false);
  useEffect(() => {
    if (!shareIntent || !shareIntent.files || shareIntent.files.length === 0) {
      return;
    }
    if (processingRef.current) {
      return;
    }

    const file = shareIntent.files[0];
    if (!file.path || !file.mimeType.startsWith("image/")) {
      onShareIntentProcessed();
      return;
    }

    processingRef.current = true;
    (async () => {
      setGenerating(true);
      try {
        const newDraft = await createDraft(file.path, file.mimeType);
        setDrafts((prev) => [newDraft, ...prev]);
      } catch (error) {
        console.error("Failed to generate draft from shared image:", error);
        alert("投稿文の生成に失敗しました");
      } finally {
        setGenerating(false);
        processingRef.current = false;
        onShareIntentProcessed();
      }
    })();
  }, [shareIntent, onShareIntentProcessed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDrafts();
    setRefreshing(false);
  }, [fetchDrafts]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("写真へのアクセス許可が必要です");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await generateDraft(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      alert("カメラへのアクセス許可が必要です");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await generateDraft(result.assets[0]);
    }
  };

  const generateDraft = async (asset: ImagePicker.ImagePickerAsset) => {
    setGenerating(true);
    try {
      const mimeType = asset.mimeType || "image/jpeg";
      const newDraft = await createDraft(asset.uri, mimeType);
      setDrafts((prev) => [newDraft, ...prev]);
    } catch (error) {
      console.error("Failed to generate draft:", error);
      alert("投稿文の生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Failed to delete draft:", error);
      alert("削除に失敗しました");
    }
  };

  const handleUpdate = (updatedDraft: Draft) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === updatedDraft.id ? updatedDraft : d))
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Draft</Text>
        <Text style={styles.subtitle}>写真から投稿文を生成</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>📷 ギャラリーから選択</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>📸 写真を撮る</Text>
        </Pressable>
      </View>

      <FlatList
        data={drafts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DraftItem
            draft={item}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              まだ下書きがありません{"\n"}写真を選んで投稿文を生成しましょう
            </Text>
          </View>
        }
      />

      {generating && <LoadingOverlay message="投稿文を生成中..." />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
