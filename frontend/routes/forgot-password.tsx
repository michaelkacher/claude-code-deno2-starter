/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */

import { PageProps } from "$fresh/server.ts";
import ForgotPasswordForm from "../islands/ForgotPasswordForm.tsx";

export default function ForgotPasswordPage(props: PageProps) {
  return <ForgotPasswordForm />;
}

