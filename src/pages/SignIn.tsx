import { SignIn } from '@clerk/react'

export default function SignInPage() {
  return (
    <div className="auth-page">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
    </div>
  )
}
