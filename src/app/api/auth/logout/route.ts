import { SESSION_COOKIE } from "@/lib/session";
import { redirect303 } from "@/lib/http";

export async function POST() {
  const response = redirect303("/login");
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
