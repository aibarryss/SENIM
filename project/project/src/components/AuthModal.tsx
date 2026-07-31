import { useState } from 'react';
import { X, User, Heart, Store, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'choose' | 'signup' | 'login'>('choose');
  const [role, setRole] = useState<UserRole>('donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [docUploaded, setDocUploaded] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => {
    setMode('choose');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setDocUploaded(false);
    setVerifying(false);
    setVerified(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setMode('signup');
  };

  const handleUpload = () => {
    setDocUploaded(true);
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        setError(error);
      } else {
        handleClose();
      }
    } else {
      if (role === 'susn' && !verified) {
        setError('Please upload and complete AI verification of your documents first.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, role, name || undefined);
      setLoading(false);
      if (error) {
        setError(error);
      } else {
        handleClose();
      }
    }
  };

  const roleOptions: { value: UserRole; label: string; desc: string; icon: typeof User }[] = [
    { value: 'donor', label: 'Donor', desc: 'Help those in need with direct contributions', icon: Heart },
    { value: 'susn', label: 'Assistance Seeker', desc: 'Request verified aid from the community', icon: User },
    { value: 'partner', label: 'Partner Business', desc: 'Register your store as a redemption point', icon: Store },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <h2 className="text-xl font-bold text-primary">
            {mode === 'choose' ? 'Join SENIM' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <button onClick={handleClose} className="text-on-surface-variant hover:text-primary transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-[14px]">
              {error}
            </div>
          )}

          {mode === 'choose' && (
            <div className="space-y-3">
              <p className="text-[14px] text-on-surface-variant mb-4">Choose how you want to participate in SENIM:</p>
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleRoleSelect(opt.value)}
                    className="w-full p-4 rounded-xl border border-outline-variant hover:border-secondary hover:bg-secondary-container/10 transition-all flex items-center gap-4 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                      <Icon size={24} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-primary">{opt.label}</p>
                      <p className="text-[14px] text-on-surface-variant">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
              <div className="pt-4 border-t border-outline-variant text-center">
                <p className="text-[14px] text-on-surface-variant">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="text-secondary font-semibold hover:underline">
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[14px] font-semibold mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-center text-[14px] text-on-surface-variant">
                New to SENIM?{' '}
                <button type="button" onClick={() => setMode('choose')} className="text-secondary font-semibold hover:underline">
                  Create Account
                </button>
              </p>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-surface-container-low text-[14px] text-on-surface-variant mb-2">
                Registering as: <span className="font-semibold text-primary capitalize">{role === 'susn' ? 'Assistance Seeker' : role}</span>
              </div>

              <div>
                <label className="block text-[14px] font-semibold mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold mb-2">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold mb-2">
                  Display Name {role === 'donor' && <span className="text-on-surface-variant font-normal">(optional — stay anonymous)</span>}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+7 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>

              {role === 'susn' && (
                <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
                  <p className="text-[14px] font-semibold mb-2">AI Document Verification</p>
                  <p className="text-[14px] text-on-surface-variant mb-3">
                    Upload your eGov certificate (large family, disability, single parent, etc.). Our AI will verify seals, barcodes, and expiry dates.
                  </p>
                  {!docUploaded ? (
                    <button
                      type="button"
                      onClick={handleUpload}
                      className="w-full p-4 border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center gap-2 text-[14px] text-on-surface-variant hover:border-secondary hover:text-secondary transition-all"
                    >
                      <Upload size={20} /> Upload Certificate
                    </button>
                  ) : verifying ? (
                    <div className="flex items-center gap-2 text-[14px] text-secondary">
                      <Loader2 size={20} className="animate-spin" /> AI is verifying your document...
                    </div>
                  ) : verified ? (
                    <div className="flex items-center gap-2 text-[14px] text-secondary font-semibold">
                      <CheckCircle size={20} /> Document verified successfully
                    </div>
                  ) : null}
                </div>
              )}

              {role === 'partner' && (
                <div className="p-4 rounded-xl bg-surface-container-low text-[14px] text-on-surface-variant">
                  Your business registration will be reviewed by our team within 2-3 business days. You'll receive a digital partnership agreement via email.
                </div>
              )}

              {role === 'donor' && (
                <div className="p-4 rounded-xl bg-surface-container-low text-[14px] text-on-surface-variant">
                  You can register any Kaspi, Halyk, Forte, Jusan, or Freedom bank card after sign-up. 100% of your donation goes to the recipient's request.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
