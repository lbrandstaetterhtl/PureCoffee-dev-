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
import { Bell, MessageCircle, Loader2, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification, Message } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

type NotificationWithUser = Notification & {
  fromUser: {
    username: string;
  };
};

export function NotificationsDialog() {
  const [open, setOpen] = useState(false);

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

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      console.log("Deleting notification client-side:", notificationId);
      const res = await apiRequest("DELETE", `/api/notifications/${notificationId}`);
      if (!res.ok) throw new Error("Failed to delete notification");
    },
    onSuccess: () => {
      console.log("Notification deleted successfully, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (e) => {
      console.error("Failed to delete notification client-side:", e);
    }
  });

  // Calculate unread notifications count
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

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
                className={`flex items-start gap-3 p-3 rounded-lg ${notification.read ? "bg-muted/50" : "bg-muted"
                  }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsReadMutation.mutate(notification.id);
                  }
                }}
              >
                <UserAvatar user={{ username: notification.fromUser.username }} size="sm" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{notification.fromUser.username}</span>{" "}
                    {notification.type === "new_follower"
                      ? "started following you"
                      : notification.type === "new_message"
                        ? "sent you a message"
                        : notification.type === "report_resolved"
                          ? "resolved your report"
                          : notification.type === "report_rejected"
                            ? "reviewed your report (no violation found)"
                            : "interacted with your post"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.createdAt), "PPp")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotificationMutation.mutate(notification.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}