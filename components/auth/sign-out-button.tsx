"use client";

import { useTransition } from "react";
import { signOut } from "aws-amplify/auth";
import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await signOut();
      router.replace("/sign-in");
      router.refresh();
    });
  }

  return (
    <Button className={className} disabled={isPending} onClick={handleClick} variant={variant}>
      {isPending ? (
        <LoaderCircle className="animate-spin" data-icon="inline-start" />
      ) : (
        <LogOut data-icon="inline-start" />
      )}
      Sign out
    </Button>
  );
}
