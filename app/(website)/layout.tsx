import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { getServerAuthState } from "@/lib/auth/server";
import { hasStaffAccess } from "@/lib/auth/shared";
import { CartProvider } from "@/lib/cart/context";
import { FavoritesProvider } from "@/lib/favorites/context";

export default async function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authState = await getServerAuthState();
  const canAccessAdmin = hasStaffAccess(authState);

  return (
    <FavoritesProvider>
      <CartProvider>
        <Navbar canAccessAdmin={canAccessAdmin} />
        <CartDrawer />
        <main className="flex-1">{children}</main>
        <Footer />
      </CartProvider>
    </FavoritesProvider>
  );
}
