// components/chat/molecules/ChatInterface.tsx
import React from "react";
import { YStack } from "tamagui";
import { MessageList } from "../molecules/MessageList";
import { InputArea } from "../atoms/InputArea";
import { Message } from "@/types";

interface ChatInterfaceProps {
  messages?: Message[];
  streamingMessage?: any;
  isConnected?: boolean;
  onSend: (content: string) => void;
  placeholder?: string;
}

export const ChatInterface = ({
  messages = [],
  streamingMessage,
  isConnected = false,
  onSend,
  placeholder = "Type a message...",
}: ChatInterfaceProps) => {
  return (
    <YStack flex={1}>
      <MessageList messages={messages} streamingMessage={streamingMessage} />
      <InputArea placeholder={placeholder} onSendMessage={onSend} />
    </YStack>
  );
};
