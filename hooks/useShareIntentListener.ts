// hooks/useShareIntentListener.ts
import { useEffect, useRef } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useShareIntent } from "expo-share-intent";

import { stagingService } from "@/services/api/stagingService";
import { useUserStore } from "@/stores/userProfileStore";

export function useShareIntentListener() {
  const router = useRouter();
  const processingRef = useRef(false);
  const lastProcessedTextRef = useRef<string | null>(null);

  const { hasShareIntent, shareIntent, resetShareIntent, error: shareIntentError } =
    useShareIntent({
      debug: false,
      resetOnBackground: true,
    });

  const handleIncomingText = async (rawText: string) => {
    if (!rawText || !rawText.trim()) return;
    if (processingRef.current || lastProcessedTextRef.current === rawText.trim()) {
      return;
    }

    try {
      processingRef.current = true;
      lastProcessedTextRef.current = rawText.trim();

      Toast.show({
        type: "info",
        text1: "Staging Workout",
        text2: "Parsing shared notes with AI...",
        visibilityTime: 4000,
      });

      const userProfile = useUserStore.getState().userProfile;
      const isImperial = userProfile?.is_imperial ?? false;

      const staged = await stagingService.stageWorkout({
        raw_text: rawText.trim(),
        reference_timestamp: new Date().toISOString(),
        is_imperial: isImperial,
      });

      Toast.show({
        type: "success",
        text1: "Workout Parsed",
        text2: `Reviewing: ${staged.parsed_workout?.name || "Staged Workout"}`,
      });

      router.push({
        pathname: "/stage-review" as any,
        params: {
          stagedId: staged.id,
        },
      });
    } catch (err: any) {
      console.error("[useShareIntentListener] Failed to stage workout:", err);
      Toast.show({
        type: "error",
        text1: "Staging Failed",
        text2: err?.message || "Could not parse shared workout notes.",
      });
    } finally {
      processingRef.current = false;
    }
  };

  // 1. Native iOS Share Sheet from Apple Notes / System share
  useEffect(() => {
    if (hasShareIntent && (shareIntent.text || shareIntent.webUrl)) {
      const content = shareIntent.text || shareIntent.webUrl || "";
      console.log(
        "[useShareIntentListener] Received share intent:",
        content.slice(0, 50)
      );
      handleIncomingText(content);
      resetShareIntent();
    }
  }, [hasShareIntent, shareIntent]);

  // 2. Direct deep links (e.g. volc://stage?text=... or iOS Shortcuts)
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      try {
        const urlStr = event.url;
        // Ignore dataUrl= links because they are handled by useShareIntent
        // Ignore /stage or volc://stage because app/stage.tsx handles them directly
        if (!urlStr || urlStr.includes("dataUrl=") || urlStr.includes("/stage") || urlStr.includes("volc://stage")) return;

        const parsedUrl = new URL(urlStr);
        const textParam =
          parsedUrl.searchParams.get("text") || parsedUrl.searchParams.get("notes");
        if (textParam) {
          handleIncomingText(decodeURIComponent(textParam));
        }
      } catch (e) {
        const match = event.url.match(/[?&](?:text|notes)=([^&]+)/);
        if (match && match[1]) {
          handleIncomingText(decodeURIComponent(match[1]));
        }
      }
    };

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl && !initialUrl.includes("dataUrl=")) {
        handleUrl({ url: initialUrl });
      }
    });

    const subscription = Linking.addEventListener("url", handleUrl);
    return () => {
      subscription.remove();
    };
  }, []);
}
