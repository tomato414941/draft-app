import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { ShareIntent } from "expo-share-intent";
import { Draft, TargetSns } from "../types";
import {
  createDraftFromImage,
  createDraftFromText,
  createDraftFromUrl,
  deleteDraft,
  getDrafts,
} from "../api/client";
import { DraftItem } from "../components/DraftItem";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { SnsPicker } from "../components/SnsPicker";

interface Props {
  shareIntent: ShareIntent | null;
  onShareIntentProcessed: () => void;
}

type InputMode = "image" | "text" | "url";

export function HomeScreen({ shareIntent, onShareIntentProcessed }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [targetSns, setTargetSns] = useState<TargetSns>("x");
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const [textInput, setTextInput] = useState("");

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
    if (!shareIntent) {
      return;
    }
    if (processingRef.current) {
      return;
    }

    // Handle shared text (URL or plain text)
    if (shareIntent.text) {
      processingRef.current = true;
      const sharedText = shareIntent.text;
      const isUrl = /^https?:\/\//i.test(sharedText);

      (async () => {
        setGenerating(true);
        try {
          let newDraft: Draft;
          if (isUrl) {
            newDraft = await createDraftFromUrl({
              sourceUrl: sharedText,
              targetSns,
            });
          } else {
            newDraft = await createDraftFromText({
              sourceText: sharedText,
              targetSns,
            });
          }
          setDrafts((prev) => [newDraft, ...prev]);
        } catch (error) {
          console.error("Failed to generate draft from shared text:", error);
          Alert.alert("エラー", "投稿文の生成に失敗しました");
        } finally {
          setGenerating(false);
          processingRef.current = false;
          onShareIntentProcessed();
        }
      })();
      return;
    }

    // Handle shared files (images)
    if (!shareIntent.files || shareIntent.files.length === 0) {
      onShareIntentProcessed();
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
        const newDraft = await createDraftFromImage({
          imageUri: file.path,
          mimeType: file.mimeType,
          targetSns,
        });
        setDrafts((prev) => [newDraft, ...prev]);
      } catch (error) {
        console.error("Failed to generate draft from shared image:", error);
        Alert.alert("エラー", "投稿文の生成に失敗しました");
      } finally {
        setGenerating(false);
        processingRef.current = false;
        onShareIntentProcessed();
      }
    })();
  }, [shareIntent, onShareIntentProcessed, targetSns]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDrafts();
    setRefreshing(false);
  }, [fetchDrafts]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("エラー", "写真へのアクセス許可が必要です");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await generateDraftFromAsset(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("エラー", "カメラへのアクセス許可が必要です");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await generateDraftFromAsset(result.assets[0]);
    }
  };

  const generateDraftFromAsset = async (
    asset: ImagePicker.ImagePickerAsset
  ) => {
    setGenerating(true);
    try {
      const mimeType = asset.mimeType || "image/jpeg";
      const newDraft = await createDraftFromImage({
        imageUri: asset.uri,
        mimeType,
        targetSns,
      });
      setDrafts((prev) => [newDraft, ...prev]);
    } catch (error) {
      console.error("Failed to generate draft:", error);
      Alert.alert("エラー", "投稿文の生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  const generateFromTextInput = async () => {
    if (!textInput.trim()) {
      Alert.alert("エラー", "テキストを入力してください");
      return;
    }

    const isUrl = /^https?:\/\//i.test(textInput.trim());
    setGenerating(true);

    try {
      let newDraft: Draft;
      if (isUrl) {
        newDraft = await createDraftFromUrl({
          sourceUrl: textInput.trim(),
          targetSns,
        });
      } else {
        newDraft = await createDraftFromText({
          sourceText: textInput.trim(),
          targetSns,
        });
      }
      setDrafts((prev) => [newDraft, ...prev]);
      setTextInput("");
    } catch (error) {
      console.error("Failed to generate draft:", error);
      Alert.alert("エラー", "投稿文の生成に失敗しました");
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
      Alert.alert("エラー", "削除に失敗しました");
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
        <Text style={styles.subtitle}>あらゆるシェアをSNS投稿に変換</Text>
      </View>

      <SnsPicker selected={targetSns} onSelect={setTargetSns} />

      <View style={styles.inputModeContainer}>
        <Pressable
          style={[
            styles.modeButton,
            inputMode === "image" && styles.modeButtonActive,
          ]}
          onPress={() => setInputMode("image")}
        >
          <Text
            style={[
              styles.modeButtonText,
              inputMode === "image" && styles.modeButtonTextActive,
            ]}
          >
            📷 画像
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeButton,
            inputMode === "text" && styles.modeButtonActive,
          ]}
          onPress={() => setInputMode("text")}
        >
          <Text
            style={[
              styles.modeButtonText,
              inputMode === "text" && styles.modeButtonTextActive,
            ]}
          >
            ✏️ テキスト
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.modeButton,
            inputMode === "url" && styles.modeButtonActive,
          ]}
          onPress={() => setInputMode("url")}
        >
          <Text
            style={[
              styles.modeButtonText,
              inputMode === "url" && styles.modeButtonTextActive,
            ]}
          >
            🔗 URL
          </Text>
        </Pressable>
      </View>

      {inputMode === "image" ? (
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>ギャラリーから選択</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>写真を撮る</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={
              inputMode === "url"
                ? "URLを入力..."
                : "投稿したい内容を入力..."
            }
            placeholderTextColor="#999"
            value={textInput}
            onChangeText={setTextInput}
            multiline={inputMode === "text"}
            numberOfLines={inputMode === "text" ? 3 : 1}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={inputMode === "url" ? "url" : "default"}
          />
          <Pressable
            style={[
              styles.generateButton,
              !textInput.trim() && styles.generateButtonDisabled,
            ]}
            onPress={generateFromTextInput}
            disabled={!textInput.trim()}
          >
            <Text style={styles.generateButtonText}>生成</Text>
          </Pressable>
        </View>
      )}

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
              まだ下書きがありません{"\n"}写真・テキスト・URLから投稿文を生成しましょう
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
    backgroundColor: "#000",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#000",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#8e8e93",
    marginTop: 4,
  },
  inputModeContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#1c1c1e",
    borderRadius: 10,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: "#3a3a3c",
  },
  modeButtonText: {
    fontSize: 13,
    color: "#8e8e93",
  },
  modeButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: "#0a84ff",
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
  textInputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#fff",
    minHeight: 48,
    maxHeight: 100,
  },
  generateButton: {
    backgroundColor: "#0a84ff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  generateButtonDisabled: {
    backgroundColor: "#3a3a3c",
  },
  generateButtonText: {
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
    color: "#8e8e93",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
