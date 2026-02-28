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
import { Draft, SNS_LIST } from "../types";
import { updateDraft } from "../api/client";
import { shareToSns } from "../utils/share";

interface Props {
  draft: Draft;
  onDelete: (id: string) => void;
  onUpdate: (draft: Draft) => void;
}

export function DraftItem({ draft, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(draft.content);
  const [saving, setSaving] = useState(false);

  const snsInfo = SNS_LIST.find((s) => s.id === draft.target_sns) || SNS_LIST[0];

  const handleCopy = async () => {
    await Clipboard.setStringAsync(draft.content);
    Alert.alert("コピーしました", "クリップボードにコピーしました");
  };

  const handleShare = async () => {
    try {
      await shareToSns({ content: draft.content, targetSns: draft.target_sns });
    } catch (error) {
      console.error("Share failed:", error);
      Alert.alert("エラー", "シェアに失敗しました");
    }
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

  const getSourceIcon = () => {
    switch (draft.source_type) {
      case "image":
        return "📷";
      case "text":
        return "✏️";
      case "url":
        return "🔗";
      default:
        return "📷";
    }
  };

  return (
    <View style={styles.container}>
      {draft.image_url && (
        <Image source={{ uri: draft.image_url }} style={styles.image} />
      )}

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <View style={styles.snsBadge}>
            <Text style={styles.snsIcon}>{snsInfo.icon}</Text>
            <Text style={styles.snsName}>{snsInfo.name}</Text>
          </View>
          <Text style={styles.sourceIcon}>{getSourceIcon()}</Text>
        </View>

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

        {draft.source_url && (
          <Text style={styles.sourceUrl} numberOfLines={1}>
            {draft.source_url}
          </Text>
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
              <Pressable
                style={[styles.actionButton, styles.shareButton]}
                onPress={handleShare}
              >
                <Text style={styles.shareButtonText}>
                  {snsInfo.icon} シェア
                </Text>
              </Pressable>
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
    backgroundColor: "#1c1c1e",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#2c2c2e",
  },
  content: {
    padding: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  snsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c2c2e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  snsIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  snsName: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  sourceIcon: {
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#fff",
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#3a3a3c",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#2c2c2e",
  },
  sourceUrl: {
    fontSize: 12,
    color: "#0a84ff",
    marginTop: 8,
  },
  date: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 12,
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#2c2c2e",
  },
  actionText: {
    fontSize: 14,
    color: "#8e8e93",
  },
  deleteText: {
    color: "#ff453a",
  },
  shareButton: {
    backgroundColor: "#0a84ff",
  },
  shareButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#0a84ff",
  },
  saveButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
});
