"use client";

import { cn } from "cn";
import { Switch as SwitchPrimitive } from "radix-ui";
import * as React from "react";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent outline-none",
        "transition-colors duration-200 ease-in-out",
        "data-[state=checked]:bg-emerald-500",
        "data-[state=unchecked]:bg-slate-300",
        "dark:data-[state=unchecked]:bg-slate-600",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "default" ? "h-6 w-11" : "h-5 w-9",
        className,
      )}
      {...props}>
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block shrink-0 rounded-full bg-white shadow-sm",
          "transition-transform duration-200 ease-in-out",
          "motion-reduce:transition-none",
          "data-[state=unchecked]:translate-x-0",
          size === "default"
            ? "size-5 data-[state=checked]:translate-x-5"
            : "size-4 data-[state=checked]:translate-x-4",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
