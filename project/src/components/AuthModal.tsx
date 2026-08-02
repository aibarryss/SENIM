import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  User,
  Heart,
  Store,
  Upload,
  CheckCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import type { UserRole, PartnerStoreType } from "@/lib/types";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

// Minimum 8 characters, at least one letter and one number.
const isPasswordStrong = (pwd: string) =>
  pwd.length >= 8 && /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd);

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<
    "choose" | "signup" | "login" | "reset" | "success"
  >("choose");
  const [role, setRole] = useState<UserRole>("donor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeType, setStoreType] = useState<PartnerStoreType>("supermarket");
  const [storeCity, setStoreCity] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successKind, setSuccessKind] = useState<
    "created" | "pending" | "partner" | "reset_sent" | "email_confirm"
  >("created");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleOptions = useMemo(
    () =>
      [
        {
          value: "donor" as const,
          label: t("auth.role.donor.label"),
          desc: t("auth.role.donor.desc"),
          icon: Heart,
        },
        {
          value: "susn" as const,
          label: t("auth.role.susn.label"),
          desc: t("auth.role.susn.desc"),
          icon: User,
        },
        {
          value: "partner" as const,
          label: t("auth.role.partner.label"),
          desc: t("auth.role.partner.desc"),
          icon: Store,
        },
      ] satisfies {
        value: UserRole;
        label: string;
        desc: string;
        icon: typeof User;
      }[],
    [t],
  );

  const reset = () => {
    setMode("choose");
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setStoreName("");
    setStoreType("supermarket");
    setStoreCity("");
    setStoreAddress("");
    setSelectedFile(null);
    setUploading(false);
    setSuccessKind("created");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Close on Escape for accessibility.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setMode("signup");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        setError(error);
      } else {
        handleClose();
      }
      return;
    }

    // mode === 'reset' — send password reset email (no password needed)
    if (mode === "reset") {
      const { error: resetError } = await resetPassword(email);
      setLoading(false);
      if (resetError) {
        setError(t("auth.resetPasswordError"));
        return;
      }
      setSuccessKind("reset_sent");
      setMode("success");
      return;
    }

    // mode === 'signup' — enforce password strength before calling Supabase
    if (!isPasswordStrong(password)) {
      setError(t("auth.passwordWeak"));
      setLoading(false);
      return;
    }

    const { error, user } = await signUp(
      email,
      password,
      role,
      name || undefined,
      phone || undefined,
    );
    if (error) {
      setError(
        error === "EMAIL_ALREADY_EXISTS" ? t("auth.emailAlreadyExists") : error,
      );
      setLoading(false);
      return;
    }

    // If Supabase has email confirmation enabled, the user won't be
    // immediately logged in — show a "check your email" notice instead
    // of the generic "account created" message.
    if (
      user &&
      user.identities &&
      user.identities.length > 0 &&
      !user.confirmed_at
    ) {
      setSuccessKind("email_confirm");
      setLoading(false);
      setMode("success");
      return;
    }

    // For SUSN users with a selected document: upload to private Storage
    // and insert a pending verification request. The verified flag is
    // NEVER set from the client — only a service-role backend process
    // can approve the request and flip profiles.verified to true.
    if (role === "susn" && selectedFile && user) {
      setUploading(true);
      const ext = selectedFile.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(path, selectedFile);
      if (uploadError) {
        setError(t("auth.uploadError"));
        setUploading(false);
        setLoading(false);
        return;
      }
      // No ai_result is sent from the client: the AI/OCR analysis is performed
      // by the backend (Edge Function) and stored server-side. Trusting a
      // client-supplied ai_result would let anyone fake a 'valid' check.
      const { error: insertError } = await supabase
        .from("susn_verification_requests")
        .insert({
          user_id: user.id,
          document_path: path,
          status: "pending",
        });
      if (insertError) {
        setError(t("auth.submitError"));
        setUploading(false);
        setLoading(false);
        return;
      }
      setUploading(false);
      setSuccessKind("pending");
    } else if (role === "partner" && user) {
      // Insert a real partner application with store details. Status is
      // 'pending' and can only be transitioned by a service-role backend
      // process (admin review tool / Edge Function). No review window is
      // promised in the UI because no automated review exists yet.
      const { error: insertError } = await supabase
        .from("partner_applications")
        .insert({
          user_id: user.id,
          store_name: storeName,
          store_type: storeType,
          city: storeCity,
          address: storeAddress,
          status: "pending",
        });
      if (insertError) {
        setError(t("auth.partnerApplicationError"));
        setLoading(false);
        return;
      }
      setSuccessKind("partner");
    } else {
      setSuccessKind("created");
    }

    setLoading(false);
    setMode("success");
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <h2 id="auth-modal-title" className="text-xl font-bold text-primary">
            {mode === "choose"
              ? t("auth.joinSenim")
              : mode === "login"
                ? t("auth.welcomeBack")
                : mode === "reset"
                  ? t("auth.resetPasswordTitle")
                  : mode === "success"
                    ? t("auth.accountCreated")
                    : t("common.createAccount")}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-[14px]">
              {error}
            </div>
          )}

          {mode === "choose" && (
            <div className="space-y-3">
              <p className="text-[14px] text-on-surface-variant mb-4">
                {t("auth.choosePrompt")}
              </p>
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
                      <p className="text-[14px] font-semibold text-primary">
                        {opt.label}
                      </p>
                      <p className="text-[14px] text-on-surface-variant">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
              <div className="pt-4 border-t border-outline-variant text-center">
                <p className="text-[14px] text-on-surface-variant">
                  {t("auth.alreadyHaveAccount")}{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-secondary font-semibold hover:underline"
                  >
                    {t("common.signIn")}
                  </button>
                </p>
              </div>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[14px] font-semibold mb-2">
                  {t("common.email")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold mb-2">
                  {t("common.password")}
                </label>
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
                {loading ? t("auth.signingIn") : t("common.signIn")}
              </button>
              <p className="text-center text-[14px] text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-secondary font-semibold hover:underline"
                >
                  {t("auth.forgotPassword")}
                </button>
              </p>
              <p className="text-center text-[14px] text-on-surface-variant">
                {t("auth.newToSenim")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="text-secondary font-semibold hover:underline"
                >
                  {t("common.createAccount")}
                </button>
              </p>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[14px] text-on-surface-variant mb-2">
                {t("auth.resetPasswordBody")}
              </p>
              <div>
                <label className="block text-[14px] font-semibold mb-2">
                  {t("common.email")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? t("auth.signingIn") : t("auth.resetPasswordTitle")}
              </button>
              <p className="text-center text-[14px] text-on-surface-variant">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-secondary font-semibold hover:underline"
                >
                  {t("common.signIn")}
                </button>
              </p>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-surface-container-low text-[14px] text-on-surface-variant mb-2">
                {t("auth.registeringAs")}{" "}
                <span className="font-semibold text-primary">
                  {role === "susn"
                    ? t("auth.role.susn.label")
                    : (roleOptions.find((o) => o.value === role)?.label ??
                      role)}
                </span>
              </div>

              <div>
                <label className="block text-[14px] font-semibold mb-2">
                  {t("common.email")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold mb-2">
                  {t("common.password")}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
                <p className="text-[12px] text-on-surface-variant mt-1">
                  {t("auth.passwordHint")}
                </p>
              </div>
              <div>
                <label className="block text-[14px] font-semibold mb-2">
                  {t("auth.displayName")}{" "}
                  {role === "donor" && (
                    <span className="text-on-surface-variant font-normal">
                      {t("auth.displayNameOptional")}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold mb-2">
                  {t("auth.phoneNumber")}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+7 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>

              {role === "susn" && (
                <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low">
                  <p className="text-[14px] font-semibold mb-2">
                    {t("auth.verificationTitle")}
                  </p>
                  <p className="text-[14px] text-on-surface-variant mb-1">
                    {t("auth.verificationBody")}
                  </p>
                  <p className="text-[12px] text-on-surface-variant mb-3">
                    {t("auth.verificationOptional")}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                  />
                  {!selectedFile ? (
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="w-full p-4 border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center gap-2 text-[14px] text-on-surface-variant hover:border-secondary hover:text-secondary transition-all"
                    >
                      <Upload size={20} /> {t("auth.uploadCertificate")}
                    </button>
                  ) : (
                    <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-surface-container-high">
                      <div className="flex items-center gap-2 text-[14px] text-on-surface-variant min-w-0">
                        <FileText
                          size={20}
                          className="shrink-0 text-secondary"
                        />
                        <span className="truncate">{selectedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="text-[14px] text-secondary font-semibold hover:underline shrink-0"
                      >
                        {t("auth.uploadCertificate")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {role === "partner" && (
                <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low space-y-3">
                  <p className="text-[14px] text-on-surface-variant">
                    {t("auth.partnerReview")}
                  </p>
                  <div>
                    <label className="block text-[14px] font-semibold mb-2">
                      {t("auth.partnerStoreName")}
                    </label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-semibold mb-2">
                      {t("auth.partnerStoreType")}
                    </label>
                    <select
                      required
                      value={storeType}
                      onChange={(e) =>
                        setStoreType(e.target.value as PartnerStoreType)
                      }
                      className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none bg-surface-container-lowest"
                    >
                      <option value="supermarket">
                        {t("auth.partnerStoreTypeOptions.supermarket")}
                      </option>
                      <option value="pharmacy">
                        {t("auth.partnerStoreTypeOptions.pharmacy")}
                      </option>
                      <option value="clothing">
                        {t("auth.partnerStoreTypeOptions.clothing")}
                      </option>
                      <option value="education">
                        {t("auth.partnerStoreTypeOptions.education")}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[14px] font-semibold mb-2">
                      {t("auth.partnerCity")}
                    </label>
                    <input
                      type="text"
                      required
                      value={storeCity}
                      onChange={(e) => setStoreCity(e.target.value)}
                      className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-semibold mb-2">
                      {t("auth.partnerAddress")}
                    </label>
                    <input
                      type="text"
                      required
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="w-full p-3 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    />
                  </div>
                </div>
              )}

              {role === "donor" && (
                <div className="p-4 rounded-xl bg-surface-container-low text-[14px] text-on-surface-variant">
                  {t("auth.donorBankNote")}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading || uploading
                  ? t("auth.creatingAccount")
                  : t("common.createAccount")}
              </button>
            </form>
          )}

          {mode === "success" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-secondary-container mx-auto flex items-center justify-center">
                <CheckCircle size={32} className="text-secondary" />
              </div>
              <h3 className="text-lg font-bold text-primary">
                {successKind === "pending"
                  ? t("auth.verificationPending")
                  : successKind === "partner"
                    ? t("auth.partnerApplicationPending")
                    : successKind === "reset_sent"
                      ? t("auth.resetPasswordSent")
                      : successKind === "email_confirm"
                        ? t("auth.accountCreated")
                        : t("auth.accountCreated")}
              </h3>
              {successKind === "pending" && (
                <p className="text-[14px] text-on-surface-variant">
                  {t("auth.accountCreatedPending")}
                </p>
              )}
              {successKind === "partner" && (
                <p className="text-[14px] text-on-surface-variant">
                  {t("auth.partnerApplicationSubmitted")}
                </p>
              )}
              {successKind === "email_confirm" && (
                <p className="text-[14px] text-on-surface-variant">
                  {t("auth.resetPasswordBody")}
                </p>
              )}
              <button
                onClick={handleClose}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                {t("common.done")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}