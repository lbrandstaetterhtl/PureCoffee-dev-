import { useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { queryClient } from '@/lib/queryClient';

export function useWebSocket() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'new_post':
              queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
              toast({
                title: "New Post",
                description: "Someone just posted something new!",
              });
              break;
            case 'new_message':
              queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
              if (data.message) {
                toast({
                  title: "New Message",
                  description: `${data.message.sender.username}: ${data.message.content.substring(0, 50)}${data.message.content.length > 50 ? '...' : ''}`,
                });
              }
              break;
            case 'banned':
              toast({
                title: "Account Banned",
                description: data.message,
                variant: "destructive",
              });
              logoutMutation.mutate();
              break;
            case 'new_comment':
              queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
              break;
            case 'new_reaction':
              queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
              break;
            case 'new_follower':
              queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
              queryClient.invalidateQueries({ queryKey: ["/api/following"] });
              break;
            case 'new_notification':
              queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect...');
        // Attempt to reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close(); // This will trigger onclose and attempt reconnection
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, logoutMutation, toast, queryClient]);
}