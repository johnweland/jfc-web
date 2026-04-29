import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CartDrawer } from "@/components/ui/cart-drawer";
import { AddressesProvider } from "@/lib/addresses/context";
import { CartProvider } from "@/lib/cart/context";
import { FavoritesProvider } from "@/lib/favorites/context";

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AddressesProvider>
      <FavoritesProvider>
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </FavoritesProvider>
    </AddressesProvider>
  );
}
