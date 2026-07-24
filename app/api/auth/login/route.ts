import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json(
      { message: "Username dan password wajib diisi" },
      { status: 400 },
    );
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!user || !user.password_hash) {
    return NextResponse.json(
      { message: "Username atau password salah" },
      { status: 401 },
    );
  }

  if (user.status !== "active") {
    return NextResponse.json(
      { message: "Akun kamu belum disetujui admin atau sudah tidak aktif" },
      { status: 403 },
    );  
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { message: "Username atau password salah" },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("uid", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
  cookieStore.set("role", user.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ role: user.role });
}