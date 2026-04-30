import { requireSignedIn } from "@/lib/auth/server";
import { AddressBook } from "@/components/account/address-book";

export default async function AddressesPage() {
  const user = await requireSignedIn("/account/addresses");

  return (
    <AddressBook
      customer={{
        customerId: user.cognitoSub ?? "",
        cognitoSub: user.cognitoSub ?? "",
        email: user.email ?? "",
        firstName: user.givenName ?? "",
        lastName: user.familyName ?? "",
      }}
    />
  );
}
