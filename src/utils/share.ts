import { Linking, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { TargetSns } from '../types';

interface ShareOptions {
  content: string;
  targetSns: TargetSns;
}

export async function shareToSns({ content, targetSns }: ShareOptions): Promise<void> {
  const encodedContent = encodeURIComponent(content);

  switch (targetSns) {
    case 'x': {
      // Try X app first, then Twitter app, then web
      const xUrl = `twitter://post?message=${encodedContent}`;
      const webUrl = `https://twitter.com/intent/tweet?text=${encodedContent}`;

      const canOpenX = await Linking.canOpenURL(xUrl);
      if (canOpenX) {
        await Linking.openURL(xUrl);
      } else {
        await Linking.openURL(webUrl);
      }
      break;
    }

    case 'instagram': {
      // Instagram doesn't support direct text sharing via URL
      // Copy to clipboard and open Instagram
      await Clipboard.setStringAsync(content);
      Alert.alert(
        'クリップボードにコピーしました',
        'Instagramが開きます。投稿作成画面でペーストしてください。',
        [
          {
            text: 'OK',
            onPress: async () => {
              const instagramUrl = 'instagram://';
              const canOpen = await Linking.canOpenURL(instagramUrl);
              if (canOpen) {
                await Linking.openURL(instagramUrl);
              } else {
                Alert.alert('エラー', 'Instagramアプリがインストールされていません');
              }
            },
          },
        ]
      );
      break;
    }

    case 'linkedin': {
      // LinkedIn share URL
      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=&summary=${encodedContent}`;
      await Linking.openURL(linkedinUrl);
      break;
    }

    case 'bluesky': {
      // Bluesky web compose URL
      const blueskyUrl = `https://bsky.app/intent/compose?text=${encodedContent}`;
      await Linking.openURL(blueskyUrl);
      break;
    }
  }
}

export function getSnsAppName(targetSns: TargetSns): string {
  switch (targetSns) {
    case 'x':
      return 'X';
    case 'instagram':
      return 'Instagram';
    case 'linkedin':
      return 'LinkedIn';
    case 'bluesky':
      return 'Bluesky';
  }
}
