// matcha/src/components/profile/ProfileForm.tsx
"use client";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { validateProfileField } from "@/lib/validators/clientValidator";
import type { PublicUser } from "@/lib/types";

type FormField = "username" | "first_name" | "last_name" | "email" | "gender" | "sex_pref" | "bio";
type FormData = Record<FormField, string>;
type FormErrors = Partial<Record<FormField, string>>;

const FIELDS: FormField[] = ["username", "first_name", "last_name", "email", "gender", "sex_pref", "bio"];
const BIO_MAX = 500;
// varchar(50) columns of users
const NAME_MAX = 50;
const fieldClass = "text-gray-900 border-gray-300";

export default function ProfileForm({
  user,
  onUserUpdate,
}: {
  user: Pick<PublicUser, FormField>;
  onUserUpdate?: (updates: Partial<FormData>) => void;
}) {
  const initialData = useMemo<FormData>(
    () => ({
      username: user.username || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      gender: user.gender || "",
      sex_pref: user.sex_pref || "",
      bio: user.bio || "",
    }),
    [user]
  );

  const [formData, setFormData] = useState(initialData);
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // 🔄 Update local form if user prop changes (adjusted during render, not in an effect)
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setFormData(initialData);
  }

  const changedFields = FIELDS.filter((f) => formData[f].trim() !== initialData[f].trim());
  const hasChanges = changedFields.length > 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCancel = () => {
    setFormData(initialData);
    setErrors({});
  };

  // email goes through the confirmation flow; returns false if not sent
  const requestEmailChange = async (newEmail: string) => {
    const confirm = window.confirm(
      "A confirmation email will be sent to your new address.\n\n" +
      "Your email will only change once you click the confirmation link. Continue?"
    );
    if (!confirm) return false;

    const res = await fetch("/api/e-mail/change-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_email: newEmail }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors((prev) => ({ ...prev, email: data.error || "Email change request failed" }));
      return false;
    }
    toast.success(`A confirmation link has been sent to ${newEmail}.`);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasChanges || saving) return;

    const values: Partial<FormData> = {};
    const newErrors: FormErrors = {};
    for (const field of changedFields) {
      const value = formData[field].trim();
      const { valid, error } = validateProfileField(field, value);
      if (!valid) newErrors[field] = error || "Invalid value";
      // the bio keeps its inner formatting, only names and identifiers are trimmed
      values[field] = field === "bio" ? formData.bio : value;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const { email: newEmail, ...profileUpdates } = values;
    setSaving(true);
    try {
      // email first: if it is cancelled or refused, nothing is saved and every edit is kept
      if (newEmail !== undefined) {
        if (!await requestEmailChange(newEmail)) return;
        // the email only changes once confirmed
        setFormData((prev) => ({ ...prev, email: initialData.email }));
      }

      if (Object.keys(profileUpdates).length > 0) {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileUpdates),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 409) setErrors({ username: data.error || "Username is already taken" });
          else toast.error(data.error || "Failed to update profile");
          return;
        }
        // resyncs the form from the updated user
        onUserUpdate?.(profileUpdates);
        toast.success("Profile updated");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const renderError = (field: FormField) =>
    errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>;

  const label = (field: FormField, text: string) => (
    <label htmlFor={`profile-${field}`} className="block text-sm font-medium text-gray-700 mb-1">
      {text}
    </label>
  );

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 pt-4">
        <div>
          {label("username", "Username")}
          <Input
            id="profile-username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            maxLength={20}
            autoComplete="username"
            className={fieldClass}
          />
          {renderError("username")}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {label("first_name", "First name")}
            <Input
              id="profile-first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              maxLength={NAME_MAX}
              autoComplete="given-name"
              className={fieldClass}
            />
            {renderError("first_name")}
          </div>
          <div>
            {label("last_name", "Last name")}
            <Input
              id="profile-last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              maxLength={NAME_MAX}
              autoComplete="family-name"
              className={fieldClass}
            />
            {renderError("last_name")}
          </div>
        </div>

        <div>
          {label("email", "Email")}
          <Input
            id="profile-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            className={fieldClass}
          />
          {renderError("email") || (
            <p className="text-gray-500 text-xs mt-1">
              A confirmation link will be sent to the new address.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            {label("gender", "Gender")}
            <select
              id="profile-gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 ${fieldClass}`}
            >
              <option value="" disabled hidden>Select...</option>
              <option value="M">Man</option>
              <option value="F">Woman</option>
            </select>
            {renderError("gender")}
          </div>
          <div>
            {label("sex_pref", "Interested in")}
            <select
              id="profile-sex_pref"
              name="sex_pref"
              value={formData.sex_pref}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 ${fieldClass}`}
            >
              <option value="" disabled hidden>Select...</option>
              <option value="M">Men</option>
              <option value="F">Women</option>
              <option value="B">Both</option>
            </select>
            {renderError("sex_pref")}
          </div>
        </div>

        <div>
          {label("bio", "Bio")}
          <Textarea
            id="profile-bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            maxLength={BIO_MAX}
            rows={4}
            placeholder="Tell people a bit about yourself"
            className={`resize-y ${fieldClass}`}
          />
          <div className="flex justify-between">
            <div>{renderError("bio")}</div>
            <span className="text-gray-400 text-xs mt-1">{formData.bio.length}/{BIO_MAX}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <Button
            type="submit"
            disabled={!hasChanges || saving}
            className="disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pink-600"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-4 border-t text-center">
        <a
          href="/profile/password"
          className="text-pink-600 hover:text-pink-800 underline font-medium"
        >
          Change your password
        </a>
      </div>
    </div>
  );
}
