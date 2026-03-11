import { Link, useLocation } from "wouter";
import { useConversations, useDeleteConversation } from "@/hooks/use-conversations";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, LogOut, Settings, Trash2, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export function Sidebar() {
  const [location] = useLocation();
  const { data: conversations, isLoading } = useConversations();
  const { user, logout } = useAuth();
  const deleteConversation = useDeleteConversation();
  const { toast } = useToast();

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteConversation.mutateAsync(id);
      toast({ title: "Conversation deleted" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete conversation", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="flex h-screen w-72 flex-col border-r bg-card/50 backdrop-blur-sm">
      <div className="p-6">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent text-white shadow-lg shadow-primary/20 transition-all group-hover:scale-105 group-hover:shadow-primary/30">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
                Character
              </h1>
              <p className="text-xs font-medium text-muted-foreground">AI Coach</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="px-4 py-2">
        <Link href="/dashboard">
          <Button 
            variant="gradient" 
            className="w-full justify-start gap-2 text-base font-medium"
          >
            <Home className="h-5 w-5" />
            Dashboard
          </Button>
        </Link>
      </div>

      <div className="mt-4 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        Conversations
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : conversations?.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center">
            <MessageSquarePlus className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <Link href="/dashboard" className="mt-2 text-xs font-medium text-primary hover:underline">
              Start a new chat
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations?.map((chat) => (
              <Link key={chat.id} href={`/chat/${chat.id}`}>
                <div 
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-muted/60",
                    location === `/chat/${chat.id}` ? "bg-muted ring-1 ring-border" : "transparent"
                  )}
                >
                  <Avatar className="h-9 w-9 border border-border shadow-sm">
                    <AvatarImage src={chat.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {chat.characterName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-foreground">
                      {chat.characterName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {chat.title}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => handleDelete(e, chat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-4 space-y-2">
        <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
          <Avatar className="h-10 w-10 border border-border">
            {user?.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.firstName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => logout()}>
            <LogOut className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
