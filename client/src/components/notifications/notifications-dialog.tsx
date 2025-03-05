import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Loader2, Heart, ThumbsUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";

type NotificationWithUser = {
  id: number;
  type: string;
  fromUser: {
    username: string;
  };
  message: string;
  read: boolean;
  createdAt: string;
  postId?: number;
  commentId?: number;
};

export function NotificationsDialog() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: notifications, isLoading } = useQuery<NotificationWithUser[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
      if (!res.ok) throw new Error("Failed to mark as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Calculate unread notifications count
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_comment":
        return <MessageCircle className="h-4 w-4" />;
      case "comment_like":
        return <Heart className="h-4 w-4" />;
      case "post_like":
        return <ThumbsUp className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleNotificationClick = (notification: NotificationWithUser) => {
    // Navigate to the relevant post/comment
    if (notification.postId) {
      // Close dialog before navigation
      setOpen(false);
      // Mark as read
      if (!notification.read) {
        markAsReadMutation.mutate(notification.id);
      }
      // Navigate to the post
      // Note: You might need to adjust this path based on your routing structure
      setLocation(`/post/${notification.postId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : notifications?.length === 0 ? (
          <Alert>
            <AlertDescription>No notifications yet</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 mt-4">
            {notifications?.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors ${
                  notification.read ? "bg-muted/50" : "bg-muted"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <UserAvatar user={{ username: notification.fromUser.username }} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getNotificationIcon(notification.type)}
                    <p className="text-sm">
                      {notification.message}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), "PPp")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}