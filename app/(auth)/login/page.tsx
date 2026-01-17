import { redirect } from 'next/navigation';

export default function LoginPage() {
  // Redirect to the signin page which handles the actual authentication
  redirect('/auth/signin');
}
