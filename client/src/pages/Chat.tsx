import React, { useRef, useState, useEffect } from "react";
import { useParams } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { useConversation } from "@/hooks/use-conversations";
import { useMessages } from "@/hooks/use-messages";
import { useVoiceRecorder, useVoiceStream } from "@/replit_integrations/audio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, Send, Loader2, StopCircle, User, Bot, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const conversationId = parseInt(id!);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: conversation, isLoading: isLoadingConversation } = useConversation(conversationId);
  const { data: messages, isLoading: isLoadingMessages } = useMessages(conversationId);
  
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recorder = useVoiceRecorder();
  
  // Voice Stream Hook for handling audio responses
  const stream = useVoiceStream({
    onUserTranscript: (text) => {
      // Optimistic UI update or just rely on react-query refetch
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, conversationId] });
    },
    onTranscript: (text, full) => {
      // Handle streaming text updates here if we want real-time text appearance
      // For simplicity, we'll let react-query poll catch up or explicit invalidation
    },
    onComplete: (transcript) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, conversationId] });
    },
    onError: (err) => {
      toast({ 
        title: "Error", 
        description: "Voice chat failed. Please try again.", 
        variant: "destructive" 
      });
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, stream.playbackState]);

  const handleSendText = async () => {
    if (!inputText.trim()) return;

    // We use the voice stream endpoint even for text to get the TTS response!
    // But since the current hook is designed for audio-in, let's use the standard message create
    // endpoint for text-only, OR we could adapt the hook.
    // Let's use standard message creation for text input.
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputText }),
      });
      
      if (!res.ok) throw new Error("Failed to send");
      
      setInputText("");
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, conversationId] });
      
      // If we wanted TTS for text input, we'd need to handle that separately.
    } catch (error) {
      toast({ title: "Failed to send message", variant: "destructive" });
    }
  };

  const toggleRecording = async () => {
    if (recorder.state === "recording") {
      const blob = await recorder.stopRecording();
      // Use the voice-stream endpoint for STT -> GPT -> TTS pipeline
      await stream.streamVoiceResponse(`/api/conversations/${conversationId}/voice-stream`, blob);
    } else {
      await recorder.startRecording();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  if (isLoadingConversation) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversation) return <div>Conversation not found</div>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col h-full relative">
        {/* Chat Header */}
        <header className="flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border shadow-sm">
              <AvatarImage src={conversation.character?.avatarUrl || undefined} />
              <AvatarFallback>{conversation.character?.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-bold">{conversation.character?.name}</h2>
              <p className="text-xs text-muted-foreground line-clamp-1">{conversation.character?.description}</p>
            </div>
          </div>
          {stream.playbackState === "playing" && (
             <div className="flex items-center gap-2 text-xs font-medium text-primary animate-pulse px-3 py-1 bg-primary/10 rounded-full">
               <Volume2 className="h-3 w-3" /> Speaking...
             </div>
          )}
        </header>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-3xl space-y-6 pb-4">
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-full gap-3 animate-fade-in",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm">
                    <AvatarImage src={conversation.character?.avatarUrl || undefined} />
                    <AvatarFallback>{conversation.character?.name[0]}</AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "relative max-w-[80%] rounded-2xl px-5 py-3 shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-card border border-border rounded-tl-none font-serif text-[15px]"
                  )}
                >
                  <div className={cn("markdown-content", msg.role === "user" ? "text-primary-foreground" : "text-foreground")}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>

                {msg.role === "user" && (
                  <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-background">
          <div className="mx-auto max-w-3xl flex items-center gap-3 bg-card p-2 rounded-2xl shadow-lg border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Button
              variant={recorder.state === "recording" ? "destructive" : "ghost"}
              size="icon"
              className={cn(
                "h-10 w-10 rounded-xl transition-all", 
                recorder.state === "recording" && "animate-pulse shadow-md"
              )}
              onClick={toggleRecording}
            >
              {recorder.state === "recording" ? (
                <StopCircle className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
            
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message or press mic to speak..."
              className="border-0 bg-transparent focus-visible:ring-0 px-2 py-6 text-base shadow-none"
              disabled={recorder.state === "recording"}
            />
            
            <Button 
              size="icon" 
              onClick={handleSendText}
              disabled={!inputText.trim() || recorder.state === "recording"}
              className={cn("h-10 w-10 rounded-xl transition-all", inputText.trim() ? "opacity-100" : "opacity-50")}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
