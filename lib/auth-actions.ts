"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("uid");
  cookieStore.delete("role");
  redirect("/login");
}