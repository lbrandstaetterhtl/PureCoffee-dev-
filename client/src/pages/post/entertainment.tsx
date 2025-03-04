import { Navbar } from "@/components/layout/navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMediaPostSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, SmilePlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import * as z from 'zod';
import { useLocation } from "wouter";

type FormData = z.infer<typeof insertMediaPostSchema>;

export default function CreateEntertainmentPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<FormData>({
    resolver: zodResolver(insertMediaPostSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "entertainment",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", data.content);
      formData.append("category", data.category);

      const mediaFile = form.getValues("mediaFile");
      if (mediaFile?.[0]) {
        formData.append("media", mediaFile[0]);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", "media"] });
      toast({
        title: "Post created",
        description: "Your entertainment post has been shared successfully.",
      });
      setLocation("/feed/media");
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
                <SmilePlus className="h-5 w-5" />
                <span>Share Something Fun</span>
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
                            placeholder="Share a joke, a funny story, or something interesting!"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mediaFile"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Media (Image or Video)</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(e.target.files);
                                form.setValue("mediaType", file.type.startsWith("image/") ? "image" : "video");
                              }
                            }}
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
                      "Share"
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
