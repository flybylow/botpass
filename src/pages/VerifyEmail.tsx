import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const VerifyEmail = () => {
  const { verificationId } = useParams();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Mock verification - always succeeds after 1 second
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsVerified(true);
      } catch (error) {
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (verificationId) {
      verifyEmail();
    } else {
      setIsLoading(false);
    }
  }, [verificationId]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Verifying your email...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-12">
      {verificationId ? (
        isVerified ? (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-medium text-gray-900">Email verified!</h2>
            <p className="mt-2 text-gray-600">
              Your email has been successfully verified. You can now sign in to your account.
            </p>
            <div className="mt-6">
              <Link
                to="/signin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-medium text-gray-900">Verification failed</h2>
            <p className="mt-2 text-gray-600">
              We couldn't verify your email. The verification link may have expired or is invalid.
            </p>
            <div className="mt-6">
              <Link
                to="/signin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Try signing in
              </Link>
            </div>
          </>
        )
      ) : (
        <>
          <h2 className="text-2xl font-medium text-gray-900">Check your email</h2>
          <p className="mt-2 text-gray-600">
            We've sent you a verification link. Click the link in your email to verify your account.
          </p>
          <div className="mt-6">
            <Link
              to="/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Back to sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default VerifyEmail; 