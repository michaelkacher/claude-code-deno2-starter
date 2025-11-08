/**
 * Resend Verification Email Page
 * Allows users to request a new verification email
 */

import { PageProps } from "$fresh/server.ts";
import ResendVerificationForm from "../islands/ResendVerificationForm.tsx";

export default function ResendVerificationPage(props: PageProps) {
  return <ResendVerificationForm />;
}

