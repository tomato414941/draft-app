import { useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Draft } from "../types";
import { updateDraft } from "../api/client";

interface Props {
  draft: Draft;
  onDelete: (id: string) => void;
  onUpdate: (draft: Draft) => void;
}

export function DraftItem({ draft, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(draft.content);
  const [saving, setSaving] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(draft.content);
    Alert.alert("コピーしました", "クリップボードにコピーしました");
  };

  const handleSave = async () => {
    if (content === draft.content) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateDraft(draft.id, content);
      onUpdate(updated);
      setEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
      Alert.alert("エラー", "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("削除確認", "この下書きを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => onDelete(draft.id) },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: draft.image_url }} style={styles.image} />

      <View style={styles.content}>
        {editing ? (
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            multiline
            autoFocus
          />
        ) : (
          <Text style={styles.text}>{draft.content}</Text>
        )}

        <Text style={styles.date}>{formatDate(draft.created_at)}</Text>

        <View style={styles.actions}>
          {editing ? (
            <>
              <Pressable
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "保存中..." : "保存"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  setContent(draft.content);
                  setEditing(false);
                }}
              >
                <Text style={styles.actionText}>キャンセル</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.actionButton} onPress={handleCopy}>
                <Text style={styles.actionText}>コピー</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => setEditing(true)}
              >
                <Text style={styles.actionText}>編集</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={handleDelete}>
                <Text style={[styles.actionText, styles.deleteText]}>削除</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
  },
  content: {
    padding: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 12,
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  actionText: {
    fontSize: 14,
    color: "#666",
  },
  deleteText: {
    color: "#ff3b30",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  saveButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
});
