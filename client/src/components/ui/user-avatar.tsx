import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle, BadgeCheck } from "lucide-react";

type UserAvatarProps = {
  user: {
    username: string;
    verified?: boolean;
  };
  size?: "sm" | "md" | "lg";
};

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const badgeSizeClasses = {
    sm: "w-3 h-3 -bottom-0.5 -right-0.5",
    md: "w-4 h-4 -bottom-1 -right-1",
    lg: "w-5 h-5 -bottom-1 -right-1"
  };

  return (
    <div className="relative inline-block">
      <Avatar className={sizeClasses[size]}>
        <AvatarFallback>
          <UserCircle className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      {user.verified && (
        <div className={`absolute ${badgeSizeClasses[size]} bg-primary text-primary-foreground rounded-full flex items-center justify-center`}>
          <BadgeCheck className="w-full h-full" />
        </div>
      )}
    </div>
  );
}