import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import MainHeader from "@/components/main-header";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <MainHeader user={user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
