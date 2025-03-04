import { Navbar } from "@/components/layout/navbar";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThumbsUp, ThumbsDown, Flag, Loader2, MessageCircle, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Report } from "@shared/schema";
import { Link } from "wouter";

type PostWithAuthor = Post & {
  author: { username: string };
  comments: Array<{
    id: number;
    content: string;
    author: { username: string };
    createdAt: string;
  }>;
  reactions: {
    likes: number;
    dislikes: number;
  };
  userReaction: {
    isLike: boolean;
  } | null;
};

export default function DiscussionsFeedPage() {
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts", "discussions"],
    queryFn: async () => {
      const res = await fetch("/api/posts?category=discussion&include=author,comments,reactions,userReaction");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const reactionMutation = useMutation<Post, Error, { postId: number; isLike: boolean }>({
    mutationFn: async ({ postId, isLike }) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/react`, { isLike });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", "discussions"] });
    },
  });

  const reportMutation = useMutation<Report, Error, { postId: number; reason: string }>({
    mutationFn: async ({ postId, reason }) => {
      const res = await apiRequest("POST", "/api/reports", { postId, reason });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/comments", { postId, content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", "discussions"] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    },
  });

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 pt-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Discussions Feed</h1>
            <Button asChild>
              <Link href="/post/discussions">Start Discussion</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts?.length === 0 ? (
            <Alert>
              <AlertDescription>
                No discussions yet. Be the first to start one!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {posts?.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{post.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                          <UserCircle className="h-4 w-4" />
                          <span>{post.author.username}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Posted on {format(new Date(post.createdAt), "PPP")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap mb-4">{post.content}</p>

                    {/* Comments Section */}
                    <div className="mt-6 space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Comments
                      </h3>

                      {/* Comment Form */}
                      <div className="flex gap-2">
                        <input
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Write a comment..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                              createCommentMutation.mutate({
                                postId: post.id,
                                content: (e.target as HTMLInputElement).value.trim()
                              });
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = (document.activeElement as HTMLInputElement);
                            if (input?.value?.trim()) {
                              createCommentMutation.mutate({
                                postId: post.id,
                                content: input.value.trim()
                              });
                              input.value = '';
                            }
                          }}
                        >
                          Post
                        </Button>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3">
                        {post.comments?.map((comment) => (
                          <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <UserCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">{comment.author.username}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), "PPp")}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant={post.userReaction?.isLike ? "default" : "ghost"}
                        size="sm"
                        onClick={() => reactionMutation.mutate({ postId: post.id, isLike: true })}
                      >
                        <ThumbsUp className={`h-4 w-4 mr-1 ${post.userReaction?.isLike ? "fill-current" : ""}`} />
                        <span>{post.reactions.likes}</span>
                      </Button>
                      <Button
                        variant={post.userReaction?.isLike === false ? "default" : "ghost"}
                        size="sm"
                        onClick={() => reactionMutation.mutate({ postId: post.id, isLike: false })}
                      >
                        <ThumbsDown className={`h-4 w-4 mr-1 ${post.userReaction?.isLike === false ? "fill-current" : ""}`} />
                        <span>{post.reactions.dislikes}</span>
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        reportMutation.mutate({
                          postId: post.id,
                          reason: "Inappropriate content",
                        })
                      }
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Report
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
