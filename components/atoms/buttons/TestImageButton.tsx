// In whatever component you want to test with
import { useImageUpload } from "@/hooks/useImageUpload";
import React from "react";
import { Button, View, Text, Image } from "tamagui";
const TestImageComponent = () => {
  const { imageUrl, loading, error, testKnownImage } = useImageUpload();

  return (
    <View style={{ padding: 20 }}>
      <Button onPress={testKnownImage} disabled={loading}>
        test images
      </Button>

      {loading && <Text>Loading image...</Text>}
      {error && <Text style={{ color: "red" }}>Error: {error}</Text>}
      {imageUrl && (
        <>
          <Text style={{ color: "green" }}>Success! Image URL: {imageUrl}</Text>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 200, height: 200, marginTop: 10 }}
          />
        </>
      )}
    </View>
  );
};
export default TestImageComponent;
