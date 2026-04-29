import Link from "next/link";
import { Ban, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-lg border-border/60 bg-card/95">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Ban data-icon="inline-start" />
            <CardTitle>Access Denied</CardTitle>
          </div>
          <CardDescription>
            This account is signed in but does not belong to the Cognito admin or
            staff groups required for the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/">
              <ChevronLeft data-icon="inline-start" />
              Return to storefront
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
