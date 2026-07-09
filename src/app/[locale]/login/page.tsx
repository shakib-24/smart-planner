import { signIn } from "@/../auth";
import { getTranslations } from "next-intl/server";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("login");

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center">
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: `/${locale}/dashboard` });
        }}
      >
        <button
          type="submit"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          {t("signInWithGoogle")}
        </button>
      </form>
    </div>
  );
}
