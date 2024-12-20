import { useAutoScroll } from "@/hooks/useAutoScroll";
import { Message } from "@/types";
import { useCallback } from "react";
import { 
  StyleProp, 
  ViewStyle, 
  View, 
  FlatList, 
  StyleSheet } from "react-native";
import MessageItem from "../atoms/MessageItem";
import { ScrollToBottomButton } from "../atoms/ScrollToBottom";
import { MessageListProps } from "@/types/chat";

const MessageList: React.FC<MessageListProps> = ({ messages, streamingMessage, style }) => {
  const { 
    listRef, 
    handleScroll, 
    showScrollButton,
    scrollToBottom 
  } = useAutoScroll(streamingMessage);

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MessageItem message={item} />
  ), []);

  const allMessages = streamingMessage 
    ? [...messages, streamingMessage]
    : messages;

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={listRef}
        data={allMessages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        onContentSizeChange={() => scrollToBottom(false)}
        onLayout={() => scrollToBottom(false)}
        removeClippedSubviews={true}
      />
      {showScrollButton && (
        <ScrollToBottomButton onPress={() => scrollToBottom(true)} />
      )}
    </View>
  );
};
export default MessageList
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
});
