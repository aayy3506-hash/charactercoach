import { useCharacters } from "@/hooks/use-characters";
import { useCreateConversation } from "@/hooks/use-conversations";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { Loader2, MessageSquare } from "lucide-react";

export default function Dashboard() {
  const { data: characters, isLoading } = useCharacters();
  const createConversation = useCreateConversation();
  const [, setLocation] = useLocation();

  const handleStartChat = async (characterId: number) => {
    try {
      const conversation = await createConversation.mutateAsync(characterId);
      setLocation(`/chat/${conversation.id}`);
    } catch (error) {
      console.error("Failed to start conversation", error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10 animate-fade-in">
            <h1 className="font-display text-3xl font-bold text-foreground">Available Coaches</h1>
            <p className="mt-2 text-muted-foreground">Select a coach to start a new conversation.</p>
          </header>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {characters?.map((character, idx) => (
                <Card 
                  key={character.id} 
                  className={`overflow-hidden border-border/50 bg-card shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl animate-fade-in`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Avatar className="h-24 w-24 border-4 border-background shadow-2xl">
                        <AvatarImage src={character.avatarUrl || undefined} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                          {character.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl font-bold">{character.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-4">
                    <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                      {character.description}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="flex justify-center pb-6">
                    <Button 
                      onClick={() => handleStartChat(character.id)}
                      disabled={createConversation.isPending}
                      className="w-full max-w-[200px]"
                      variant="default"
                    >
                      {createConversation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="mr-2 h-4 w-4" />
                      )}
                      Start Chat
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
