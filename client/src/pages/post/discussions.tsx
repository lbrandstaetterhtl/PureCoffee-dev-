import { Navbar } from "@/components/layout/navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDiscussionPostSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as z from 'zod';
import { useLocation } from "wouter";

type FormData = z.infer<typeof insertDiscussionPostSchema>;

export default function CreateDiscussionPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<FormData>({
    resolver: zodResolver(insertDiscussionPostSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "discussion",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", "discussions"] });
      toast({
        title: "Discussion created",
        description: "Your discussion has been posted successfully.",
      });
      setLocation("/feed/discussions");
    },
  });

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 pt-24">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquarePlus className="h-5 w-5" />
                <span>Start a Discussion</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => createPostMutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="Share your thoughts..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending}
                    className="w-full"
                  >
                    {createPostMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Post Discussion"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
