"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, fallback, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative inline-flex h-8 w-8 overflow-hidden rounded-full", className)}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="avatar" className="object-cover h-full w-full" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gray-200 text-xs font-medium text-gray-600">
          {fallback?.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  ),
);
Avatar.displayName = "Avatar";

export { Avatar, type AvatarProps };

export function AvatarImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} className={cn("object-cover h-full w-full", props.className)} />;
}

export function AvatarFallback({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex h-full w-full items-center justify-center bg-gray-200 text-xs font-medium text-gray-600", className)}>
      {children}
    </span>
  );
} 