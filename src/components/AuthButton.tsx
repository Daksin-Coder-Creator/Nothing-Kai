import React from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, LogOut } from 'lucide-react';
import { UserSession } from '../core/authEngine';

interface AuthButtonProps {
  session?: UserSession | null;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ session }) => {
  const [user] = useAuthState(auth);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);

  const signIn = async () => {
    if (isAuthenticating) return;
    
    setIsAuthenticating(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Ignore common user-cancelled errors
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error('Error signing in:', error);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const displayName = session?.name || user?.displayName || 'Sgambika User';
  const displayEmail = session?.email || user?.email || 'sgambika22@gmail.com';

  return user || session ? (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex flex-col items-end leading-tight mr-1">
        <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{displayName}</span>
        <span className="text-[9px] text-[#a0a0a0] truncate max-w-[100px]">{displayEmail}</span>
      </div>
      <button
        onClick={logOut}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] border border-[#2b2b2b] text-white font-bold text-xs shadow-md transition-all active:scale-95 group"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full border border-white/20" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-4 h-4 rounded-full bg-cyan-500 text-black font-extrabold text-[9px] flex items-center justify-center">
            {displayName[0] || 'U'}
          </div>
        )}
        <span className="hidden md:inline">Sign Out</span>
      </button>
    </div>
  ) : (
    <button
      onClick={signIn}
      disabled={isAuthenticating}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${isAuthenticating ? 'bg-neutral-200 text-black/50 cursor-not-allowed' : 'bg-white hover:bg-neutral-200 text-black'}`}
    >
      <LogIn className={`w-3.5 h-3.5 ${isAuthenticating ? 'animate-pulse' : ''}`} />
      <span>{isAuthenticating ? 'Signing in...' : 'Sign In'}</span>
    </button>
  );
};

