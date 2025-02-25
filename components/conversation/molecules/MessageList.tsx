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
import LoaderItem from "./LoaderItem";
import { ScrollToBottomButton } from "../atoms/ScrollToBottom";
import { MessageListProps } from "@/types/chat";
import { useMessage } from "@/context/MessageContext";

const MessageList: React.FC<MessageListProps> = ({ messages, streamingMessage, style }) => {
  const { 
    listRef, 
    handleScroll, 
    showScrollButton,
    scrollToBottom 
  } = useAutoScroll(streamingMessage);

  const {showLoader} = useMessage()

  const allMessages = streamingMessage
  ? [...messages, streamingMessage]
  : messages;


  const renderItem = useCallback(({ item, index }: { item: Message, index: number }) => {

    const previousMessage = index > 0 ? allMessages[index - 1] : undefined;

    console.log('Rendering message:', {
      id: item.id,
      isStreaming: streamingMessage?.id === item.id
    });
    
    return (
      <MessageItem 
        message={item} 
        isStreaming={streamingMessage?.id === item.id}
        previousMessage={previousMessage}
      />
    );
  }, [allMessages, streamingMessage]);

  const renderFooter = useCallback(() => {
    if (showLoader) {
      console.log('🔄 Rendering LoaderItem');
      return <LoaderItem />;
    }
    return null;
  }, [showLoader]);

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={listRef}
        data={allMessages}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
});

export default MessageList;