import { useMessage } from "@/context/MessageContext";
import { ChatUIProps } from "@/types/chat";
import { useEffect } from "react";
import { View } from "react-native";
import Header from "../molecules/Header";
import InputArea from "../atoms/InputArea";
import MessageList from "../molecules/MessageList";
import { StyleSheet } from "react-native";


export const ChatUI: React.FC<ChatUIProps> = ({
  configName,
  title,
  subtitle,
  signalHandler
}) => {
  const { 
    messages, 
    streamingMessage, 
    registerMessageHandler,
    connect,
    connectionState
  } = useMessage();

  useEffect(() => {
    connect(configName);
  }, [connect, configName]);

  useEffect(() => {
    if (signalHandler) {
      registerMessageHandler(signalHandler);
      return () => registerMessageHandler(null);
    }
  }, [registerMessageHandler, signalHandler]);

  return (
    <View style={styles.container}>
      <Header title={title || ""} subtitle={subtitle ||""} />
      <MessageList 
        messages={messages}
        streamingMessage={streamingMessage}
      />
      <InputArea />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f281f',
    width: '100%',
  },
  headerContainer: {
    padding: 10,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  listContent: {
    flexGrow: 1,
    width: '100%',
    paddingBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    marginLeft: 8,
  },
  errorText: {
    color: '#ff6b6b',
  }
});

export default ChatUI;